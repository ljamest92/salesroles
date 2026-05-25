import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@blinkdotnew/sdk'

const app = new Hono()

app.use('*', cors())

app.get('/jobs', async (c) => {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')
    const result = await response.json()
    
    const salesKeywords = ['sales', 'account executive', 'business development', 'sdr', 'account manager', 'revenue', 'representative', 'customer success']
    
    const salesJobs = result.data
      .filter((job: any) => 
        salesKeywords.some(keyword => job.title.toLowerCase().includes(keyword))
      )
      .map((job: any) => ({
        id: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.location,
        job_type: job.remote ? 'Remote' : 'On-site',
        description: job.description,
        url: job.url,
        created_at: job.created_at
      }))

    // Deduplicate
    const uniqueJobs = Array.from(new Map(salesJobs.map((item: any) => [item.id, item])).values())

    return c.json({ data: uniqueJobs })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default app
