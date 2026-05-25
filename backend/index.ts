import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

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

// --- Auth ---

app.post('/auth/register', async (c) => {
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

    return c.json({ token, user: { id: userId, email, displayName: name, role: role || 'candidate' } })
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return c.json({ error: 'Email already registered' }, 409)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

app.post('/auth/login', async (c) => {
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

app.get('/auth/me', async (c) => {
  if (!pool) return c.json({ error: 'Database not configured' }, 503)
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET)
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [payload.id]) as any[]
    const user = rows[0]
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user: { id: user.id.toString(), email: user.email, displayName: user.name, role: user.role } })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// --- Jobs proxy ---

app.get('/jobs', async (c) => {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')
    const result = await response.json()
    const salesKeywords = ['sales', 'account executive', 'business development', 'sdr', 'account manager', 'revenue', 'representative', 'customer success']
    const salesJobs = result.data
      .filter((job: any) => salesKeywords.some(kw => job.title.toLowerCase().includes(kw)))
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

// --- Server ---

const port = parseInt(process.env.PORT || '4000')
serve({ fetch: app.fetch, port }, () => console.log(`API server running on http://localhost:${port}`))

export default app
