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
    console.error('Registration error:', err)
    if (err.code === 'ER_DUP_ENTRY') return c.json({ error: 'Email already registered' }, 409)
    return c.json({ error: 'Registration failed', detail: String(err) }, 500)
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
    return c.json({ error: 'Stripe not configured on server.' }, 503)
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

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return url
  }
}

app.get('/api/jobs', async (c) => {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')
    const result = await response.json()
    const salesJobs = result.data
      .filter((job: any) => SALES_KEYWORDS.some(kw => job.title.toLowerCase().includes(kw)))
      .map((job: any) => ({
        id: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.location,
        job_type: job.remote ? 'Remote' : 'On-site',
        description: job.description,
        url: job.url,
        created_at: job.created_at,
      }))
    const uniqueJobs = Array.from(new Map(salesJobs.map((j: any) => [j.id, j])).values())
    return c.json({ jobs: uniqueJobs })
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
        company_name: job.company_name,
        company_website: domain ? `https://${domain}` : '',
        location: job.location || 'Remote',
        work_type: job.remote ? 'Remote' : 'On-site',
        sector: 'Sales',
        seniority: 'Mid-Level',
        description: job.description,
        base_salary: job.salary || 'Salary Not Disclosed',
        ote: job.ote || 'Salary Not Disclosed',
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

// --- Health check ---

app.get('/api/health', async (c) => {
  try {
    if (!pool) return c.json({ status: 'error', detail: 'No database pool' }, 500)
    const [rows] = await pool.execute('SELECT 1 as ok')
    return c.json({ status: 'ok', db: 'connected' })
  } catch (error) {
    return c.json({ status: 'error', detail: String(error) }, 500)
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
