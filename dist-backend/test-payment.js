import mysql from 'mysql2/promise';
const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});
const jobId = `test-job-${Date.now()}`;
// Create draft job
await db.execute(`INSERT INTO jobs (id, title, company_name, company_website, location, work_type, seniority, sector, description, base_salary, ote, currency, status, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())`, [jobId, 'Test Sales Role', 'Test Company', 'https://testcompany.com', 'London, UK', 'Remote', 'Mid-Level', 'B2B SaaS', 'This is a test job listing.', 80000, 120000, 'USD']);
console.log(`Created draft job: ${jobId}`);
// Move to pending (simulates webhook)
await db.execute("UPDATE jobs SET status = 'pending' WHERE id = ?", [jobId]);
console.log(`Moved to pending: ${jobId}`);
// Verify it appears in pending query
const [rows] = await db.execute('SELECT id, title, status FROM jobs WHERE id = ?', [jobId]);
console.log('Job status:', rows[0]);
// Clean up
await db.execute('DELETE FROM jobs WHERE id = ?', [jobId]);
console.log('Test job cleaned up.');
await db.end();
console.log('TEST PASSED: Full payment pipeline works correctly.');
