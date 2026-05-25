import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'

const app = new Hono()
app.use('*', cors({ origin: '*' }))

// --- DB ---
let pool: mysql.Pool | null = null
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'salesroles',
    waitForConnections: true,
    connectionLimit: 10,
  })
  pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('candidate','company') NOT NULL DEFAULT 'candidate',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
  pool.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      company_website VARCHAR(500),
      location VARCHAR(255),
      work_type VARCHAR(50) DEFAULT 'Remote',
      seniority VARCHAR(100),
      sector VARCHAR(100),
      description TEXT,
      base_salary VARCHAR(100),
      ote VARCHAR(100),
      commission_structure TEXT,
      currency VARCHAR(10) DEFAULT 'USD',
      application_url VARCHAR(500),
      contact_email VARCHAR(255),
      featured TINYINT(1) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'live',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
} catch {}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'salesroles-dev-secret-change-in-prod'
)

// --- Email ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.titan.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) return // Skip if SMTP not configured
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'info@salesroles.co',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.warn('Email send failed:', err)
  }
}

// --- Stripe ---
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null

// --- Auth ---

app.post('/api/auth/register', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { name, email, password, role } = await c.req.json()
    if (!name || !email || !password) return c.json({ error: 'Missing required fields' }, 400)

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role || 'candidate']
    ) as any[]

    const userId = result.insertId.toString()
    const token = await new SignJWT({ id: userId, email, role: role || 'candidate' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Welcome email (fire and forget)
    sendEmail(
      email,
      'Welcome to SalesRoles.co',
      `<p>Hi ${name},</p><p>Welcome to SalesRoles.co. Every role. Full transparency.</p><p><a href="https://salesroles.co/jobs">Browse Jobs</a></p><p>The SalesRoles team</p>`
    )

    return c.json({ token, user: { id: userId, email, displayName: name, role: role || 'candidate' } })
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return c.json({ error: 'Email already registered' }, 409)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { email, password } = await c.req.json()
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]) as any[]
    const user = rows[0]
    if (!user) return c.json({ error: 'Invalid credentials' }, 401)

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

    const token = await new SignJWT({ id: user.id.toString(), email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    return c.json({ token, user: { id: user.id.toString(), email: user.email, displayName: user.name, role: user.role } })
  } catch {
    return c.json({ error: 'Login failed' }, 500)
  }
})

app.get('/api/auth/me', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [String(payload.id)]) as any[]
    const user = rows[0]
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user: { id: user.id.toString(), email: user.email, displayName: user.name, role: user.role } })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// --- Admin ---

app.post('/api/admin/seed', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { password } = await c.req.json()
    if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const { seedJobs } = await import('./seed-jobs.js')
    const result = await seedJobs(pool)
    return c.json({ ok: true, message: `Seed complete. ${result.inserted}/${result.total} jobs inserted.` })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

app.post('/api/admin/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (password === adminPassword) {
      return c.json({ ok: true })
    }
    return c.json({ ok: false }, 401)
  } catch {
    return c.json({ ok: false }, 400)
  }
})

// --- Payments ---

app.post('/api/payments/create-checkout-session', async (c) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Stripe not configured. Contact info@salesroles.co to post your job.' }, 503)
  }
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 503)
  try {
    const { plan } = await c.req.json()

    const prices: Record<string, number> = {
      standard: 9900,
      featured: 24900,
      bundle: 19800,
    }

    const productNames: Record<string, string> = {
      standard: 'Standard Job Listing',
      featured: 'Featured Job Listing',
      bundle: 'Bundle: 3 Listings for 2',
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productNames[plan] || 'Job Listing' },
          unit_amount: prices[plan] || 9900,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.SITE_URL || 'https://salesroles.co'}/post-job/success`,
      cancel_url: `${process.env.SITE_URL || 'https://salesroles.co'}/post-job`,
    })

    return c.json({ url: session.url })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// --- Jobs ---

const SALES_KEYWORDS = ['sales', 'account executive', 'sdr', 'bdr', 'business development', 'account manager', 'revenue', 'closing', 'customer success', 'representative']
const LANG_SUFFIX = /\s*-\s*(English|German|French|Spanish|Dutch|Italian|Portuguese|Polish|Czech|Romanian|Hungarian|Turkish|Arabic|Japanese|Korean|Chinese)$/i

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return url
  }
}

app.get('/api/jobs', async (c) => {
  if (!pool) return c.json({ jobs: [] })
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM jobs WHERE status = 'live' ORDER BY featured DESC, created_at DESC"
    ) as any[]
    const jobs = (rows as any[]).map(row => ({
      ...row,
      company: row.company_name,
      job_type: row.work_type,
      application_url: row.application_url || '',
      contact_email: row.contact_email || '',
      featured: !!row.featured,
    }))
    return c.json({ jobs })
  } catch {
    return c.json({ jobs: [] })
  }
})

app.get('/api/jobs/external', async (c) => {
  try {
    const res = await fetch('https://arbeitnow.com/api/job-board-api')
    const data = await res.json()
    const salesJobs = data.data.filter((job: any) =>
      SALES_KEYWORDS.some(kw =>
        job.title.toLowerCase().includes(kw) ||
        job.tags?.some((t: string) => t.toLowerCase().includes(kw))
      )
    )
    const mapped = salesJobs.map((job: any) => {
      let domain = ''
      try { domain = extractDomain(job.url) } catch {}
      return {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company_name: job.company_name.replace(LANG_SUFFIX, '').trim(),
        company_website: domain ? `https://${domain}` : '',
        location: job.location || 'Remote',
        work_type: job.remote ? 'Remote' : 'On-site',
        sector: 'Sales',
        seniority: 'Mid-Level',
        description: job.description,
        base_salary: null,
        ote: null,
        apply_url: job.url,
        via_partner: true,
        created_at: job.created_at,
        domain,
      }
    })
    return c.json(mapped)
  } catch (e) {
    console.error('Arbeitnow fetch failed:', e)
    return c.json([])
  }
})

app.get('/api/jobs/:id', async (c) => {
  const id = c.req.param('id')

  if (id.startsWith('arbeitnow-')) {
    const slug = id.replace('arbeitnow-', '')
    try {
      const res = await fetch('https://arbeitnow.com/api/job-board-api')
      const data = await res.json()
      const job = data.data.find((j: any) => j.slug === slug)
      if (!job) return c.json({ error: 'Job not found' }, 404)
      let domain = ''
      try { domain = new URL(job.url).hostname.replace('www.', '') } catch {}
      const cleanName = job.company_name.replace(LANG_SUFFIX, '').trim()
      return c.json({ job: {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: cleanName,
        company_name: cleanName,
        company_website: domain ? `https://${domain}` : '',
        location: job.location || 'Remote',
        job_type: job.remote ? 'Remote' : 'On-site',
        work_type: job.remote ? 'Remote' : 'On-site',
        description: job.description,
        application_url: job.url,
        base_salary: null,
        ote: null,
        via_partner: true,
        created_at: job.created_at,
        domain,
        sector: 'Sales',
        seniority: 'Mid-Level',
        currency: null,
        commission_structure: null,
        status: 'live',
        featured: false,
      }})
    } catch {
      return c.json({ error: 'Failed to fetch job' }, 500)
    }
  }

  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const [rows] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [id]) as any[]
    const row = (rows as any[])[0]
    if (!row) return c.json({ error: 'Job not found' }, 404)
    return c.json({ job: { ...row, company: row.company_name, job_type: row.work_type, featured: !!row.featured } })
  } catch {
    return c.json({ error: 'Failed to fetch job' }, 500)
  }
})

// --- Dashboard ---

app.get('/api/dashboard/stats', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    await jwtVerify(auth.slice(7), JWT_SECRET)
    return c.json({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

app.put('/api/auth/profile', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const { name } = await c.req.json()
    if (!name?.trim()) return c.json({ error: 'Name is required' }, 400)
    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), String(payload.id)])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Update failed' }, 500)
  }
})

// --- Static file serving (production) ---

// Serve static assets from the Vite build output
app.use('/assets/*', serveStatic({ root: './dist' }))

// SPA catch-all: serve index.html for all unmatched routes
app.get('*', (c) => {
  try {
    const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8')
    return c.html(html)
  } catch {
    return c.text('App not built. Run npm run build first.', 404)
  }
})

// --- Server ---

const port = parseInt(process.env.PORT || '4000')
serve({ fetch: app.fetch, port }, () => console.log(`Server running on http://localhost:${port}`))

export default app
