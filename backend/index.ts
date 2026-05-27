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
import { randomBytes, createHash } from 'crypto'

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
  pool.execute(`ALTER TABLE users ADD COLUMN company_size VARCHAR(50)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN company_industry VARCHAR(100)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN company_website VARCHAR(500)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN company_logo_url VARCHAR(500)`).catch(() => {})
  pool.execute(`ALTER TABLE users ADD COLUMN company_domain VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE jobs ADD COLUMN edit_note VARCHAR(255)`).catch(() => {})
  pool.execute(`ALTER TABLE users MODIFY COLUMN is_public TINYINT DEFAULT 1`).catch(() => {})
  // Demo company account (INSERT IGNORE — no-op if already exists)
  pool.execute(
    `INSERT IGNORE INTO users (name, email, password_hash, role, company_name, created_at)
     VALUES ('SalesRoles Demo', 'demo@salesroles.co', '$2b$10$nSHW9/N3aDwoWhEQSYW.x.DgNOU4FdWhVnBkaE97tC4Mvi.RpKe9W', 'company', 'SalesRoles Demo Co', NOW())`
  ).catch(() => {})
  // Demo job linked to demo company (INSERT IGNORE — idempotent via primary key)
  pool.execute(
    `INSERT IGNORE INTO jobs (id, title, company_name, location, work_type, seniority, sector, description, base_salary, ote, commission_structure, currency, status, featured, company_id, created_at)
     SELECT 'demo-sr-senior-ae', 'Senior Account Executive', 'SalesRoles Demo Co', 'Remote (Global)', 'Remote', 'Senior', 'SaaS',
       'We are looking for a Senior AE to join our growing sales team. You will own the full sales cycle from qualified lead to close, targeting mid-market SaaS companies.',
       '$120k - $150k', '$240k - $300k', '20% of ARR, uncapped, paid monthly', 'USD', 'live', 1, id, NOW()
     FROM users WHERE email = 'demo@salesroles.co' LIMIT 1`
  ).catch(() => {})
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
  pool.execute(`ALTER TABLE jobs ADD COLUMN views INT DEFAULT 0`).catch(() => {})
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
  pool.execute(`
    CREATE TABLE IF NOT EXISTS job_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(255) NOT NULL,
      visitor_hash VARCHAR(64) NOT NULL,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_job_visitor (job_id, visitor_hash, viewed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => {})
} catch {}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'salesroles-dev-secret-change-in-prod'
)

function extractDomainFromUrl(url: string): string {
  if (!url) return ''
  try {
    const withProtocol = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
    return new URL(withProtocol).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

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
              availability, achievements, industries, deal_sizes, sales_methodology, current_ote, profile_slug,
              company_name, company_website, company_logo_url, company_size, company_industry, bio
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
      // Company profile fields (only populated for role=company)
      company_name: company_name || user.company_name || null,
      company_website: user.company_website || null,
      company_logo_url: user.company_logo_url || null,
      company_size: user.company_size || null,
      company_industry: user.company_industry || null,
      bio: user.bio || null,
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
      "SELECT j.*, u.company_logo_url FROM jobs j LEFT JOIN users u ON j.company_id = u.id WHERE j.status = 'live' AND (j.expires_at IS NULL OR j.expires_at > NOW()) ORDER BY j.featured DESC, j.created_at DESC"
    ) as any[]
    const jobs = (rows as any[]).map(row => ({
      ...row,
      company: row.company_name,
      domain: extractDomainFromUrl(row.company_website || ''),
      job_type: row.work_type,
      application_url: row.application_url || '',
      contact_email: row.contact_email || '',
      featured: !!row.featured,
      company_logo_url: row.company_logo_url || null,
    }))
    return c.json({ jobs })
  } catch {
    return c.json({ jobs: [] })
  }
})

// Regex word-boundary patterns for precise sales title matching.
// "Field Engineer" → false (no pattern fires)
// "Field Sales Manager" → true (\bsales\b matches "Sales")
const SALES_TITLE_PATTERNS: RegExp[] = [
  /\bsales\b/i,
  /\bae\b/i,
  /\bsdr\b/i,
  /\bbdr\b/i,
  /\baccount executive\b/i,
  /\bbusiness development\b/i,
  /\baccount manager\b/i,
  /\bsales manager\b/i,
  /\bsales director\b/i,
  /\bvp of sales\b/i,
  /\bvp sales\b/i,
  /\bhead of sales\b/i,
  /\brevenue\b/i,
  /\bpartnership\b/i,
  /\bsales development\b/i,
  /\binside sales\b/i,
  /\bfield sales\b/i,
  /\benterprise sales\b/i,
]
function isSalesTitle(title: string): boolean {
  return SALES_TITLE_PATTERNS.some(p => p.test(title))
}

app.get('/api/jobs/external', async (c) => {
  const results: any[] = []

  // --- Adzuna ---
  const adzunaAppId = process.env.ADZUNA_APP_ID
  const adzunaAppKey = process.env.ADZUNA_APP_KEY
  if (adzunaAppId && adzunaAppKey) {
    const adzunaCountries = ['gb', 'us', 'au', 'ca']
    const adzunaCurrMap: Record<string, string> = { gb: '£', us: '$', au: 'A$', ca: 'C$' }
    const adzunaSettled = await Promise.allSettled(
      adzunaCountries.map(country =>
        fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=20&what=sales&salary_include_unknown=0`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then((d: any) => ({ country, jobs: (d.results || []) as any[] }))
      )
    )
    let adzunaTotal = 0
    for (const settled of adzunaSettled) {
      if (settled.status !== 'fulfilled') {
        console.warn('[adzuna] A country fetch failed:', settled.reason)
        continue
      }
      const { country, jobs: countryJobs } = settled.value
      const curr = adzunaCurrMap[country]
      let skippedKeyword = 0, skippedSalary = 0
      console.log(`[adzuna][${country}] Raw jobs from API: ${countryJobs.length}`)
      if (countryJobs.length === 0) {
        console.warn(`[adzuna][${country}] Zero raw jobs returned`)
      }
      for (const job of countryJobs) {
        if (!isSalesTitle(job.title || '')) { skippedKeyword++; continue }
        const salaryStr = job.salary_min && job.salary_max
          ? `${curr}${Math.round(job.salary_min / 1000)}k – ${curr}${Math.round(job.salary_max / 1000)}k`
          : job.salary_min ? `${curr}${Math.round(job.salary_min / 1000)}k+` : null
        if (!salaryStr) { skippedSalary++; continue }
        results.push({
          id: `adzuna-${job.id}`,
          title: job.title,
          company_name: job.company?.display_name || 'Unknown',
          company_website: '',
          location: job.location?.display_name || 'Unknown',
          work_type: 'On-site',
          sector: job.category?.label || 'Sales',
          seniority: 'Mid-Level',
          description: job.description || '',
          base_salary: salaryStr,
          ote: salaryStr,
          apply_url: job.redirect_url || '',
          via_partner: true,
          created_at: job.created || new Date().toISOString(),
          domain: '',
          source_tag: 'Via Adzuna',
        })
        adzunaTotal++
      }
      console.log(`[adzuna][${country}] Kept: ${countryJobs.length - skippedKeyword - skippedSalary} | Excl keyword: ${skippedKeyword} | Excl salary: ${skippedSalary}`)
      if (countryJobs.length > 0 && countryJobs.length - skippedKeyword - skippedSalary === 0) {
        console.warn(`[adzuna][${country}] Zero after filters — sample:`, countryJobs.slice(0, 3).map((j: any) => ({ title: j.title, salary_min: j.salary_min, salary_max: j.salary_max })))
      }
    }
    console.log(`[adzuna] Total kept across all countries: ${adzunaTotal}`)
  }

  // --- Remotive ---
  try {
    const remRes = await fetch('https://remotive.com/api/remote-jobs?category=sales')
    if (remRes.ok) {
      const remData = await remRes.json()
      const allRem: any[] = remData.jobs || []
      const afterSalary = allRem.filter((job: any) => typeof job.salary === 'string' && job.salary.trim() !== '')
      const afterKeyword = afterSalary.filter((job: any) => isSalesTitle(job.title || ''))
      console.log(`[remotive] Raw: ${allRem.length} | After salary: ${afterSalary.length} | After keyword: ${afterKeyword.length} | Excl salary: ${allRem.length - afterSalary.length} | Excl keyword: ${afterSalary.length - afterKeyword.length}`)
      if (allRem.length > 0 && afterKeyword.length === 0) {
        console.warn('[remotive] Zero after filters — sample:', allRem.slice(0, 3).map((j: any) => ({ title: j.title, salary: j.salary })))
      }
      for (const job of afterKeyword) {
        results.push({
          id: `remotive-${job.id}`,
          title: job.title,
          company_name: job.company_name || 'Unknown',
          company_website: '',
          location: 'Remote (Global)',
          work_type: 'Remote',
          sector: 'Sales',
          seniority: 'Mid-Level',
          description: job.description || '',
          base_salary: job.salary,
          ote: job.salary,
          apply_url: job.url || '',
          via_partner: true,
          created_at: job.publication_date || new Date().toISOString(),
          domain: '',
          source_tag: 'Via Remotive',
        })
      }
    }
  } catch (e) {
    console.error('Remotive fetch failed:', e)
  }

  console.log(`[/api/jobs/external] Total results: ${results.length}`)
  return c.json(results)
})

app.get('/api/jobs/:id', async (c) => {
  const id = c.req.param('id')

  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const [rows] = await pool.execute('SELECT j.*, u.company_logo_url FROM jobs j LEFT JOIN users u ON j.company_id = u.id WHERE j.id = ?', [id]) as any[]
    const row = (rows as any[])[0]
    if (!row) return c.json({ error: 'Job not found' }, 404)
    return c.json({ job: { ...row, company: row.company_name, domain: extractDomainFromUrl(row.company_website || ''), job_type: row.work_type, featured: !!row.featured, company_logo_url: row.company_logo_url || null } })
  } catch {
    return c.json({ error: 'Failed to fetch job' }, 500)
  }
})

// Dedicated view-increment endpoint — deduplicates by visitor hash (IP + UA) per hour
app.post('/api/jobs/:id/view', async (c) => {
  const id = c.req.param('id')
  if (!pool || !id) return c.json({ ok: true })
  try {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || ''
    const ua = c.req.header('user-agent') || ''
    const visitorHash = createHash('md5').update(ip + ua).digest('hex')
    const [recent] = await pool.execute(
      `SELECT id FROM job_views WHERE job_id = ? AND visitor_hash = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id, visitorHash]
    ) as any[]
    if ((recent as any[]).length === 0) {
      pool.execute('INSERT INTO job_views (job_id, visitor_hash) VALUES (?, ?)', [id, visitorHash]).catch(() => {})
      pool.execute('UPDATE jobs SET views = COALESCE(views, 0) + 1 WHERE id = ?', [id]).catch(() => {})
    }
  } catch {}
  return c.json({ ok: true })
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
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [[liveRow], [viewRow], [applyRow]] = await Promise.all([
      pool.execute(
        "SELECT COUNT(*) as count FROM jobs WHERE company_id = ? AND status = 'live' AND (expires_at IS NULL OR expires_at > NOW())",
        [userId]
      ) as Promise<any>,
      pool.execute(
        "SELECT COALESCE(SUM(views), 0) as total FROM jobs WHERE company_id = ?",
        [userId]
      ) as Promise<any>,
      pool.execute(
        `SELECT COUNT(*) as count FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.company_id = ?`,
        [userId]
      ) as Promise<any>,
    ])
    const liveJobs = Number((liveRow as any[])[0]?.count || 0)
    const totalViews = Number((viewRow as any[])[0]?.total || 0)
    const applyClicks = Number((applyRow as any[])[0]?.count || 0)
    const avgCtr = totalViews > 0 ? Math.round((applyClicks / totalViews) * 100) : 0
    return c.json({ liveJobs, totalViews, applyClicks, avgCtr })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// Company edits a live job → resets to pending for re-approval
app.put('/api/jobs/:id', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const id = c.req.param('id')
    const { title, location, base_salary, ote, commission_structure, work_type, description } = await c.req.json()
    // Verify the company owns this job
    const [rows] = await pool.execute('SELECT id FROM jobs WHERE id = ? AND company_id = ?', [id, userId]) as any[]
    if ((rows as any[]).length === 0) return c.json({ error: 'Job not found or unauthorized' }, 404)
    await pool.execute(
      `UPDATE jobs SET title=?, location=?, base_salary=?, ote=?, commission_structure=?, work_type=?, description=?, status='pending', edit_note='Edited — awaiting re-approval' WHERE id=? AND company_id=?`,
      [title, location, base_salary, ote, commission_structure, work_type, description, id, userId]
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Update failed' }, 500)
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

app.get('/api/admin/users', async (c) => {
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

app.delete('/api/admin/users/:id', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  try {
    const { password } = await c.req.json()
    if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const id = c.req.param('id')
    await pool.execute('DELETE FROM saved_jobs WHERE user_id = ?', [id])
    await pool.execute('DELETE FROM applications WHERE candidate_id = ?', [id])
    await pool.execute('DELETE FROM jobs WHERE company_id = ?', [id])
    await pool.execute('DELETE FROM users WHERE id = ?', [id])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Delete failed' }, 500)
  }
})

// --- Company dashboard ---

app.get('/api/company/stats', async (c) => {
  if (!pool) return c.json({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [liveRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'live' AND company_id = ?", [userId]
    ) as any[]
    const [viewRows] = await pool.execute(
      "SELECT COALESCE(SUM(views), 0) as total FROM jobs WHERE company_id = ?", [userId]
    ) as any[]
    const [appRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?", [userId]
    ) as any[]
    const liveJobs = Number((liveRows as any[])[0]?.count || 0)
    const totalViews = Number((viewRows as any[])[0]?.total || 0)
    const applyClicks = Number((appRows as any[])[0]?.count || 0)
    const avgCtr = totalViews > 0 ? Math.round((applyClicks / totalViews) * 100) : 0
    return c.json({ liveJobs, totalViews, applyClicks, avgCtr })
  } catch {
    return c.json({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })
  }
})

app.get('/api/company/applicant/:id', async (c) => {
  if (!pool) return c.json({ error: 'Not found' }, 404)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const companyId = String(payload.id)
    const candidateId = c.req.param('id')
    // Verify this candidate applied to at least one of this company's jobs; get most recent cover_note
    const [check] = await pool.execute(
      `SELECT a.id, a.cover_note, a.cv_filename as app_cv_filename
       FROM applications a JOIN jobs j ON a.job_id = j.id
       WHERE a.candidate_id = ? AND j.company_id = ?
       ORDER BY a.created_at DESC LIMIT 1`,
      [candidateId, companyId]
    ) as any[]
    if ((check as any[]).length === 0) return c.json({ error: 'Not found' }, 404)
    const appRow = (check as any[])[0]
    const [rows] = await pool.execute(
      `SELECT id, name, headline, location, years_experience, target_role, skills,
              availability, cv_filename, profile_slug, linkedin_url, bio, target_salary, email
       FROM users WHERE id = ?`,
      [candidateId]
    ) as any[]
    const candidate = (rows as any[])[0]
    if (!candidate) return c.json({ error: 'Not found' }, 404)
    return c.json({
      ...candidate,
      cover_note: appRow.cover_note || null,
      cv_filename: candidate.cv_filename || appRow.app_cv_filename || null,
    })
  } catch {
    return c.json({ error: 'Failed to fetch applicant' }, 500)
  }
})

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
    let formData: FormData
    try {
      formData = await c.req.formData()
    } catch {
      return c.json({ error: 'Invalid form data' }, 400)
    }
    const jobId = formData.get('jobId') as string
    if (!jobId) return c.json({ error: 'Missing jobId' }, 400)
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

app.patch('/api/applications/:id/status', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const companyId = String(payload.id)
    const applicationId = c.req.param('id')
    const { status } = await c.req.json()
    const validStatuses = ['New', 'Reviewing', 'Contacting', 'Interviewing', 'Rejected', 'Hired']
    if (!validStatuses.includes(status)) return c.json({ error: 'Invalid status' }, 400)
    // Verify the company owns the job this application belongs to
    const [check] = await pool.execute(
      'SELECT a.id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ? AND j.company_id = ?',
      [applicationId, companyId]
    ) as any[]
    if ((check as any[]).length === 0) return c.json({ error: 'Not found' }, 404)
    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId])
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Failed to update status' }, 500)
  }
})

app.get('/api/candidate/applications', async (c) => {
  if (!pool) return c.json([])
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json([])
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const candidateId = String(payload.id)
    const [rows] = await pool.execute(
      `SELECT a.id, a.job_id, a.status, a.created_at,
              j.title as job_title, j.company_name, j.location, j.work_type
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.candidate_id = ?
       ORDER BY a.created_at DESC`,
      [candidateId]
    ) as any[]
    return c.json(rows)
  } catch {
    return c.json([])
  }
})

app.get('/api/candidate/applied-job-ids', async (c) => {
  if (!pool) return c.json([])
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json([])
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const candidateId = String(payload.id)
    const [rows] = await pool.execute(
      'SELECT job_id FROM applications WHERE candidate_id = ?',
      [candidateId]
    ) as any[]
    return c.json((rows as any[]).map((r: any) => r.job_id))
  } catch {
    return c.json([])
  }
})

app.get('/api/company/profile', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const [rows] = await pool.execute(
      `SELECT name, email, company_name, company_website, company_logo_url,
              company_domain, company_size, company_industry, location, bio
       FROM users WHERE id = ? AND role = 'company'`,
      [String(payload.id)]
    ) as any[]
    const row = (rows as any[])[0]
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(row)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

app.put('/api/company/profile', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    if ((payload as any).role !== 'company') return c.json({ error: 'Company account required' }, 403)
    const data = await c.req.json()
    const companyDomain = extractDomainFromUrl(data.company_website || '')
    await pool.execute(
      `UPDATE users SET
        company_name = ?,
        company_website = ?,
        company_logo_url = ?,
        company_domain = ?,
        company_size = ?,
        company_industry = ?,
        location = ?,
        bio = ?
       WHERE id = ?`,
      [
        data.company_name || null,
        data.company_website || null,
        data.company_logo_url || null,
        companyDomain || null,
        data.company_size || null,
        data.company_industry || null,
        data.location || null,
        data.bio || null,
        String(payload.id),
      ]
    )
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Update failed' }, 500)
  }
})


app.get('/api/company/live-jobs', async (c) => {
  if (!pool) return c.json([])
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const userId = String(payload.id)
    const [jobs] = await pool.execute(
      "SELECT * FROM jobs WHERE status = 'live' AND company_id = ? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC",
      [userId]
    ) as any[]
    return c.json(jobs)
  } catch {
    return c.json([])
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
      `SELECT a.*, j.title as job_title, j.id as job_id,
              u.profile_slug as candidate_slug, u.avatar_url as candidate_avatar
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN users u ON a.candidate_id = u.id
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

// --- Company logo upload ---

app.post('/api/upload/logo', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    if ((payload as any).role !== 'company') return c.json({ error: 'Company account required' }, 403)
    const formData = await c.req.formData()
    const file = formData.get('logo') as File | null
    if (!file) return c.json({ error: 'No file' }, 400)
    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg'
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'svg']
    if (!allowedExts.includes(ext)) return c.json({ error: 'Invalid file type. Use JPG, PNG, WebP, or SVG.' }, 400)
    const filename = `logo-${payload.id}-${Date.now()}.${ext}`
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'logos')
    await fsPromises.mkdir(uploadsDir, { recursive: true })
    const arrayBuffer = await file.arrayBuffer()
    await fsPromises.writeFile(path.join(uploadsDir, filename), Buffer.from(arrayBuffer))
    return c.json({ ok: true, logo_url: filename })
  } catch (err) {
    console.error('Logo upload error:', err)
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
    const providedAvatar = typeof data.avatar_url === 'string' && data.avatar_url.length > 0 ? data.avatar_url : null
    await pool.execute(
      `UPDATE users SET
        headline=?, location=?, years_in_sales=?, total_revenue=?, companies_closed=?,
        current_roles=?, looking_for=?, bio=?, work_history=?, is_public=?,
        phone=?, linkedin_url=?, target_role=?, years_experience=?, skills=?,
        target_salary=?, availability=?, achievements=?, industries=?, deal_sizes=?,
        sales_methodology=?, current_ote=?${providedAvatar ? ', avatar_url=?' : ''}
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
        ...(providedAvatar ? [providedAvatar] : []),
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
  // Require authenticated company account
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Company account required', candidates: [], total: 0, page: 1, pages: 0 }, 401)
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    if ((payload as any).role !== 'company') {
      return c.json({ error: 'Company account required', candidates: [], total: 0, page: 1, pages: 0 }, 403)
    }
  } catch {
    return c.json({ error: 'Unauthorized', candidates: [], total: 0, page: 1, pages: 0 }, 401)
  }
  try {
    const search = c.req.query('search') || ''
    const targetRole = c.req.query('target_role') || ''
    const expMin = c.req.query('exp_min') || ''
    const expMax = c.req.query('exp_max') || ''
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
    if (expMin !== '') {
      const min = parseInt(expMin, 10)
      const max = expMax !== '' ? parseInt(expMax, 10) : null
      if (!isNaN(min)) {
        if (max !== null && !isNaN(max) && max < 999) {
          where += ` AND u.years_experience >= ? AND u.years_experience <= ?`
          params.push(min, max)
        } else {
          where += ` AND u.years_experience >= ?`
          params.push(min)
        }
      }
    }
    if (availability) { where += ` AND u.availability = ?`; params.push(availability) }
    if (industry) { where += ` AND u.industries LIKE ?`; params.push(`%${industry}%`) }
    if (dealSize) { where += ` AND u.deal_sizes LIKE ?`; params.push(`%${dealSize}%`) }
    if (methodology) { where += ` AND u.sales_methodology LIKE ?`; params.push(`%${methodology}%`) }
    if (location) { where += ` AND u.location LIKE ?`; params.push(`%${location}%`) }

    let orderBy: string
    switch (sortBy) {
      case 'newest':
        orderBy = `ORDER BY u.created_at DESC`
        break
      case 'experience_high':
        orderBy = `ORDER BY COALESCE(u.years_experience, 0) DESC, u.is_pro DESC, u.created_at DESC`
        break
      case 'experience_low':
        orderBy = `ORDER BY COALESCE(u.years_experience, 0) ASC, u.is_pro DESC, u.created_at DESC`
        break
      default:
        orderBy = `ORDER BY u.is_pro DESC, CASE WHEN u.availability = 'Actively looking' THEN 1 WHEN u.availability = 'Open to opportunities' THEN 2 ELSE 3 END ASC, u.created_at DESC`
    }

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
    const [vRows2] = await pool.execute('SELECT name, company_name FROM users WHERE id = ?', [viewerId]) as any[]
    const vi2 = (vRows2 as any[])[0]
    await pool.execute(
      'INSERT INTO profile_views (viewer_id, candidate_id, action, viewer_name, viewer_company) VALUES (?, ?, ?, ?, ?)',
      [viewerId, candidateId, 'cv_download', vi2?.company_name || vi2?.name || null, vi2?.company_name || null]
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
        if (viewerId !== String(candidate.id)) {
          // Look up viewer's name and company so it's stored at view-time
          const [viewerRows] = await pool.execute(
            'SELECT name, company_name FROM users WHERE id = ?', [viewerId]
          ) as any[]
          const viewerInfo = (viewerRows as any[])[0]
          const viewerName = viewerInfo?.company_name || viewerInfo?.name || null
          const viewerCompany = viewerInfo?.company_name || null
          await pool.execute(
            'INSERT INTO profile_views (viewer_id, candidate_id, action, viewer_name, viewer_company) VALUES (?, ?, ?, ?, ?)',
            [viewerId, candidate.id, 'view', viewerName, viewerCompany]
          ).catch(() => {})
          if (candidate.is_pro && candidate.email) {
            sendEmail(
              candidate.email,
              'Your profile was viewed on SalesRoles.co',
              `<p>Hi ${candidate.name},</p><p><strong>${viewerName || 'A company'}</strong> viewed your profile on SalesRoles.co.</p><p><a href="https://salesroles.co/dashboard">View your profile activity</a></p><p>The SalesRoles.co team</p>`
            ).catch(() => {})
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
    const [vRows] = await pool.execute('SELECT name, company_name FROM users WHERE id = ?', [viewerId]) as any[]
    const vi = (vRows as any[])[0]
    const viewerName = vi?.company_name || vi?.name || null
    const viewerCompany = vi?.company_name || null
    await pool.execute(
      'INSERT INTO profile_views (viewer_id, candidate_id, action, viewer_name, viewer_company) VALUES (?, ?, ?, ?, ?)',
      [viewerId, candidateId, 'view', viewerName, viewerCompany]
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
      `SELECT
         pv.action,
         pv.created_at,
         COALESCE(pv.viewer_name, u.name) AS viewer_name,
         COALESCE(pv.viewer_company, u.company_name) AS viewer_company
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

// --- Logo static serving ---
app.get('/uploads/logos/:filename', (c) => {
  const filename = c.req.param('filename')
  if (filename.includes('..') || filename.includes('/')) return c.notFound()
  const filePath = path.join(__dirname, '..', 'uploads', 'logos', filename)
  if (!existsSync(filePath)) return c.notFound()
  const ext = extname(filename).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const stream = createReadStream(filePath)
  return new Response(stream as any, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000' } })
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

// --- Adzuna job sync ---

async function syncAdzunaJobs() {
  if (!pool) return
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return
  try {
    console.log('[adzuna] Starting sync...')
    const countries = ['gb', 'us', 'au', 'ca']
    const currMap: Record<string, string> = { gb: '£', us: '$', au: 'A$', ca: 'C$' }
    let inserted = 0
    const settled = await Promise.allSettled(
      countries.map(country =>
        fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=sales&salary_include_unknown=0`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then((d: any) => ({ country, jobs: (d.results || []) as any[] }))
      )
    )
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue
      const { country, jobs } = result.value
      const curr = currMap[country]
      for (const job of jobs) {
        if (!isSalesTitle(job.title || '')) continue
        const salaryStr = job.salary_min && job.salary_max
          ? `${curr}${Math.round(job.salary_min / 1000)}k – ${curr}${Math.round(job.salary_max / 1000)}k`
          : job.salary_min ? `${curr}${Math.round(job.salary_min / 1000)}k+` : null
        if (!salaryStr) continue
        const externalId = `adzuna-${job.id}`
        const [existing] = await pool.execute('SELECT id FROM jobs WHERE external_id = ?', [externalId]) as any[]
        if ((existing as any[]).length > 0) continue
        try {
          await pool.execute(
            `INSERT INTO jobs (id, title, company_name, location, work_type, description, status, source, external_id, url, base_salary, ote, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'live', 'adzuna', ?, ?, ?, ?, NOW())`,
            [externalId, job.title || 'Untitled', job.company?.display_name || 'Unknown',
             job.location?.display_name || 'Unknown', 'On-site', job.description || '',
             externalId, job.redirect_url || '', salaryStr, salaryStr]
          )
          inserted++
        } catch { /* ignore duplicate key */ }
      }
    }
    console.log(`[adzuna] Sync complete — ${inserted} new jobs inserted`)
  } catch (err) {
    console.error('[adzuna] Sync failed:', err)
  }
}

// --- Remotive job sync ---

async function syncRemotiveJobs() {
  if (!pool) return
  try {
    console.log('[remotive] Starting sync...')
    const res = await fetch('https://remotive.com/api/remote-jobs?category=sales')
    if (!res.ok) { console.warn('[remotive] API error:', res.status); return }
    const json = await res.json() as any
    const jobs: any[] = Array.isArray(json.jobs) ? json.jobs : []

    const filtered = jobs
      .filter(j => typeof j.salary === 'string' && j.salary.trim() !== '')
      .filter(j => isSalesTitle(j.title || ''))

    let inserted = 0
    for (const job of filtered) {
      const externalId = `remotive-${job.id}`
      const [existing] = await pool.execute('SELECT id FROM jobs WHERE external_id = ?', [externalId]) as any[]
      if ((existing as any[]).length > 0) continue
      try {
        await pool.execute(
          `INSERT INTO jobs (id, title, company_name, location, work_type, description, status, source, external_id, url, base_salary, ote, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'live', 'remotive', ?, ?, ?, ?, NOW())`,
          [externalId, job.title || 'Untitled', job.company_name || 'Unknown',
           'Remote (Global)', 'Remote', job.description || '',
           externalId, job.url || '', job.salary, job.salary]
        )
        inserted++
      } catch { /* ignore duplicate key */ }
    }
    console.log(`[remotive] Sync complete — ${inserted} new jobs inserted from ${filtered.length} sales-relevant (${jobs.length} total)`)
  } catch (err) {
    console.error('[remotive] Sync failed:', err)
  }
}

// Run on startup then every 6 hours
syncAdzunaJobs()
syncRemotiveJobs()
setInterval(syncAdzunaJobs, 6 * 60 * 60 * 1000)
setInterval(syncRemotiveJobs, 6 * 60 * 60 * 1000)

// --- Server ---

const port = parseInt(process.env.PORT || '4000')
serve({ fetch: app.fetch, port }, () => console.log(`Server running on http://localhost:${port}`))

export default app
