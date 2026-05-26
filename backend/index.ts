import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import path, { extname } from 'path'
import { readFileSync, createReadStream, existsSync } from 'fs'
import { promises as fsPromises } from 'fs'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '..', 'dist')

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
    CREATE TABLE IF NOT EXISTS subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
  pool.execute(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      job_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_save (user_id, job_id)
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
      company_id INT DEFAULT NULL,
      screening_questions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN company_id INT DEFAULT NULL`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN screening_questions TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN external_id VARCHAR(255) DEFAULT NULL`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN source VARCHAR(50) DEFAULT 'manual'`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN url VARCHAR(500) DEFAULT NULL`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL`).catch(() => {})
  pool.execute(`CREATE UNIQUE INDEX idx_jobs_external_id ON jobs (external_id)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN cv_filename VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN headline VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN location VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN years_in_sales INT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN total_revenue VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN companies_closed INT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN current_roles TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN looking_for TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN bio TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN work_history TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN is_public TINYINT DEFAULT 0`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN is_pro TINYINT DEFAULT 0`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(50)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN target_role VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN years_experience INT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN skills TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN target_salary VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN availability VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN achievements TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN industries TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN deal_sizes TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN sales_methodology TEXT`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN current_ote VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN profile_slug VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN company_name VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users MODIFY COLUMN is_public TINYINT DEFAULT 1`).catch(() => {})
  // Backfill slugs for existing users who have none
  pool.execute(`
    SELECT id, name FROM users WHERE profile_slug IS NULL OR profile_slug = ''
  `).then(([rows]: any) => {
    for (const row of (rows as any[])) {
      const namePart = (row.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
      const slug = `${namePart}-${randomBytes(3).toString('hex')}`
      pool!.execute('UPDATE users SET profile_slug = ? WHERE id = ?', [slug, row.id]).catch(() => {})
    }
  }).catch(() => {})
  pool.execute(`
    CREATE TABLE IF NOT EXISTS profile_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      viewer_id INT,
      candidate_id INT NOT NULL,
      action VARCHAR(50) DEFAULT 'view',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
  pool.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL,
      candidate_id INT NOT NULL,
      candidate_name VARCHAR(255),
      candidate_email VARCHAR(255),
      cover_note TEXT,
      cv_filename VARCHAR(255),
      screening_answers TEXT,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
  pool.execute(`ALTER TABLE applications ADD COLUMN screening_answers TEXT`).catch(() => {})
  // Add viewer_name and viewer_company columns to profile_views if missing
  pool.execute(`ALTER TABLE profile_views ADD COLUMN viewer_name VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE profile_views ADD COLUMN viewer_company VARCHAR(255)`).catch(() => {})
  // Job reports table
  pool.execute(`
    CREATE TABLE IF NOT EXISTS job_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL,
      reporter_id INT,
      reporter_email VARCHAR(255),
      reason VARCHAR(255) NOT NULL,
      details TEXT,
      status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
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
      from: `"SalesRoles.co" <${process.env.SMTP_FROM || 'info@salesroles.co'}>`,
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

// --- Stripe Webhook ---

app.post('/api/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature')
  const body = await c.req.text()
  if (!process.env.STRIPE_WEBHOOK_SECRET || !stripe) {
    return c.json({ error: 'Webhook not configured' }, 500)
  }
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return c.json({ error: 'Webhook signature verification failed' }, 400)
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const jobId = session.metadata?.jobId
    const userId = session.metadata?.userId
    if (userId && session.mode === 'subscription' && pool) {
      await pool.execute('UPDATE users SET is_pro = 1 WHERE id = ?', [userId]).catch(() => {})
    }
    if (jobId && pool) {
      await pool.execute(
        "UPDATE jobs SET status = 'pending', expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?",
        [jobId]
      ).catch((err: any) => console.error('Failed to update job status:', err))
      console.log(`Job ${jobId} moved to pending after payment — expires in 30 days`)
    }
  }
  return c.json({ received: true })
})

// --- Auth ---

app.post('/api/auth/register', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { name, email, password, role } = await c.req.json()
    if (!name || !email || !password) return c.json({ error: 'Missing required fields' }, 400)

    const hash = await bcrypt.hash(password, 10)
    const namePart = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    const profileSlug = `${namePart}-${randomBytes(3).toString('hex')}`
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, is_public, profile_slug) VALUES (?, ?, ?, ?, 1, ?)',
      [name, email, hash, role || 'candidate', profileSlug]
    ) as any[]

    const userId = result.insertId.toString()
    const token = await new SignJWT({ id: userId, email, role: role || 'candidate' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Welcome email (fire and forget)
    if (role === 'company') {
      sendEmail(
        email,
        'Welcome to SalesRoles.co — Start Hiring Top Sales Talent',
        `<p>Hi ${name},</p><p>Welcome to SalesRoles.co. You are now set up to post sales roles with full compensation transparency.</p><p>Here is how to get started:</p><ul><li>Post your first job listing in minutes</li><li>Every listing shows base salary, OTE, and commission upfront</li><li>Attract serious candidates who already know the deal</li></ul><p><a href="https://salesroles.co/post-job">Post Your First Job</a></p><p>Questions? Reply to this email and we will get back to you within 1 business day.</p><p>The SalesRoles.co team</p>`
      )
    } else {
      sendEmail(
        email,
        'Welcome to SalesRoles.co',
        `<p>Hi ${name},</p><p>Welcome to SalesRoles.co. Every role. Full transparency.</p><p>Browse sales roles with base salary, OTE, and commission shown upfront. No more guessing.</p><p><a href="https://salesroles.co/jobs">Browse Jobs</a></p><p>The SalesRoles.co team</p>`
      )
    }

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
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, headline, location, cv_filename, avatar_url, is_pro, is_public,
              phone, linkedin_url, target_role, years_experience, skills, target_salary,
              availability, achievements, industries, deal_sizes, sales_methodology, current_ote, profile_slug
       FROM users WHERE id = ?`,
      [String(payload.id)]
    ) as any[]
    const user = (rows as any[])[0]
    if (!user) return c.json({ error: 'User not found' }, 404)

    // Generate slug if missing
    if (!user.profile_slug) {
      const namePart = (user.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
      user.profile_slug = `${namePart}-${randomBytes(3).toString('hex')}`
      await pool.execute('UPDATE users SET profile_slug = ? WHERE id = ?', [user.profile_slug, user.id]).catch(() => {})
    }

    let company_name: string | null = null
    if (user.role === 'company') {
      const [jobRows] = await pool.execute(
        'SELECT company_name FROM jobs WHERE company_id = ? LIMIT 1',
        [String(payload.id)]
      ) as any[]
      company_name = (jobRows as any[])[0]?.company_name || null
    }

    const safeParse = (v: any) => { try { return v ? JSON.parse(v) : [] } catch { return [] } }

    return c.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      displayName: user.name,
      role: user.role,
      headline: user.headline || null,
      location: user.location || null,
      cv_filename: user.cv_filename || null,
      avatar_url: user.avatar_url || null,
      is_pro: !!user.is_pro,
      is_public: !!user.is_public,
      phone: user.phone || null,
      linkedin_url: user.linkedin_url || null,
      target_role: user.target_role || null,
      years_experience: user.years_experience || null,
      skills: safeParse(user.skills),
      target_salary: user.target_salary || null,
      availability: user.availability || null,
      achievements: user.achievements || null,
      industries: safeParse(user.industries),
      deal_sizes: safeParse(user.deal_sizes),
      sales_methodology: safeParse(user.sales_methodology),
      current_ote: user.current_ote || null,
      profile_slug: user.profile_slug || null,
      company_name,
    })
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
    return c.json({ error: 'Stripe not configured. Contact info@salesroles.co to post your job.' }, 503)
  }
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 503)
  try {
    const { plan, jobId } = await c.req.json()

    const prices: Record<string, number> = {
      standard: 9900,
      featured: 24900,
    }

    const productNames: Record<string, string> = {
      standard: 'Standard Job Listing',
      featured: 'Featured Job Listing',
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
      metadata: {
        jobId: jobId || '',
        plan: plan || 'standard',
      },
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
      "SELECT * FROM jobs WHERE status = 'live' AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY featured DESC, created_at DESC"
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

// --- Admin Stats ---

app.get('/api/admin/stats', async (c) => {
  if (!pool) return c.json({ liveListings: 0, totalRevenue: 0, candidates: 0, pendingReview: 0 })
  try {
    const [jobs] = await pool.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'live'") as any[]
    const [pending] = await pool.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'") as any[]
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users') as any[]
    return c.json({
      liveListings: (jobs as any[])[0]?.count || 0,
      totalRevenue: 0,
      candidates: (users as any[])[0]?.count || 0,
      pendingReview: (pending as any[])[0]?.count || 0,
    })
  } catch {
    return c.json({ liveListings: 0, totalRevenue: 0, candidates: 0, pendingReview: 0 })
  }
})

app.delete('/api/admin/jobs/:id', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { password } = await c.req.json()
    if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const id = c.req.param('id')
    await pool.execute('DELETE FROM jobs WHERE id = ?', [id])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Delete failed' }, 500)
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

// --- Subscribe ---

app.post('/api/subscribe', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { email } = await c.req.json()
    if (!email || !email.includes('@')) return c.json({ error: 'Invalid email' }, 400)
    await pool.execute('INSERT IGNORE INTO subscribers (email) VALUES (?)', [email])
    sendEmail(
      email,
      'You are on the list. SalesRoles.co Weekly Job Alerts',
      `<p>Hi,</p><p>You are now subscribed to the SalesRoles.co weekly job alert. Every Monday morning you will get the latest sales roles with full compensation transparency direct to your inbox.</p><p>No spam. Unsubscribe anytime by replying to this email.</p><p>The SalesRoles.co team</p>`
    )
    sendEmail(
      'info@salesroles.co',
      'New subscriber on SalesRoles.co',
      `<p>New subscriber: <strong>${email}</strong></p><p>Subscribed at: ${new Date().toISOString()}</p>`
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Subscribe failed' }, 500)
  }
})

// --- Saved Jobs ---

app.get('/api/saved-jobs', async (c) => {
  if (!pool) return c.json({ jobs: [] })
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [rows] = await pool.execute(
      `SELECT j.*, j.company_name AS company, j.work_type AS job_type
       FROM jobs j
       INNER JOIN saved_jobs s ON j.id = s.job_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId]
    )
    return c.json({ jobs: rows })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

app.post('/api/saved-jobs', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const { jobId } = await c.req.json()
    const [existing] = await pool.execute(
      'SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?',
      [userId, jobId]
    )
    if ((existing as any[]).length > 0) {
      await pool.execute('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId])
      return c.json({ saved: false })
    }
    await pool.execute('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [userId, jobId])
    return c.json({ saved: true })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// --- Create Job ---

app.post('/api/jobs', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  let userId: string
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    userId = String(payload.id)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const job = await c.req.json()
    const id = `job-${Date.now()}`
    const status = job.status || 'pending'
    await pool.execute(
      `INSERT INTO jobs (id, title, company_name, company_website, location, work_type, seniority, sector, description, base_salary, ote, commission_structure, currency, status, company_id, screening_questions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, job.title, job.company_name, job.company_website, job.location, job.work_type, job.seniority, job.sector, job.description, job.base_salary, job.ote, job.commission_structure || '', job.currency || 'USD', status, userId, JSON.stringify(job.screening_questions?.filter(Boolean) || [])]
    )
    return c.json({ ok: true, id })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create job' }, 500)
  }
})

// --- Admin job moderation ---

app.get('/api/admin/pending-jobs', async (c) => {
  if (!pool) return c.json([])
  try {
    const [jobs] = await pool.execute(
      "SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC"
    ) as any[]
    return c.json(jobs)
  } catch {
    return c.json([])
  }
})

app.post('/api/admin/jobs/:id/approve', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const id = c.req.param('id')
  try {
    // Set expires_at to 30 days from now only if not already set (i.e. payment didn't set it)
    await pool.execute(
      "UPDATE jobs SET status = 'live', expires_at = COALESCE(expires_at, DATE_ADD(NOW(), INTERVAL 30 DAY)) WHERE id = ?",
      [id]
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Approve failed' }, 500)
  }
})

app.post('/api/admin/jobs/:id/reject', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const id = c.req.param('id')
  try {
    await pool.execute("UPDATE jobs SET status = 'rejected' WHERE id = ?", [id])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Reject failed' }, 500)
  }
})

app.get('/api/admin/candidates', async (c) => {
  if (!pool) return c.json([])
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
        (SELECT company_name FROM jobs WHERE company_id = u.id LIMIT 1) as company_name
       FROM users u
       ORDER BY u.created_at DESC`
    ) as any[]
    return c.json(users)
  } catch {
    return c.json([])
  }
})

app.get('/api/admin/subscribers', async (c) => {
  if (!pool) return c.json([])
  try {
    const [rows] = await pool.execute(
      'SELECT email, created_at FROM subscribers ORDER BY created_at DESC'
    ) as any[]
    return c.json(rows)
  } catch {
    return c.json([])
  }
})

// --- Company dashboard ---

app.get('/api/company/pending-jobs', async (c) => {
  if (!pool) return c.json([])
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [jobs] = await pool.execute(
      "SELECT * FROM jobs WHERE (status = 'pending' OR status = 'draft') AND company_id = ? ORDER BY created_at DESC",
      [userId]
    ) as any[]
    return c.json(jobs)
  } catch {
    return c.json([])
  }
})

// --- Applications ---

app.post('/api/applications', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  let userId: string, userEmail: string
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    userId = String(payload.id)
    userEmail = String(payload.email)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const formData = await c.req.formData()
    const jobId = formData.get('jobId') as string
    const coverLetter = (formData.get('coverLetter') as string) || ''
    const answers = (formData.get('answers') as string) || '[]'
    const cvFile = formData.get('cv') as File | null
    const cvFilename = cvFile ? cvFile.name : null

    const [userRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [userId]) as any[]
    const userName = (userRows as any[])[0]?.name || ''

    const [existing] = await pool.execute(
      'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
      [jobId, userId]
    ) as any[]
    if ((existing as any[]).length > 0) {
      return c.json({ error: 'Already applied' }, 400)
    }

    await pool.execute(
      'INSERT INTO applications (job_id, candidate_id, candidate_name, candidate_email, cover_note, cv_filename, screening_answers) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [jobId, userId, userName, userEmail, coverLetter, cvFilename, answers]
    )

    const [jobRows] = await pool.execute(
      'SELECT j.title, u.email as company_email, u.name as company_name FROM jobs j JOIN users u ON j.company_id = u.id WHERE j.id = ?',
      [jobId]
    ) as any[]
    const jobInfo = (jobRows as any[])[0]
    if (jobInfo?.company_email) {
      sendEmail(
        jobInfo.company_email,
        `New application for ${jobInfo.title}`,
        `<p>Hi ${jobInfo.company_name},</p><p>New application for <strong>${jobInfo.title}</strong>.</p><p><strong>Applicant:</strong> ${userName} (${userEmail})</p>${coverLetter ? `<p><strong>Cover letter:</strong> ${coverLetter}</p>` : ''}<p><a href="https://salesroles.co/dashboard">View in dashboard</a></p><p>The SalesRoles.co team</p>`
      )
    }

    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to submit application' }, 500)
  }
})

app.get('/api/company/applications', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  let userId: string
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    userId = String(payload.id)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const [apps] = await pool.execute(
      `SELECT a.*, j.title as job_title, j.id as job_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = ?
       ORDER BY a.created_at DESC`,
      [userId]
    ) as any[]
    return c.json(apps)
  } catch {
    return c.json([])
  }
})

app.get('/api/company/applications/:jobId', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  let userId: string
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    userId = String(payload.id)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const jobId = c.req.param('jobId')
    const [apps] = await pool.execute(
      `SELECT a.* FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.job_id = ? AND j.company_id = ?
       ORDER BY a.created_at DESC`,
      [jobId, userId]
    ) as any[]
    return c.json(apps)
  } catch {
    return c.json([])
  }
})

// --- Candidate CV upload ---

app.post('/api/candidate/upload-cv', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const formData = await c.req.formData()
    const file = formData.get('cv') as File | null
    if (!file) return c.json({ error: 'No file' }, 400)
    const filename = file.name
    await pool.execute('UPDATE users SET cv_filename = ? WHERE id = ?', [filename, userId])
    return c.json({ ok: true, filename })
  } catch {
    return c.json({ error: 'Upload failed' }, 500)
  }
})

app.delete('/api/candidate/delete-cv', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    await pool.execute('UPDATE users SET cv_filename = NULL WHERE id = ?', [String(payload.id)])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

app.post('/api/candidate/upload-avatar', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const formData = await c.req.formData()
    const file = formData.get('avatar') as File | null
    if (!file) return c.json({ error: 'No file' }, 400)
    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg'
    const filename = `avatar-${payload.id}-${Date.now()}.${ext}`
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars')
    await fsPromises.mkdir(uploadsDir, { recursive: true })
    const arrayBuffer = await file.arrayBuffer()
    await fsPromises.writeFile(path.join(uploadsDir, filename), Buffer.from(arrayBuffer))
    await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [filename, String(payload.id)])
    return c.json({ ok: true, avatar_url: filename })
  } catch (err) {
    console.error('Avatar upload error:', err)
    return c.json({ error: 'Upload failed' }, 500)
  }
})

// --- Candidate profile update ---

app.put('/api/candidate/profile', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const data = await c.req.json()
    await pool.execute(
      `UPDATE users SET
        headline=?, location=?, years_in_sales=?, total_revenue=?, companies_closed=?,
        current_roles=?, looking_for=?, bio=?, work_history=?, is_public=?,
        phone=?, linkedin_url=?, target_role=?, years_experience=?, skills=?,
        target_salary=?, availability=?, achievements=?, industries=?, deal_sizes=?,
        sales_methodology=?, current_ote=?
       WHERE id=?`,
      [
        data.headline || null,
        data.location || null,
        data.years_in_sales || null,
        data.total_revenue || null,
        data.companies_closed || null,
        JSON.stringify(data.current_roles || []),
        JSON.stringify(data.looking_for || []),
        data.bio || null,
        JSON.stringify(data.work_history || []),
        data.is_public ? 1 : 0,
        data.phone || null,
        data.linkedin_url || null,
        data.target_role || null,
        data.years_experience || null,
        JSON.stringify(data.skills || []),
        data.target_salary || null,
        data.availability || null,
        data.achievements || null,
        JSON.stringify(data.industries || []),
        JSON.stringify(data.deal_sizes || []),
        JSON.stringify(data.sales_methodology || []),
        data.current_ote || null,
        userId,
      ]
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Update failed' }, 500)
  }
})

app.get('/api/candidate/me', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, headline, location, years_in_sales, total_revenue, companies_closed,
              current_roles, looking_for, bio, work_history, cv_filename, avatar_url, is_public, is_pro,
              phone, linkedin_url, target_role, years_experience, skills, target_salary, availability,
              achievements, industries, deal_sizes, sales_methodology, current_ote, profile_slug
       FROM users WHERE id = ?`,
      [userId]
    ) as any[]
    const user = (rows as any[])[0]
    if (!user) return c.json({ error: 'Not found' }, 404)
    return c.json(user)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// --- Public candidate search & profiles ---

app.get('/api/candidates', async (c) => {
  if (!pool) return c.json({ candidates: [], total: 0, page: 1, pages: 0 })
  try {
    const search = c.req.query('search') || ''
    const targetRole = c.req.query('target_role') || ''
    const yearsExp = c.req.query('years_experience') || ''
    const availability = c.req.query('availability') || ''
    const industry = c.req.query('industry') || ''
    const dealSize = c.req.query('deal_size') || ''
    const methodology = c.req.query('methodology') || ''
    const location = c.req.query('location') || ''
    const sortBy = c.req.query('sort_by') || 'relevance'
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const limit = 12
    const offset = (page - 1) * limit

    let where = `WHERE u.role = 'candidate' AND (u.is_public = 1 OR u.is_public IS NULL)`
    const params: any[] = []

    if (search) {
      where += ` AND (u.name LIKE ? OR u.headline LIKE ? OR u.target_role LIKE ? OR u.skills LIKE ? OR u.bio LIKE ?)`
      const s = `%${search}%`
      params.push(s, s, s, s, s)
    }
    if (targetRole) { where += ` AND u.target_role = ?`; params.push(targetRole) }
    if (yearsExp) { where += ` AND u.years_experience = ?`; params.push(yearsExp) }
    if (availability) { where += ` AND u.availability = ?`; params.push(availability) }
    if (industry) { where += ` AND u.industries LIKE ?`; params.push(`%${industry}%`) }
    if (dealSize) { where += ` AND u.deal_sizes LIKE ?`; params.push(`%${dealSize}%`) }
    if (methodology) { where += ` AND u.sales_methodology LIKE ?`; params.push(`%${methodology}%`) }
    if (location) { where += ` AND u.location LIKE ?`; params.push(`%${location}%`) }

    const baseOrder = `u.is_pro DESC, CASE WHEN u.availability = 'Actively looking' THEN 1 WHEN u.availability = 'Open to opportunities' THEN 2 ELSE 3 END ASC`
    let orderBy = `ORDER BY ${baseOrder}, u.created_at DESC`
    if (sortBy === 'experience_high') orderBy = `ORDER BY u.is_pro DESC, CAST(COALESCE(u.years_experience,'0') AS UNSIGNED) DESC`
    if (sortBy === 'experience_low') orderBy = `ORDER BY u.is_pro DESC, CAST(COALESCE(u.years_experience,'0') AS UNSIGNED) ASC`
    if (sortBy === 'newest') orderBy = `ORDER BY u.created_at DESC`

    const countSql = `SELECT COUNT(*) as total FROM users u ${where}`
    const [countRows] = await pool.execute(countSql, params) as any[]
    const total = (countRows as any[])[0]?.total || 0

    const sql = `
      SELECT u.id, u.name, u.headline, u.location, u.target_role, u.years_experience,
             u.skills, u.target_salary, u.availability, u.industries, u.deal_sizes,
             u.sales_methodology, u.avatar_url, u.cv_filename, u.is_pro, u.profile_slug,
             u.achievements, u.current_ote, u.linkedin_url, u.created_at
      FROM users u
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?`
    const [rows] = await pool.execute(sql, [...params, limit, offset]) as any[]
    return c.json({ candidates: rows, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('/api/candidates error:', err)
    return c.json({ candidates: [], total: 0, page: 1, pages: 0 })
  }
})

app.get('/api/candidates/:id/download-cv', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const viewerId = String(payload.id)
    const candidateId = c.req.param('id')
    const isNumericId = /^\d+$/.test(candidateId)
  const [rows] = await pool.execute(`SELECT cv_filename FROM users WHERE ${isNumericId ? 'id' : 'profile_slug'} = ?`, [candidateId]) as any[]
    const user = (rows as any[])[0]
    if (!user?.cv_filename) return c.json({ error: 'No CV on file' }, 404)
    await pool.execute(
      'INSERT INTO profile_views (viewer_id, candidate_id, action) VALUES (?, ?, ?)',
      [viewerId, candidateId, 'cv_download']
    ).catch(() => {})
    return c.json({ filename: user.cv_filename })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

app.get('/api/candidates/:id', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const id = c.req.param('id')
  const isNumeric = /^\d+$/.test(id)
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, headline, location, years_in_sales, total_revenue, companies_closed, current_roles, looking_for, bio, work_history, cv_filename, is_pro, email,
              target_role, years_experience, skills, target_salary, availability, achievements, industries, deal_sizes, sales_methodology, current_ote, profile_slug, avatar_url, linkedin_url
       FROM users WHERE ${isNumeric ? 'id' : 'profile_slug'} = ? AND (is_public = 1 OR is_public IS NULL)`,
      [id]
    ) as any[]
    if (!(rows as any[]).length) return c.json({ error: 'Not found' }, 404)
    const candidate = (rows as any[])[0]

    // Record profile view if viewer is authenticated
    const auth = c.req.header('Authorization')
    if (auth?.startsWith('Bearer ')) {
      try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
        const viewerId = String(payload.id)
        if (viewerId !== id) {
          await pool.execute(
            'INSERT INTO profile_views (viewer_id, candidate_id, action) VALUES (?, ?, ?)',
            [viewerId, id, 'view']
          ).catch(() => {})
          if (candidate.is_pro && candidate.email) {
            const [viewerRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [viewerId]) as any[]
            const viewerName = (viewerRows as any[])[0]?.name || 'A company'
            sendEmail(
              candidate.email,
              'Your profile was viewed on SalesRoles.co',
              `<p>Hi ${candidate.name},</p><p><strong>${viewerName}</strong> viewed your profile on SalesRoles.co.</p><p><a href="https://salesroles.co/dashboard">View your profile activity</a></p><p>The SalesRoles.co team</p>`
            )
          }
        }
      } catch {}
    }

    // Don't expose email in the response
    const { email: _email, ...publicCandidate } = candidate
    return c.json(publicCandidate)
  } catch {
    return c.json({ error: 'Not found' }, 404)
  }
})

app.post('/api/candidates/:id/view', async (c) => {
  if (!pool) return c.json({ ok: true })
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ ok: true })
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const viewerId = String(payload.id)
    const candidateId = c.req.param('id')
    await pool.execute(
      'INSERT INTO profile_views (viewer_id, candidate_id, action) VALUES (?, ?, ?)',
      [viewerId, candidateId, 'view']
    ).catch(() => {})
  } catch {}
  return c.json({ ok: true })
})

app.get('/api/candidate/profile-views', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [userRows] = await pool.execute('SELECT is_pro FROM users WHERE id = ?', [userId]) as any[]
    if (!(userRows as any[])[0]?.is_pro) return c.json({ error: 'Pro required' }, 403)
    const [views] = await pool.execute(
      `SELECT pv.action, pv.created_at, u.name as viewer_name, u.email as viewer_email
       FROM profile_views pv
       LEFT JOIN users u ON pv.viewer_id = u.id
       WHERE pv.candidate_id = ?
       ORDER BY pv.created_at DESC
       LIMIT 50`,
      [userId]
    ) as any[]
    return c.json(views)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// --- Pro membership checkout ---

app.get('/api/payments/pro-checkout', async (c) => {
  if (!process.env.STRIPE_SECRET_KEY || !stripe) return c.json({ error: 'Stripe not configured' }, 503)
  const authHeader = c.req.header('Authorization') || ''
  const tokenParam = c.req.query('token') || ''
  const token = authHeader.replace('Bearer ', '') || tokenParam
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'SalesRoles.co Pro Membership' },
          unit_amount: 4900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.SITE_URL || 'https://salesroles.co'}/dashboard?pro=success`,
      cancel_url: `${process.env.SITE_URL || 'https://salesroles.co'}/dashboard`,
      metadata: { userId: String(payload.id) },
    })
    return c.redirect(session.url!)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// --- Google OAuth ---

app.get('/api/auth/google', (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const redirectUri = `${process.env.SITE_URL || 'https://salesroles.co'}/api/auth/google/callback`
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=consent`
  return c.redirect(url)
})

app.get('/api/auth/google/callback', async (c) => {
  if (!pool) return c.redirect('/?error=db')
  const code = c.req.query('code')
  const siteUrl = process.env.SITE_URL || 'https://salesroles.co'
  if (!code) return c.redirect(`${siteUrl}/login?error=no_code`)

  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const redirectUri = `${siteUrl}/api/auth/google/callback`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokens = await tokenRes.json() as any
    if (!tokens.access_token) return c.redirect(`${siteUrl}/login?error=token`)

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json() as any
    if (!googleUser.email) return c.redirect(`${siteUrl}/login?error=no_email`)

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [googleUser.email]) as any[]
    let dbUser = (rows as any[])[0]
    const isNewUser = !dbUser

    if (isNewUser) {
      const namePart = ((googleUser.name || googleUser.email) as string).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
      const profileSlug = `${namePart}-${randomBytes(3).toString('hex')}`
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash, role, is_public, profile_slug) VALUES (?, ?, ?, ?, 1, ?)',
        [googleUser.name || googleUser.email, googleUser.email, '', 'candidate', profileSlug]
      ) as any[]
      const [newRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [(result as any).insertId]) as any[]
      dbUser = (newRows as any[])[0]
      // Send welcome email to new Google OAuth users
      sendEmail(
        googleUser.email,
        'Welcome to SalesRoles.co — your career starts here',
        `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0a0f1e;color:#fff;border-radius:16px;">
          <h1 style="color:#10B981;font-size:28px;margin:0 0 8px;">Welcome, ${googleUser.name?.split(' ')[0] || 'there'}! 👋</h1>
          <p style="color:#9ca3af;margin:0 0 24px;">You've joined the UK's most transparent sales job board. Let's get your profile set up so companies can find you.</p>
          <a href="https://salesroles.co/dashboard/profile?mode=candidate" style="display:inline-block;background:#10B981;color:#fff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin-bottom:24px;">Complete Your Profile →</a>
          <p style="color:#6b7280;font-size:13px;">SalesRoles.co · Built for sales professionals</p>
        </div>`
      ).catch(() => {})
    }

    const token = await new SignJWT({ id: dbUser.id.toString(), email: dbUser.email, role: dbUser.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const userData = encodeURIComponent(JSON.stringify({ id: dbUser.id.toString(), email: dbUser.email, displayName: dbUser.name, role: dbUser.role }))
    return c.redirect(`${siteUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${userData}`)
  } catch (err) {
    console.error('Google OAuth error:', err)
    return c.redirect(`${siteUrl}/login?error=oauth`)
  }
})

// --- Saved-status check ---
app.get('/api/jobs/:id/saved-status', async (c) => {
  if (!pool) return c.json({ saved: false })
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ saved: false })
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const [rows] = await pool.execute(
      'SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?',
      [String(payload.id), c.req.param('id')]
    ) as any[]
    return c.json({ saved: (rows as any[]).length > 0 })
  } catch {
    return c.json({ saved: false })
  }
})

// --- Job report submission ---
app.post('/api/jobs/:id/report', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const jobId = c.req.param('id')
  const body = await c.req.json()
  const auth = c.req.header('Authorization')
  let reporterId: string | null = null
  let reporterEmail: string | null = body.email || null
  if (auth?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
      reporterId = String(payload.id)
      const [uRows] = await pool.execute('SELECT email FROM users WHERE id = ?', [reporterId]) as any[]
      reporterEmail = (uRows as any[])[0]?.email || reporterEmail
    } catch {}
  }
  try {
    await pool.execute(
      'INSERT INTO job_reports (job_id, reporter_id, reporter_email, reason, details) VALUES (?, ?, ?, ?, ?)',
      [jobId, reporterId, reporterEmail, body.reason || 'Other', body.details || null]
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Failed to submit report' }, 500)
  }
})

// --- Admin reports ---
app.get('/api/admin/reports', async (c) => {
  if (!pool) return c.json([])
  try {
    const [rows] = await pool.execute(`
      SELECT
        jr.id,
        jr.reason,
        jr.details,
        jr.status,
        jr.reporter_email,
        jr.created_at,
        j.title as job_title,
        j.company_name,
        j.id as job_id
      FROM job_reports jr
      LEFT JOIN jobs j ON jr.job_id = j.id
      ORDER BY jr.created_at DESC
    `) as any[]
    return c.json(rows)
  } catch {
    return c.json([])
  }
})

app.patch('/api/admin/reports/:id', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const body = await c.req.json()
    await pool.execute('UPDATE job_reports SET status = ? WHERE id = ?', [body.status, c.req.param('id')])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Failed to update report' }, 500)
  }
})

// --- Profile view notification test ---
app.get('/api/test/profile-view-notification', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' })
  try {
    const [candidates] = await pool.execute(
      "SELECT id, name, email, is_pro FROM users WHERE role = 'candidate' LIMIT 1"
    ) as any[]
    const candidate = (candidates as any[])[0]
    if (!candidate) return c.json({ error: 'No candidate found in database' })

    const [companies] = await pool.execute(
      "SELECT id, name FROM users WHERE role = 'company' LIMIT 1"
    ) as any[]
    const viewer = (companies as any[])[0]
    const viewerName = viewer?.name || 'Test Company'

    await pool.execute(
      'INSERT INTO profile_views (candidate_id, viewer_id, viewer_name, viewer_company, action) VALUES (?, ?, ?, ?, ?)',
      [candidate.id, viewer?.id || null, viewerName, viewerName, 'view']
    )

    const [views] = await pool.execute(
      'SELECT * FROM profile_views WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [candidate.id]
    ) as any[]

    let emailResult = 'skipped - candidate is not pro'
    if (candidate.is_pro && candidate.email) {
      try {
        await sendEmail(
          candidate.email,
          'Test: Your profile was viewed on SalesRoles.co',
          `<p>Hi ${candidate.name},</p>
          <p>This is a test notification. <strong>${viewerName}</strong> viewed your profile.</p>
          <p><a href="https://salesroles.co/dashboard">View your dashboard</a></p>`
        )
        emailResult = `email sent to ${candidate.email}`
      } catch (err: any) {
        emailResult = `email failed: ${err.message}`
      }
    }

    return c.json({
      success: true,
      candidate: { id: candidate.id, name: candidate.name, email: candidate.email, is_pro: candidate.is_pro },
      viewer: viewerName,
      view_record: (views as any[])[0],
      email: emailResult,
    })
  } catch (err: any) {
    return c.json({ error: err.message })
  }
})

// --- Test endpoint: seed pro candidate user ---
app.get('/api/test/seed-pro-user', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const EMAIL = 'testpro@salesroles.co'
  const PASSWORD = 'TestPro123!'
  const NAME = 'Alex Rivera (Test Pro)'
  try {
    const hash = await bcrypt.hash(PASSWORD, 10)
    // Upsert user
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [EMAIL]) as any[]
    let userId: number
    if ((existing as any[]).length > 0) {
      userId = (existing as any[])[0].id
      await pool.execute(
        `UPDATE users SET name=?, password_hash=?, is_pro=1, is_public=1,
          headline='Senior Account Executive · SaaS Sales',
          location='London, UK', target_role='VP of Sales', years_experience=7,
          availability='Open to opportunities', target_salary='£120,000 OTE',
          bio='Test pro candidate. 7 years closing enterprise SaaS across EMEA.',
          skills=?
         WHERE id=?`,
        [NAME, hash, JSON.stringify(['MEDDIC', 'Salesforce', 'Enterprise Sales', 'SaaS', 'EMEA']), userId]
      )
    } else {
      const slug = `alexrivera-${randomBytes(3).toString('hex')}`
      const [ins] = await pool.execute(
        `INSERT INTO users (name,email,password_hash,role,is_pro,is_public,profile_slug,
          headline,location,target_role,years_experience,availability,target_salary,bio,skills)
         VALUES (?,?,?,'candidate',1,1,?,?,?,?,?,?,?,?,?)`,
        [NAME, EMAIL, hash, slug,
         'Senior Account Executive · SaaS Sales', 'London, UK', 'VP of Sales', 7,
         'Open to opportunities', '£120,000 OTE',
         'Test pro candidate. 7 years closing enterprise SaaS across EMEA.',
         JSON.stringify(['MEDDIC', 'Salesforce', 'Enterprise Sales', 'SaaS', 'EMEA'])]
      ) as any[]
      userId = (ins as any).insertId
    }
    // Delete old fake views and re-seed 3 fresh ones
    await pool.execute(
      "DELETE FROM profile_views WHERE candidate_id = ? AND viewer_id IS NULL AND viewer_name IN ('Salesforce EMEA','HubSpot Talent','Gartner Recruiting')",
      [userId]
    )
    const fakeViewers = [
      { name: 'Salesforce EMEA',     company: 'Salesforce', daysAgo: 1 },
      { name: 'HubSpot Talent',      company: 'HubSpot',    daysAgo: 3 },
      { name: 'Gartner Recruiting',  company: 'Gartner',    daysAgo: 7 },
    ]
    for (const v of fakeViewers) {
      await pool.execute(
        `INSERT INTO profile_views (candidate_id, viewer_id, viewer_name, viewer_company, action, created_at)
         VALUES (?, NULL, ?, ?, 'view', DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [userId, v.name, v.company, v.daysAgo]
      )
    }
    return c.json({
      ok: true,
      message: 'Test pro candidate created/updated with 3 fake profile views',
      credentials: { email: EMAIL, password: PASSWORD, role: 'candidate (Pro)', userId },
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// --- Test endpoint: simulate Stripe webhook payment completion ---
app.post('/api/test/simulate-payment', async (c) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_PAYMENT_TEST) {
    return c.json({ error: 'Not available' }, 403)
  }
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const { jobId } = await c.req.json()
  await pool.execute(
    "UPDATE jobs SET status = 'pending', expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?",
    [jobId]
  )
  return c.json({ ok: true, message: `Job ${jobId} moved to pending — expires in 30 days` })
})

// --- Avatar static serving ---
app.get('/uploads/avatars/:filename', (c) => {
  const filename = c.req.param('filename')
  // Sanitize: no path traversal
  if (filename.includes('..') || filename.includes('/')) return c.notFound()
  const filePath = path.join(__dirname, '..', 'uploads', 'avatars', filename)
  if (!existsSync(filePath)) return c.notFound()
  const ext = extname(filename).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const stream = createReadStream(filePath)
  return new Response(stream as any, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000' } })
})

// --- Static file serving (production) ---
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

app.get('/assets/*', (c) => {
  const url = new URL(c.req.url)
  const filePath = path.join(distPath, url.pathname)
  if (!existsSync(filePath)) return c.notFound()
  const mime = mimeTypes[extname(filePath)] || 'application/octet-stream'
  const stream = createReadStream(filePath)
  return new Response(stream as any, { headers: { 'Content-Type': mime } })
})

app.get('/favicon.svg', (c) => {
  const filePath = path.join(distPath, 'favicon.svg')
  if (!existsSync(filePath)) return c.notFound()
  const stream = createReadStream(filePath)
  return new Response(stream as any, { headers: { 'Content-Type': 'image/svg+xml' } })
})

app.get('*', (c) => {
  const indexPath = path.join(distPath, 'index.html')
  try {
    const html = readFileSync(indexPath, 'utf-8')
    return c.html(html)
  } catch {
    return c.text('App not built. Run npm run build first.', 404)
  }
})

// --- Arbeitnow job sync ---

async function syncArbeitnowJobs() {
  if (!pool) return
  try {
    console.log('[arbeitnow] Starting sync...')
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1')
    if (!res.ok) { console.warn('[arbeitnow] API error:', res.status); return }
    const json = await res.json() as any
    const jobs: any[] = Array.isArray(json.data) ? json.data : []

    // Filter for sales-relevant roles
    const salesKeywords = ['sales', 'account executive', 'account manager', 'bdr', 'sdr', 'business development', 'revenue', 'commercial', 'account director', 'partnership']
    const filtered = jobs.filter(j => {
      const text = `${j.title} ${j.tags?.join(' ') || ''}`.toLowerCase()
      return salesKeywords.some(kw => text.includes(kw))
    })

    let inserted = 0
    for (const job of filtered) {
      const externalId = `arbeitnow-${job.slug}`
      // Check if already exists
      const [existing] = await pool.execute(
        'SELECT id FROM jobs WHERE external_id = ?',
        [externalId]
      ) as any[]
      if ((existing as any[]).length > 0) continue

      const id = externalId
      const title = job.title || 'Untitled'
      const companyName = job.company_name || 'Unknown Company'
      const location = job.location || 'Remote'
      const description = job.description || ''
      const url = job.url || `https://www.arbeitnow.com/jobs/${job.slug}`
      const workType = job.remote ? 'Remote' : 'On-site'

      try {
        await pool.execute(
          `INSERT INTO jobs (id, title, company_name, location, work_type, description, status, source, external_id, url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'live', 'arbeitnow', ?, ?, NOW())`,
          [id, title, companyName, location, workType, description, externalId, url]
        )
        inserted++
      } catch {
        // Ignore duplicate key or other insert errors
      }
    }
    console.log(`[arbeitnow] Sync complete — ${inserted} new jobs inserted from ${filtered.length} sales-relevant (${jobs.length} total)`)
  } catch (err) {
    console.error('[arbeitnow] Sync failed:', err)
  }
}

// Run on startup then every 6 hours
syncArbeitnowJobs()
setInterval(syncArbeitnowJobs, 6 * 60 * 60 * 1000)

// --- Server ---

const port = parseInt(process.env.PORT || '4000')
serve({ fetch: app.fetch, port }, () => console.log(`Server running on http://localhost:${port}`))

export default app
