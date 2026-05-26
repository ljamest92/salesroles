import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import path, { extname } from 'path';
import { readFileSync, createReadStream, existsSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');
const app = new Hono();
app.use('*', cors({ origin: '*' }));
// --- DB ---
let pool = null;
try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'salesroles',
        waitForConnections: true,
        connectionLimit: 10,
    });
    pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('candidate','company') NOT NULL DEFAULT 'candidate',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => { });
    pool.execute(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => { });
    pool.execute(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      job_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_save (user_id, job_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => { });
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
  `).catch(() => { });
    pool.execute(`ALTER TABLE jobs ADD COLUMN company_id INT DEFAULT NULL`).catch(() => { });
    pool.execute(`ALTER TABLE jobs ADD COLUMN screening_questions TEXT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN cv_filename VARCHAR(255)`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN headline VARCHAR(255)`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN location VARCHAR(255)`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN years_in_sales INT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN total_revenue VARCHAR(100)`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN companies_closed INT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN current_roles TEXT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN looking_for TEXT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN bio TEXT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN work_history TEXT`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN is_public TINYINT DEFAULT 0`).catch(() => { });
    pool.execute(`ALTER TABLE users ADD COLUMN is_pro TINYINT DEFAULT 0`).catch(() => { });
    pool.execute(`
    CREATE TABLE IF NOT EXISTS profile_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      viewer_id INT,
      candidate_id INT NOT NULL,
      action VARCHAR(50) DEFAULT 'view',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `).catch(() => { });
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
  `).catch(() => { });
    pool.execute(`ALTER TABLE applications ADD COLUMN screening_answers TEXT`).catch(() => { });
}
catch { }
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'salesroles-dev-secret-change-in-prod');
// --- Email ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});
async function sendEmail(to, subject, html) {
    if (!process.env.SMTP_USER)
        return; // Skip if SMTP not configured
    try {
        await transporter.sendMail({
            from: `"SalesRoles.co" <${process.env.SMTP_FROM || 'info@salesroles.co'}>`,
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.warn('Email send failed:', err);
    }
}
// --- Stripe ---
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
    : null;
// --- Stripe Webhook ---
app.post('/api/webhooks/stripe', async (c) => {
    const sig = c.req.header('stripe-signature');
    const body = await c.req.text();
    if (!process.env.STRIPE_WEBHOOK_SECRET || !stripe) {
        return c.json({ error: 'Webhook not configured' }, 500);
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return c.json({ error: 'Webhook signature verification failed' }, 400);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const jobId = session.metadata?.jobId;
        const userId = session.metadata?.userId;
        if (userId && session.mode === 'subscription' && pool) {
            await pool.execute('UPDATE users SET is_pro = 1 WHERE id = ?', [userId]).catch(() => { });
        }
        if (jobId && pool) {
            await pool.execute("UPDATE jobs SET status = 'pending' WHERE id = ?", [jobId]).catch((err) => console.error('Failed to update job status:', err));
            console.log(`Job ${jobId} moved to pending after payment`);
        }
    }
    return c.json({ received: true });
});
// --- Auth ---
app.post('/api/auth/register', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    try {
        const { name, email, password, role } = await c.req.json();
        if (!name || !email || !password)
            return c.json({ error: 'Missing required fields' }, 400);
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, role || 'candidate']);
        const userId = result.insertId.toString();
        const token = await new SignJWT({ id: userId, email, role: role || 'candidate' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);
        // Welcome email (fire and forget)
        if (role === 'company') {
            sendEmail(email, 'Welcome to SalesRoles.co — Start Hiring Top Sales Talent', `<p>Hi ${name},</p><p>Welcome to SalesRoles.co. You are now set up to post sales roles with full compensation transparency.</p><p>Here is how to get started:</p><ul><li>Post your first job listing in minutes</li><li>Every listing shows base salary, OTE, and commission upfront</li><li>Attract serious candidates who already know the deal</li></ul><p><a href="https://salesroles.co/post-job">Post Your First Job</a></p><p>Questions? Reply to this email and we will get back to you within 1 business day.</p><p>The SalesRoles.co team</p>`);
        }
        else {
            sendEmail(email, 'Welcome to SalesRoles.co', `<p>Hi ${name},</p><p>Welcome to SalesRoles.co. Every role. Full transparency.</p><p>Browse sales roles with base salary, OTE, and commission shown upfront. No more guessing.</p><p><a href="https://salesroles.co/jobs">Browse Jobs</a></p><p>The SalesRoles.co team</p>`);
        }
        return c.json({ token, user: { id: userId, email, displayName: name, role: role || 'candidate' } });
    }
    catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return c.json({ error: 'Email already registered' }, 409);
        return c.json({ error: 'Registration failed' }, 500);
    }
});
app.post('/api/auth/login', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    try {
        const { email, password } = await c.req.json();
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user)
            return c.json({ error: 'Invalid credentials' }, 401);
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return c.json({ error: 'Invalid credentials' }, 401);
        const token = await new SignJWT({ id: user.id.toString(), email: user.email, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);
        return c.json({ token, user: { id: user.id.toString(), email: user.email, displayName: user.name, role: user.role } });
    }
    catch {
        return c.json({ error: 'Login failed' }, 500);
    }
});
app.get('/api/auth/me', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [String(payload.id)]);
        const user = rows[0];
        if (!user)
            return c.json({ error: 'User not found' }, 404);
        return c.json({ user: { id: user.id.toString(), email: user.email, displayName: user.name, role: user.role } });
    }
    catch {
        return c.json({ error: 'Invalid token' }, 401);
    }
});
// --- Admin ---
app.post('/api/admin/login', async (c) => {
    try {
        const { password } = await c.req.json();
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (password === adminPassword) {
            return c.json({ ok: true });
        }
        return c.json({ ok: false }, 401);
    }
    catch {
        return c.json({ ok: false }, 400);
    }
});
// --- Payments ---
app.post('/api/payments/create-checkout-session', async (c) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        return c.json({ error: 'Stripe not configured. Contact info@salesroles.co to post your job.' }, 503);
    }
    if (!stripe)
        return c.json({ error: 'Stripe not configured' }, 503);
    try {
        const { plan, jobId } = await c.req.json();
        const prices = {
            standard: 9900,
            featured: 24900,
        };
        const productNames = {
            standard: 'Standard Job Listing',
            featured: 'Featured Job Listing',
        };
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
        });
        return c.json({ url: session.url });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// --- Jobs ---
const SALES_KEYWORDS = ['sales', 'account executive', 'sdr', 'bdr', 'business development', 'account manager', 'revenue', 'closing', 'customer success', 'representative'];
const LANG_SUFFIX = /\s*-\s*(English|German|French|Spanish|Dutch|Italian|Portuguese|Polish|Czech|Romanian|Hungarian|Turkish|Arabic|Japanese|Korean|Chinese)$/i;
function extractDomain(url) {
    try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    }
    catch {
        return url;
    }
}
app.get('/api/jobs', async (c) => {
    if (!pool)
        return c.json({ jobs: [] });
    try {
        const [rows] = await pool.execute("SELECT * FROM jobs WHERE status = 'live' ORDER BY featured DESC, created_at DESC");
        const jobs = rows.map(row => ({
            ...row,
            company: row.company_name,
            job_type: row.work_type,
            application_url: row.application_url || '',
            contact_email: row.contact_email || '',
            featured: !!row.featured,
        }));
        return c.json({ jobs });
    }
    catch {
        return c.json({ jobs: [] });
    }
});
app.get('/api/jobs/external', async (c) => {
    try {
        const res = await fetch('https://arbeitnow.com/api/job-board-api');
        const data = await res.json();
        const salesJobs = data.data.filter((job) => SALES_KEYWORDS.some(kw => job.title.toLowerCase().includes(kw) ||
            job.tags?.some((t) => t.toLowerCase().includes(kw))));
        const mapped = salesJobs.map((job) => {
            let domain = '';
            try {
                domain = extractDomain(job.url);
            }
            catch { }
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
            };
        });
        return c.json(mapped);
    }
    catch (e) {
        console.error('Arbeitnow fetch failed:', e);
        return c.json([]);
    }
});
app.get('/api/jobs/:id', async (c) => {
    const id = c.req.param('id');
    if (id.startsWith('arbeitnow-')) {
        const slug = id.replace('arbeitnow-', '');
        try {
            const res = await fetch('https://arbeitnow.com/api/job-board-api');
            const data = await res.json();
            const job = data.data.find((j) => j.slug === slug);
            if (!job)
                return c.json({ error: 'Job not found' }, 404);
            let domain = '';
            try {
                domain = new URL(job.url).hostname.replace('www.', '');
            }
            catch { }
            const cleanName = job.company_name.replace(LANG_SUFFIX, '').trim();
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
                } });
        }
        catch {
            return c.json({ error: 'Failed to fetch job' }, 500);
        }
    }
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    try {
        const [rows] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [id]);
        const row = rows[0];
        if (!row)
            return c.json({ error: 'Job not found' }, 404);
        return c.json({ job: { ...row, company: row.company_name, job_type: row.work_type, featured: !!row.featured } });
    }
    catch {
        return c.json({ error: 'Failed to fetch job' }, 500);
    }
});
// --- Admin Stats ---
app.get('/api/admin/stats', async (c) => {
    if (!pool)
        return c.json({ liveListings: 0, totalRevenue: 0, candidates: 0, pendingReview: 0 });
    try {
        const [jobs] = await pool.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'live'");
        const [pending] = await pool.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'");
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        return c.json({
            liveListings: jobs[0]?.count || 0,
            totalRevenue: 0,
            candidates: users[0]?.count || 0,
            pendingReview: pending[0]?.count || 0,
        });
    }
    catch {
        return c.json({ liveListings: 0, totalRevenue: 0, candidates: 0, pendingReview: 0 });
    }
});
app.delete('/api/admin/jobs/:id', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    try {
        const { password } = await c.req.json();
        if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const id = c.req.param('id');
        await pool.execute('DELETE FROM jobs WHERE id = ?', [id]);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Delete failed' }, 500);
    }
});
// --- Dashboard ---
app.get('/api/dashboard/stats', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        await jwtVerify(auth.slice(7), JWT_SECRET);
        return c.json({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 });
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
app.put('/api/auth/profile', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const { name } = await c.req.json();
        if (!name?.trim())
            return c.json({ error: 'Name is required' }, 400);
        await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), String(payload.id)]);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Update failed' }, 500);
    }
});
// --- Subscribe ---
app.post('/api/subscribe', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    try {
        const { email } = await c.req.json();
        if (!email || !email.includes('@'))
            return c.json({ error: 'Invalid email' }, 400);
        await pool.execute('INSERT IGNORE INTO subscribers (email) VALUES (?)', [email]);
        sendEmail(email, 'You are on the list. SalesRoles.co Weekly Job Alerts', `<p>Hi,</p><p>You are now subscribed to the SalesRoles.co weekly job alert. Every Monday morning you will get the latest sales roles with full compensation transparency direct to your inbox.</p><p>No spam. Unsubscribe anytime by replying to this email.</p><p>The SalesRoles.co team</p>`);
        sendEmail('info@salesroles.co', 'New subscriber on SalesRoles.co', `<p>New subscriber: <strong>${email}</strong></p><p>Subscribed at: ${new Date().toISOString()}</p>`);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Subscribe failed' }, 500);
    }
});
// --- Saved Jobs ---
app.get('/api/saved-jobs', async (c) => {
    if (!pool)
        return c.json({ jobs: [] });
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const [rows] = await pool.execute(`SELECT j.*, j.company_name AS company, j.work_type AS job_type
       FROM jobs j
       INNER JOIN saved_jobs s ON j.id = s.job_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`, [userId]);
        return c.json({ jobs: rows });
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
app.post('/api/saved-jobs', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const { jobId } = await c.req.json();
        const [existing] = await pool.execute('SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId]);
        if (existing.length > 0) {
            await pool.execute('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId]);
            return c.json({ saved: false });
        }
        await pool.execute('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [userId, jobId]);
        return c.json({ saved: true });
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
// --- Create Job ---
app.post('/api/jobs', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    let userId;
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        userId = String(payload.id);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const job = await c.req.json();
        const id = `job-${Date.now()}`;
        const status = job.status || 'pending';
        await pool.execute(`INSERT INTO jobs (id, title, company_name, company_website, location, work_type, seniority, sector, description, base_salary, ote, commission_structure, currency, status, company_id, screening_questions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [id, job.title, job.company_name, job.company_website, job.location, job.work_type, job.seniority, job.sector, job.description, job.base_salary, job.ote, job.commission_structure || '', job.currency || 'USD', status, userId, JSON.stringify(job.screening_questions?.filter(Boolean) || [])]);
        return c.json({ ok: true, id });
    }
    catch (err) {
        return c.json({ error: err.message || 'Failed to create job' }, 500);
    }
});
// --- Admin job moderation ---
app.get('/api/admin/pending-jobs', async (c) => {
    if (!pool)
        return c.json([]);
    try {
        const [jobs] = await pool.execute("SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC");
        return c.json(jobs);
    }
    catch {
        return c.json([]);
    }
});
app.post('/api/admin/jobs/:id/approve', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const id = c.req.param('id');
    try {
        await pool.execute("UPDATE jobs SET status = 'live' WHERE id = ?", [id]);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Approve failed' }, 500);
    }
});
app.post('/api/admin/jobs/:id/reject', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const id = c.req.param('id');
    try {
        await pool.execute("UPDATE jobs SET status = 'rejected' WHERE id = ?", [id]);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Reject failed' }, 500);
    }
});
app.get('/api/admin/candidates', async (c) => {
    if (!pool)
        return c.json([]);
    try {
        const [users] = await pool.execute(`SELECT u.id, u.name, u.email, u.role, u.created_at,
        (SELECT company_name FROM jobs WHERE company_id = u.id LIMIT 1) as company_name
       FROM users u
       ORDER BY u.created_at DESC`);
        return c.json(users);
    }
    catch {
        return c.json([]);
    }
});
app.get('/api/admin/subscribers', async (c) => {
    if (!pool)
        return c.json([]);
    try {
        const [rows] = await pool.execute('SELECT email, created_at FROM subscribers ORDER BY created_at DESC');
        return c.json(rows);
    }
    catch {
        return c.json([]);
    }
});
// --- Company dashboard ---
app.get('/api/company/pending-jobs', async (c) => {
    if (!pool)
        return c.json([]);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const [jobs] = await pool.execute("SELECT * FROM jobs WHERE (status = 'pending' OR status = 'draft') AND company_id = ? ORDER BY created_at DESC", [userId]);
        return c.json(jobs);
    }
    catch {
        return c.json([]);
    }
});
// --- Applications ---
app.post('/api/applications', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    let userId, userEmail;
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        userId = String(payload.id);
        userEmail = String(payload.email);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const formData = await c.req.formData();
        const jobId = formData.get('jobId');
        const coverLetter = formData.get('coverLetter') || '';
        const answers = formData.get('answers') || '[]';
        const cvFile = formData.get('cv');
        const cvFilename = cvFile ? cvFile.name : null;
        const [userRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [userId]);
        const userName = userRows[0]?.name || '';
        const [existing] = await pool.execute('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?', [jobId, userId]);
        if (existing.length > 0) {
            return c.json({ error: 'Already applied' }, 400);
        }
        await pool.execute('INSERT INTO applications (job_id, candidate_id, candidate_name, candidate_email, cover_note, cv_filename, screening_answers) VALUES (?, ?, ?, ?, ?, ?, ?)', [jobId, userId, userName, userEmail, coverLetter, cvFilename, answers]);
        const [jobRows] = await pool.execute('SELECT j.title, u.email as company_email, u.name as company_name FROM jobs j JOIN users u ON j.company_id = u.id WHERE j.id = ?', [jobId]);
        const jobInfo = jobRows[0];
        if (jobInfo?.company_email) {
            sendEmail(jobInfo.company_email, `New application for ${jobInfo.title}`, `<p>Hi ${jobInfo.company_name},</p><p>New application for <strong>${jobInfo.title}</strong>.</p><p><strong>Applicant:</strong> ${userName} (${userEmail})</p>${coverLetter ? `<p><strong>Cover letter:</strong> ${coverLetter}</p>` : ''}<p><a href="https://salesroles.co/dashboard">View in dashboard</a></p><p>The SalesRoles.co team</p>`);
        }
        return c.json({ ok: true });
    }
    catch (err) {
        return c.json({ error: err.message || 'Failed to submit application' }, 500);
    }
});
app.get('/api/company/applications', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    let userId;
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        userId = String(payload.id);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const [apps] = await pool.execute(`SELECT a.*, j.title as job_title, j.id as job_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = ?
       ORDER BY a.created_at DESC`, [userId]);
        return c.json(apps);
    }
    catch {
        return c.json([]);
    }
});
app.get('/api/company/applications/:jobId', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    let userId;
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        userId = String(payload.id);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const jobId = c.req.param('jobId');
        const [apps] = await pool.execute(`SELECT a.* FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.job_id = ? AND j.company_id = ?
       ORDER BY a.created_at DESC`, [jobId, userId]);
        return c.json(apps);
    }
    catch {
        return c.json([]);
    }
});
// --- Candidate CV upload ---
app.post('/api/candidate/upload-cv', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const formData = await c.req.formData();
        const file = formData.get('cv');
        if (!file)
            return c.json({ error: 'No file' }, 400);
        const filename = file.name;
        await pool.execute('UPDATE users SET cv_filename = ? WHERE id = ?', [filename, userId]);
        return c.json({ ok: true, filename });
    }
    catch {
        return c.json({ error: 'Upload failed' }, 500);
    }
});
// --- Candidate profile update ---
app.put('/api/candidate/profile', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const data = await c.req.json();
        await pool.execute(`UPDATE users SET headline=?, location=?, years_in_sales=?, total_revenue=?, companies_closed=?, current_roles=?, looking_for=?, bio=?, work_history=?, is_public=? WHERE id=?`, [
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
            userId,
        ]);
        return c.json({ ok: true });
    }
    catch {
        return c.json({ error: 'Update failed' }, 500);
    }
});
app.get('/api/candidate/me', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const [rows] = await pool.execute(`SELECT id, name, email, role, headline, location, years_in_sales, total_revenue, companies_closed, current_roles, looking_for, bio, work_history, cv_filename, is_public, is_pro FROM users WHERE id = ?`, [userId]);
        const user = rows[0];
        if (!user)
            return c.json({ error: 'Not found' }, 404);
        return c.json(user);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
// --- Public candidate search & profiles ---
app.get('/api/candidates', async (c) => {
    if (!pool)
        return c.json([]);
    const search = c.req.query('search') || '';
    try {
        const [rows] = await pool.execute(`SELECT id, name, headline, location, years_in_sales, total_revenue, current_roles, looking_for, cv_filename, is_pro
       FROM users
       WHERE role = 'candidate' AND is_public = 1
       AND (name LIKE ? OR headline LIKE ? OR current_roles LIKE ? OR looking_for LIKE ?)
       ORDER BY is_pro DESC, created_at DESC`, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]);
        return c.json(rows);
    }
    catch {
        return c.json([]);
    }
});
app.get('/api/candidates/:id/download-cv', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const viewerId = String(payload.id);
        const candidateId = c.req.param('id');
        const [rows] = await pool.execute('SELECT cv_filename FROM users WHERE id = ?', [candidateId]);
        const user = rows[0];
        if (!user?.cv_filename)
            return c.json({ error: 'No CV on file' }, 404);
        await pool.execute('INSERT INTO profile_views (viewer_id, candidate_id, action) VALUES (?, ?, ?)', [viewerId, candidateId, 'cv_download']).catch(() => { });
        return c.json({ filename: user.cv_filename });
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
app.get('/api/candidates/:id', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const id = c.req.param('id');
    try {
        const [rows] = await pool.execute(`SELECT id, name, headline, location, years_in_sales, total_revenue, companies_closed, current_roles, looking_for, bio, work_history, cv_filename, is_pro
       FROM users WHERE id = ? AND is_public = 1`, [id]);
        if (!rows.length)
            return c.json({ error: 'Not found' }, 404);
        return c.json(rows[0]);
    }
    catch {
        return c.json({ error: 'Not found' }, 404);
    }
});
app.post('/api/candidates/:id/view', async (c) => {
    if (!pool)
        return c.json({ ok: true });
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ ok: true });
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const viewerId = String(payload.id);
        const candidateId = c.req.param('id');
        await pool.execute('INSERT INTO profile_views (viewer_id, candidate_id, action) VALUES (?, ?, ?)', [viewerId, candidateId, 'view']).catch(() => { });
    }
    catch { }
    return c.json({ ok: true });
});
app.get('/api/candidate/profile-views', async (c) => {
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer '))
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
        const userId = String(payload.id);
        const [userRows] = await pool.execute('SELECT is_pro FROM users WHERE id = ?', [userId]);
        if (!userRows[0]?.is_pro)
            return c.json({ error: 'Pro required' }, 403);
        const [views] = await pool.execute(`SELECT pv.action, pv.created_at, u.name as viewer_name, u.email as viewer_email
       FROM profile_views pv
       LEFT JOIN users u ON pv.viewer_id = u.id
       WHERE pv.candidate_id = ?
       ORDER BY pv.created_at DESC
       LIMIT 50`, [userId]);
        return c.json(views);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
// --- Pro membership checkout ---
app.get('/api/payments/pro-checkout', async (c) => {
    if (!process.env.STRIPE_SECRET_KEY || !stripe)
        return c.json({ error: 'Stripe not configured' }, 503);
    const authHeader = c.req.header('Authorization') || '';
    const tokenParam = c.req.query('token') || '';
    const token = authHeader.replace('Bearer ', '') || tokenParam;
    if (!token)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
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
        });
        return c.redirect(session.url);
    }
    catch {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
// --- Test endpoint: simulate Stripe webhook payment completion ---
app.post('/api/test/simulate-payment', async (c) => {
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_PAYMENT_TEST) {
        return c.json({ error: 'Not available' }, 403);
    }
    if (!pool)
        return c.json({ error: 'Database not configured' }, 503);
    const { jobId } = await c.req.json();
    await pool.execute("UPDATE jobs SET status = 'pending' WHERE id = ?", [jobId]);
    return c.json({ ok: true, message: `Job ${jobId} moved to pending` });
});
// --- Static file serving (production) ---
const mimeTypes = {
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
};
app.get('/assets/*', (c) => {
    const url = new URL(c.req.url);
    const filePath = path.join(distPath, url.pathname);
    if (!existsSync(filePath))
        return c.notFound();
    const mime = mimeTypes[extname(filePath)] || 'application/octet-stream';
    const stream = createReadStream(filePath);
    return new Response(stream, { headers: { 'Content-Type': mime } });
});
app.get('/favicon.svg', (c) => {
    const filePath = path.join(distPath, 'favicon.svg');
    if (!existsSync(filePath))
        return c.notFound();
    const stream = createReadStream(filePath);
    return new Response(stream, { headers: { 'Content-Type': 'image/svg+xml' } });
});
app.get('*', (c) => {
    const indexPath = path.join(distPath, 'index.html');
    try {
        const html = readFileSync(indexPath, 'utf-8');
        return c.html(html);
    }
    catch {
        return c.text('App not built. Run npm run build first.', 404);
    }
});
// --- Server ---
const port = parseInt(process.env.PORT || '4000');
serve({ fetch: app.fetch, port }, () => console.log(`Server running on http://localhost:${port}`));
export default app;
