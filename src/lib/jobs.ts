export interface Job {
  id: string
  title: string
  company: string
  domain?: string
  company_website?: string
  via_partner?: boolean
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
  source_tag?: string
}

const CACHE_KEY = 'salesroles_jobs_cache_v2'
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

// Canonical domains keyed by lowercase company slug
export const SEED_COMPANY_DOMAINS: Record<string, string> = {
  salesforce: 'salesforce.com',
  hubspot: 'hubspot.com',
  stripe: 'stripe.com',
  gong: 'gong.io',
  snowflake: 'snowflake.com',
  zendesk: 'zendesk.com',
  datadog: 'datadog.com',
  okta: 'okta.com',
  intercom: 'intercom.com',
  linear: 'linear.app',
}

export const SEED_JOBS: Job[] = [
  {
    id: 'seed-ent-ae-salesforce',
    title: 'Enterprise Account Executive',
    company: 'Salesforce',
    domain: 'salesforce.com',
    location: 'San Francisco, CA',
    job_type: 'Hybrid',
    sector: 'SaaS',
    seniority: 'Senior',
    description: 'Drive new business across Fortune 500 accounts in the West region. Own the full sales cycle from prospecting to close on six-figure deals.',
    base_salary: '$135k - $155k',
    ote: '$270k - $310k',
    commission_structure: 'Uncapped commission with 2× accelerators above 100% quota.',
    quota: '$2.4M ARR',
    currency: 'USD',
    application_url: 'https://salesforce.com/careers',
    contact_email: 'recruiting@salesforce.com',
    status: 'live',
    featured: true,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Equity', 'Remote Fridays', 'Wellness stipend'],
    company_description: 'Salesforce is the global leader in CRM, helping companies of every size connect with their customers in a whole new way.'
  },
  {
    id: 'seed-sdr-hubspot-remote',
    title: 'Sales Development Representative',
    company: 'HubSpot',
    domain: 'hubspot.com',
    location: 'Remote (US)',
    job_type: 'Remote',
    sector: 'SaaS',
    seniority: 'Entry Level',
    description: 'Generate qualified pipeline for our Mid-Market AE team through outbound prospecting and inbound lead qualification.',
    base_salary: '$60k - $70k',
    ote: '$90k - $110k',
    commission_structure: 'Monthly bonus per qualified meeting booked, quarterly kickers.',
    quota: '40 SQOs / quarter',
    currency: 'USD',
    application_url: 'https://hubspot.com/careers',
    contact_email: 'talent@hubspot.com',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Unlimited PTO', 'Stock options', 'Home office budget'],
    company_description: 'HubSpot is a leading CRM platform that provides software and support to help companies grow better.'
  },
  {
    id: 'seed-am-stripe-nyc',
    title: 'Strategic Account Manager',
    company: 'Stripe',
    domain: 'stripe.com',
    location: 'New York, NY',
    job_type: 'Hybrid',
    sector: 'FinTech',
    seniority: 'Senior',
    description: 'Manage and expand relationships with Stripe\'s largest US enterprise accounts. Drive product adoption and revenue expansion across the payments suite.',
    base_salary: '$120k - $145k',
    ote: '$240k - $290k',
    commission_structure: '10% commission on net new ARR, expansion bonus at 110% attainment.',
    quota: '$3M net new ARR',
    currency: 'USD',
    application_url: 'https://stripe.com/jobs',
    contact_email: 'jobs@stripe.com',
    status: 'live',
    featured: true,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Equity', '401k match', 'Flexible hours'],
    company_description: 'Stripe is a financial infrastructure platform for businesses. Millions of companies use Stripe to accept payments and grow their revenue.'
  },
  {
    id: 'seed-bdm-gong-chicago',
    title: 'Business Development Manager',
    company: 'Gong',
    domain: 'gong.io',
    location: 'Chicago, IL',
    job_type: 'Hybrid',
    sector: 'SaaS',
    seniority: 'Mid-Level',
    description: 'Lead strategic partnerships and channel development across the Midwest. Build a pipeline of reseller and technology alliances that extend Gong\'s market reach.',
    base_salary: '$110k - $130k',
    ote: '$200k - $240k',
    commission_structure: 'Deal-based commission with partner multipliers.',
    quota: '$1.8M influenced ARR',
    currency: 'USD',
    application_url: 'https://gong.io/careers',
    contact_email: 'hiring@gong.io',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['RSUs', 'Medical/Dental/Vision', 'Annual sales conference'],
    company_description: 'Gong is the #1 revenue intelligence platform, turning customer interactions into insights that drive growth.'
  },
  {
    id: 'seed-rsm-snowflake-austin',
    title: 'Regional Sales Manager',
    company: 'Snowflake',
    domain: 'snowflake.com',
    location: 'Austin, TX',
    job_type: 'Hybrid',
    sector: 'SaaS',
    seniority: 'Senior',
    description: 'Lead a team of 6 AEs covering the South-Central region. Own $15M team quota and coach reps through complex multi-stakeholder enterprise deals.',
    base_salary: '$160k - $185k',
    ote: '$300k - $370k',
    commission_structure: 'Team attainment bonus + individual override on closed-won.',
    quota: '$15M ARR (team)',
    currency: 'USD',
    application_url: 'https://snowflake.com/careers',
    contact_email: 'talent@snowflake.com',
    status: 'live',
    featured: true,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Equity', 'Generous PTO', 'Leadership development budget'],
    company_description: 'Snowflake delivers the AI Data Cloud — enabling data storage, processing, and analytic solutions with near-unlimited scale.'
  },
  {
    id: 'seed-ise-zendesk-boston',
    title: 'Inside Sales Executive',
    company: 'Zendesk',
    domain: 'zendesk.com',
    location: 'Boston, MA',
    job_type: 'On-site',
    sector: 'SaaS',
    seniority: 'Mid-Level',
    description: 'Close inbound and outbound SMB to mid-market deals across North America. Manage a high-velocity pipeline of 80+ opportunities per quarter.',
    base_salary: '$75k - $90k',
    ote: '$130k - $160k',
    commission_structure: 'Monthly commission on closed-won, quarterly accelerators.',
    quota: '$900k ARR',
    currency: 'USD',
    application_url: 'https://zendesk.com/jobs',
    contact_email: 'careers@zendesk.com',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Stock options', 'Team events', 'Commuter benefits'],
    company_description: 'Zendesk is a service-first CRM company that builds software designed to improve customer relationships.'
  },
  {
    id: 'seed-ae-datadog-london',
    title: 'Account Executive — EMEA',
    company: 'Datadog',
    domain: 'datadog.com',
    location: 'London, UK',
    job_type: 'Hybrid',
    sector: 'SaaS',
    seniority: 'Senior',
    description: 'Own new business across the UK & Ireland for Datadog\'s observability and security platform. Target DevOps and engineering leaders at mid-market and enterprise accounts.',
    base_salary: '£90k - £110k',
    ote: '£180k - £220k',
    commission_structure: 'Uncapped. Quarterly accelerators from 100% of quota.',
    quota: '£2M ARR',
    currency: 'GBP',
    application_url: 'https://datadoghq.com/careers',
    contact_email: 'hiring@datadoghq.com',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Equity (RSUs)', 'Private healthcare', 'Learning budget'],
    company_description: 'Datadog is the monitoring and security platform for cloud applications, used by thousands of enterprises worldwide.'
  },
  {
    id: 'seed-se-okta-remote',
    title: 'Sales Engineer',
    company: 'Okta',
    domain: 'okta.com',
    location: 'Remote (US)',
    job_type: 'Remote',
    sector: 'Cybersecurity',
    seniority: 'Senior',
    description: 'Partner with AEs to drive technical wins across Identity and Access Management deals. Own POC design, technical discovery, and RFP responses for $500k+ opportunities.',
    base_salary: '$140k - $165k',
    ote: '$210k - $250k',
    commission_structure: 'SE bonus tied to team quota attainment, paid quarterly.',
    currency: 'USD',
    application_url: 'https://okta.com/company/careers',
    contact_email: 'careers@okta.com',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['RSUs', 'Home lab stipend', 'Flexible schedule'],
    company_description: 'Okta is the leading independent identity provider, enabling any person to safely use any technology.'
  },
  {
    id: 'seed-csd-intercom-dublin',
    title: 'Customer Success Director',
    company: 'Intercom',
    domain: 'intercom.com',
    location: 'Dublin, Ireland',
    job_type: 'Hybrid',
    sector: 'SaaS',
    seniority: 'Director',
    description: 'Lead a team of 8 CSMs managing Intercom\'s strategic EMEA accounts. Own net revenue retention, expansion bookings, and executive relationships across the portfolio.',
    base_salary: '€115k - €135k',
    ote: '€165k - €195k',
    commission_structure: 'NRR-based bonus + expansion commission, paid semi-annually.',
    quota: '110% NRR across portfolio',
    currency: 'EUR',
    application_url: 'https://intercom.com/careers',
    contact_email: 'jobs@intercom.com',
    status: 'live',
    featured: false,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Equity', 'Pension scheme', 'Parental leave'],
    company_description: 'Intercom is the complete AI-first customer service solution, giving exceptional customer experiences at scale.'
  },
  {
    id: 'seed-vp-sales-linear-remote',
    title: 'VP of Sales',
    company: 'Linear',
    domain: 'linear.app',
    location: 'Remote (Global)',
    job_type: 'Remote',
    sector: 'SaaS',
    seniority: 'VP / Executive',
    description: 'Build and scale Linear\'s go-to-market engine from the ground up. Hire the first sales team, define the sales playbook, and own $10M ARR growth for the next 18 months.',
    base_salary: '$180k - $220k',
    ote: '$360k - $440k',
    commission_structure: 'Company-wide revenue bonus + significant equity package.',
    currency: 'USD',
    application_url: 'https://linear.app/careers',
    contact_email: 'hiring@linear.app',
    status: 'live',
    featured: true,
    created_at: new Date().toISOString(),
    is_partner: false,
    perks: ['Significant equity', 'Async-first culture', 'Annual team retreats'],
    company_description: 'Linear is the project management tool built for high-performance teams, trusted by thousands of product teams worldwide.'
  }
]

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
  const match = oteString.match(/[\$€£]?\s*(\d[\d,]*)\s*k?/i)
  if (!match) return 0
  const num = parseFloat(match[1].replace(/,/g, ''))
  const hasK = oteString.toLowerCase().includes('k')
  if (hasK) return num
  if (num > 10000) return Math.round(num / 1000)
  return num
}

// Regex word-boundary patterns for precise sales title matching.
// Test: "Field Engineer" → false (no pattern fires)
// Test: "Field Sales Manager" → true (\bsales\b matches "Sales")
const SALES_PATTERNS: RegExp[] = [
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
  return SALES_PATTERNS.some(p => p.test(title))
}

const ARBEITNOW_ALLOWED_LOCATIONS = [
  'united kingdom', 'uk', 'england', 'scotland', 'wales',
  'united states', 'usa', 'u.s.', 'australia', 'canada',
  'remote', 'worldwide', 'global', 'anywhere',
]

async function fetchArbeitnowJobs(): Promise<Job[]> {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')
    if (!response.ok) throw new Error('API down')
    const result = await response.json()

    return result.data
      .filter((job: any) => {
        if (job.remote) return true
        const loc = (job.location || '').toLowerCase()
        return ARBEITNOW_ALLOWED_LOCATIONS.some(l => loc.includes(l))
      })
      .filter((job: any) => isSalesTitle(job.title || ''))
      .filter((job: any) => (job.salary_from && job.salary_from > 0) || (job.salary_to && job.salary_to > 0))
      .map((job: any) => {
        const domain = extractDomain(job.company_name)
        const curr = job.salary_currency === 'GBP' ? '£' : job.salary_currency === 'EUR' ? '€' : '$'
        const salaryStr = job.salary_from && job.salary_to
          ? `${curr}${Math.round(job.salary_from / 1000)}k – ${curr}${Math.round(job.salary_to / 1000)}k`
          : job.salary_from
            ? `${curr}${Math.round(job.salary_from / 1000)}k+`
            : null
        return {
          id: job.slug,
          title: toTitleCase(job.title),
          company: toTitleCase(job.company_name),
          domain,
          location: toTitleCase(job.location),
          job_type: job.remote ? 'Remote' : 'On-site',
          sector: 'Sales',
          seniority: 'Mid-Level',
          description: job.description,
          base_salary: salaryStr || 'Salary Not Disclosed',
          ote: salaryStr || 'Salary Not Disclosed',
          commission_structure: 'Uncapped commission with accelerators.',
          currency: job.salary_currency || 'USD',
          application_url: job.url,
          contact_email: 'apply@partner.com',
          status: 'live',
          featured: false,
          created_at: new Date().toISOString(),
          is_partner: true,
          source_tag: 'Via Arbeitnow',
        } as Job
      })
  } catch {
    console.warn('Arbeitnow API unavailable')
    return []
  }
}

async function fetchAdzunaJobs(): Promise<Job[]> {
  const appId = import.meta.env.VITE_ADZUNA_APP_ID
  const appKey = import.meta.env.VITE_ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const countries = ['gb', 'us', 'au', 'ca']
  const currencyMap: Record<string, string> = { gb: '£', us: '$', au: 'A$', ca: 'C$' }
  const currencyCodeMap: Record<string, string> = { gb: 'GBP', us: 'USD', au: 'AUD', ca: 'CAD' }

  const settled = await Promise.allSettled(
    countries.map(country =>
      fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=sales&salary_include_unknown=0`
      )
        .then(r => (r.ok ? r.json() : { results: [] }))
        .then((data: any) => ({ country, results: (data.results || []) as any[] }))
    )
  )

  const jobs: Job[] = []
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    const { country, results: countryJobs } = result.value
    const curr = currencyMap[country]
    const currCode = currencyCodeMap[country]

    for (const job of countryJobs) {
      if (!isSalesTitle(job.title || '')) continue

      const salaryStr = job.salary_min && job.salary_max
        ? `${curr}${Math.round(job.salary_min / 1000)}k – ${curr}${Math.round(job.salary_max / 1000)}k`
        : job.salary_min
          ? `${curr}${Math.round(job.salary_min / 1000)}k+`
          : null
      if (!salaryStr) continue

      jobs.push({
        id: `adzuna-${job.id}`,
        title: toTitleCase(job.title || ''),
        company: toTitleCase(job.company?.display_name || 'Unknown'),
        domain: extractDomain(job.company?.display_name || ''),
        location: toTitleCase(job.location?.display_name || 'Unknown'),
        job_type: 'On-site',
        sector: job.category?.label || 'Sales',
        seniority: 'Mid-Level',
        description: job.description || '',
        base_salary: salaryStr,
        ote: salaryStr,
        commission_structure: 'Commission structure available on application.',
        currency: currCode,
        application_url: job.redirect_url || '',
        contact_email: 'apply@partner.com',
        status: 'live',
        featured: false,
        created_at: job.created || new Date().toISOString(),
        is_partner: true,
        source_tag: 'Via Adzuna',
      })
    }
  }

  return jobs
}

async function fetchRemotiveJobs(): Promise<Job[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=sales')
    if (!res.ok) throw new Error('Remotive API down')
    const data = await res.json()

    return (data.jobs || [])
      .filter((job: any) => typeof job.salary === 'string' && job.salary.trim() !== '')
      .filter((job: any) => isSalesTitle(job.title || ''))
      .map((job: any) => ({
        id: `remotive-${job.id}`,
        title: toTitleCase(job.title || ''),
        company: toTitleCase(job.company_name || 'Unknown'),
        domain: extractDomain(job.company_name || ''),
        location: 'Remote (Global)',
        job_type: 'Remote',
        sector: 'Sales',
        seniority: 'Mid-Level',
        description: job.description || '',
        base_salary: job.salary,
        ote: job.salary,
        commission_structure: 'Commission structure available on application.',
        currency: 'USD',
        application_url: job.url || '',
        contact_email: 'apply@partner.com',
        status: 'live',
        featured: false,
        created_at: job.publication_date || new Date().toISOString(),
        is_partner: true,
        source_tag: 'Via Remotive',
      } as Job))
  } catch {
    console.warn('Remotive API unavailable')
    return []
  }
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

    const [arbeitnowJobs, adzunaJobs, remotiveJobs] = await Promise.all([
      fetchArbeitnowJobs(),
      fetchAdzunaJobs(),
      fetchRemotiveJobs(),
    ])

    const combined = [...SEED_JOBS, ...arbeitnowJobs, ...adzunaJobs, ...remotiveJobs]

    const uniqueById = new Map<string, Job>()
    combined.forEach(job => {
      if (!uniqueById.has(job.id)) uniqueById.set(job.id, job)
    })

    const uniqueByTitleCompany = new Map<string, Job>()
    uniqueById.forEach(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`
      if (!uniqueByTitleCompany.has(key)) {
        uniqueByTitleCompany.set(key, job)
      } else {
        // Keep whichever entry has real salary data
        const existing = uniqueByTitleCompany.get(key)!
        if (existing.base_salary === 'Salary Not Disclosed' && job.base_salary !== 'Salary Not Disclosed') {
          uniqueByTitleCompany.set(key, job)
        }
      }
    })

    const uniqueJobs = Array.from(uniqueByTitleCompany.values()) as Job[]

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: uniqueJobs,
      timestamp: Date.now()
    }))

    return uniqueJobs
  } catch (error) {
    console.error('Error in fetchPartnerJobs:', error)
    return SEED_JOBS
  }
}
