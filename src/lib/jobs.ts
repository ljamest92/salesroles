export interface Job {
  id: string
  title: string
  company: string
  logo_url?: string
  location: string
  job_type: string
  sector: string
  seniority: string
  description: string
  base_salary: string
  ote: string
  commission_structure: string
  quota?: string
  currency: string
  application_url: string
  contact_email: string
  status: string
  featured: boolean
  created_at: string
  is_partner?: boolean
  perks?: string[]
  company_description?: string
}

const CACHE_KEY = 'salesroles_jobs_cache'
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function extractDomain(companyName: string): string {
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .trim()
    .split(' ')[0];
  return `${cleanName}.com`;
}

export function parseOteValue(oteString: string): number {
  if (!oteString || oteString === 'Salary Not Disclosed') return 0
  // Take only the first number in the range, handling k/K suffix
  const match = oteString.match(/[\$€£]?\s*(\d[\d,]*)\s*k?/i)
  if (!match) return 0
  const num = parseFloat(match[1].replace(/,/g, ''))
  // If the number looks like it's already in thousands (e.g. 200000), convert
  // If it has a 'k' after it, it's already in thousands format
  const hasK = oteString.toLowerCase().includes('k')
  if (hasK) return num // already in k format (200 = $200k)
  if (num > 10000) return Math.round(num / 1000) // convert raw number to k
  return num
}

export async function fetchPartnerJobs(): Promise<Job[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
    }

    // Attempt Arbeitnow API
    let salesJobs: Job[] = []
    try {
      const response = await fetch('https://arbeitnow.com/api/job-board-api')
      if (!response.ok) throw new Error('API down')
      const result = await response.json()
      
      const salesKeywords = ['sales', 'account executive', 'business development', 'sdr', 'account manager', 'revenue', 'representative', 'customer success', 'bdr']
      
      salesJobs = result.data
        .filter((job: any) => 
          salesKeywords.some(keyword => job.title.toLowerCase().includes(keyword))
        )
        .map((job: any) => {
          const domain = extractDomain(job.company_name)
          
          return {
            id: job.slug,
            title: toTitleCase(job.title),
            company: toTitleCase(job.company_name),
            logo_url: `https://logo.clearbit.com/${domain}`,
            location: toTitleCase(job.location),
            job_type: job.remote ? 'Remote' : 'On-site',
            sector: 'Sales',
            seniority: 'Mid-Level',
            description: job.description,
            base_salary: job.salary || 'Salary Not Disclosed',
            ote: job.ote || 'Salary Not Disclosed',
            commission_structure: 'Uncapped commission with accelerators.',
            currency: 'USD',
            application_url: job.url,
            contact_email: 'apply@partner.com',
            status: 'live',
            featured: false,
            created_at: new Date().toISOString(),
            is_partner: true
          }
        })
    } catch (apiError) {
      console.warn('Partner API failed, using high-quality fallback data')
      salesJobs = [
        {
          id: 'ae-stripe-global',
          title: 'Enterprise Account Executive',
          company: 'Stripe',
          logo_url: 'https://logo.clearbit.com/stripe.com',
          location: 'Remote (Global)',
          job_type: 'Remote',
          sector: 'FinTech',
          seniority: 'Senior',
          description: 'Leading global payments infrastructure...',
          base_salary: '$130k - $160k',
          ote: '$260k - $320k',
          commission_structure: '10% base commission, accelerators at 110%.',
          currency: 'USD',
          application_url: 'https://stripe.com/jobs',
          contact_email: 'hiring@stripe.com',
          status: 'live',
          featured: true,
          created_at: new Date().toISOString(),
          is_partner: false
        },
        {
          id: 'sdr-gong-sf',
          title: 'Sales Development Representative',
          company: 'Gong',
          logo_url: 'https://logo.clearbit.com/gong.io',
          location: 'San Francisco, CA',
          job_type: 'On-site',
          sector: 'SaaS',
          seniority: 'Entry Level',
          description: 'Join the #1 revenue intelligence platform...',
          base_salary: '$65k - $80k',
          ote: '$95k - $115k',
          commission_structure: 'Monthly bonus based on qualified meetings.',
          currency: 'USD',
          application_url: 'https://gong.io/careers',
          contact_email: 'talent@gong.io',
          status: 'live',
          featured: false,
          created_at: new Date().toISOString(),
          is_partner: false
        },
        {
          id: 'am-hubspot-dublin',
          title: 'Strategic Account Manager',
          company: 'HubSpot',
          logo_url: 'https://logo.clearbit.com/hubspot.com',
          location: 'Dublin, Ireland',
          job_type: 'Hybrid',
          sector: 'SaaS',
          seniority: 'Mid-Level',
          description: 'Managing a portfolio of enterprise customers...',
          base_salary: '€85k - €105k',
          ote: '€140k - €170k',
          commission_structure: 'Renewal commission + expansion bonus.',
          currency: 'EUR',
          application_url: 'https://hubspot.com/careers',
          contact_email: 'jobs@hubspot.com',
          status: 'live',
          featured: true,
          created_at: new Date().toISOString(),
          is_partner: false
        },
        {
          id: 'ae-vercel-nyc',
          title: 'Account Executive',
          company: 'Vercel',
          logo_url: 'https://logo.clearbit.com/vercel.com',
          location: 'New York, NY',
          job_type: 'Hybrid',
          sector: 'DevTools',
          seniority: 'Mid-Level',
          description: 'Help developers build a faster web...',
          base_salary: '$100k - $140k',
          ote: '$200k - $280k',
          commission_structure: 'Standard SaaS commission model.',
          currency: 'USD',
          application_url: 'https://vercel.com/careers',
          contact_email: 'hiring@vercel.com',
          status: 'live',
          featured: false,
          created_at: new Date().toISOString(),
          is_partner: false
        }
      ]
    }

    // Aggressive Deduplication by ID (slug) and Title-Company combo
    const uniqueById = new Map();
    salesJobs.forEach(job => {
      if (!uniqueById.has(job.id)) {
        uniqueById.set(job.id, job);
      }
    });

    const uniqueByTitleCompany = new Map();
    uniqueById.forEach(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (!uniqueByTitleCompany.has(key)) {
        uniqueByTitleCompany.set(key, job);
      }
    });

    const uniqueJobs = Array.from(uniqueByTitleCompany.values()) as Job[];

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: uniqueJobs,
      timestamp: Date.now()
    }))

    return uniqueJobs
  } catch (error) {
    console.error('Error in fetchPartnerJobs:', error)
    return []
  }
}