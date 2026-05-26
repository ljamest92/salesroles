/**
 * One-time seed script: create testpro@salesroles.co Pro Candidate + 3 fake profile views
 * Run with: npx tsx backend/seed-testpro.ts
 */
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'salesroles',
  waitForConnections: true,
  connectionLimit: 5,
})

const EMAIL = 'testpro@salesroles.co'
const PASSWORD = 'TestPro123!'
const NAME = 'Alex Rivera (Test Pro)'

async function run() {
  try {
    // 1. Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [EMAIL]
    ) as any[]

    let userId: number

    if ((existing as any[]).length > 0) {
      userId = (existing as any[])[0].id
      console.log(`User already exists — id=${userId}, updating to pro...`)
      // Ensure is_pro is set
      await pool.execute(
        `UPDATE users SET
          is_pro = 1,
          is_public = 1,
          password_hash = ?,
          headline = 'Senior Account Executive · SaaS Sales',
          location = 'London, UK',
          target_role = 'VP of Sales',
          years_experience = 7,
          availability = 'Open to opportunities',
          target_salary = '£120,000 OTE',
          bio = 'Test pro candidate account. 7 years closing enterprise SaaS deals across EMEA.',
          skills = ?
        WHERE id = ?`,
        [
          await bcrypt.hash(PASSWORD, 10),
          JSON.stringify(['MEDDIC', 'Salesforce', 'Enterprise Sales', 'SaaS', 'EMEA']),
          userId,
        ]
      )
    } else {
      // 2. Hash password
      const hash = await bcrypt.hash(PASSWORD, 10)
      const namePart = 'alexrivera'
      const profileSlug = `${namePart}-${randomBytes(3).toString('hex')}`

      // 3. Insert user
      const [result] = await pool.execute(
        `INSERT INTO users (
          name, email, password_hash, role,
          is_pro, is_public, profile_slug,
          headline, location, target_role, years_experience,
          availability, target_salary, bio, skills
        ) VALUES (?, ?, ?, 'candidate', 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          NAME,
          EMAIL,
          hash,
          profileSlug,
          'Senior Account Executive · SaaS Sales',
          'London, UK',
          'VP of Sales',
          7,
          'Open to opportunities',
          '£120,000 OTE',
          'Test pro candidate account. 7 years closing enterprise SaaS deals across EMEA.',
          JSON.stringify(['MEDDIC', 'Salesforce', 'Enterprise Sales', 'SaaS', 'EMEA']),
        ]
      ) as any[]
      userId = (result as any).insertId
      console.log(`Created pro candidate user — id=${userId}`)
    }

    // 4. Seed 3 fake profile views
    const fakeViewers = [
      { name: 'Salesforce EMEA', company: 'Salesforce', daysAgo: 1 },
      { name: 'HubSpot Talent', company: 'HubSpot', daysAgo: 3 },
      { name: 'Gartner Recruiting', company: 'Gartner', daysAgo: 7 },
    ]

    for (const v of fakeViewers) {
      await pool.execute(
        `INSERT INTO profile_views (candidate_id, viewer_id, viewer_name, viewer_company, action, created_at)
         VALUES (?, NULL, ?, ?, 'view', DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [userId, v.name, v.company, v.daysAgo]
      )
    }
    console.log(`Seeded 3 fake profile views for user id=${userId}`)

    console.log('\n✅ Done! Login credentials:')
    console.log(`   Email:    ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log(`   Role:     candidate (Pro)`)
    console.log(`   User ID:  ${userId}`)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
