import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from '@tanstack/react-router'
import { Button, Card, Badge, Container } from '@blinkdotnew/ui'
import { Briefcase, DollarSign, TrendingUp, Quote, Star, MapPin } from 'lucide-react'
import { fetchPartnerJobs, type Job, SEED_COMPANY_DOMAINS } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { motion } from 'framer-motion'
import { getDomain } from '../utils/getDomain'
import AnimatedCounter from '../components/AnimatedCounter'

// Verified domains for well-known companies — used to resolve partner job company logos
const KNOWN_DOMAINS: Record<string, string> = {
  ...SEED_COMPANY_DOMAINS,
  okta: 'okta.com',
  datadog: 'datadoghq.com',
  outreach: 'outreach.io',
  salesloft: 'salesloft.com',
  'apollo.io': 'apollo.io',
  apollo: 'apollo.io',
  monday: 'monday.com',
  'monday.com': 'monday.com',
}

const FALLBACK_COMPANIES = [
  { name: 'Salesforce', domain: 'salesforce.com', count: 3 },
  { name: 'HubSpot',    domain: 'hubspot.com',    count: 2 },
  { name: 'Gong',       domain: 'gong.io',        count: 2 },
  { name: 'Okta',       domain: 'okta.com',       count: 1 },
  { name: 'Datadog',    domain: 'datadoghq.com',  count: 1 },
  { name: 'Snowflake',  domain: 'snowflake.com',  count: 1 },
]

const marqueeCompanies = [
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Gong', domain: 'gong.io' },
  { name: 'Vercel', domain: 'vercel.com' },
  { name: 'Linear', domain: 'linear.app' },
  { name: 'Workday', domain: 'workday.com' },
  { name: 'Zendesk', domain: 'zendesk.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Figma', domain: 'figma.com' },
]

const testimonials = [
  {
    quote: "The only job board where I actually know what I'm going to make before the first interview. A total game changer for sales pros.",
    name: "Alex Rivera",
    title: "Enterprise AE at Vercel",
    initials: "AR"
  },
  {
    quote: "We found our top three SDRs through SalesRoles.co. The quality of candidates here is significantly higher than LinkedIn.",
    name: "Sarah Chen",
    title: "VP Sales at Gong",
    initials: "SC"
  },
  {
    quote: "Finally a job board that respects sales professionals enough to show the full comp package upfront. I won't use anything else.",
    name: "Marcus Williams",
    title: "Regional Sales Manager at HubSpot",
    initials: "MW"
  }
]

export function HomePage() {
  const [partnerJobs, setPartnerJobs] = useState<Job[]>([])
  const [topCompanies, setTopCompanies] = useState<{name: string, count: number, domain: string | null}[]>([])
  const [stats, setStats] = useState({ liveRoles: 0, companies: 0, avgOteNum: 0 })
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    const loadData = async () => {
      try {
        const pJobs = await fetchPartnerJobs()
        let dbJobs: Job[] = []
        try {
          const res = await fetch('/api/jobs?status=live')
          if (res.ok) {
            const data = await res.json()
            dbJobs = (data.jobs || []).map((j: any) => ({
              ...j,
              company: j.companyName || j.company,
              is_partner: false
            }))
          }
        } catch {}

        const mappedDbJobs: Job[] = dbJobs.map((job: any) => ({
          ...job,
          company: job.companyName || job.company,
          is_partner: false
        }))

        const allJobs = [...mappedDbJobs, ...pJobs]
        setPartnerJobs(allJobs.slice(0, 5))

        const statsCompanyMap = new Map<string, number>()
        allJobs.forEach(j => {
          statsCompanyMap.set(j.company, (statsCompanyMap.get(j.company) || 0) + 1)
        })

        const totalOte = allJobs.reduce((sum, job) => {
          const oteStr = String(job.ote || '')
          if (!oteStr || oteStr === 'Salary Not Disclosed') return sum
          const match = oteStr.match(/(\d[\d,]*)\s*k/i)
          if (match) {
            const val = parseFloat(match[1].replace(/,/g, ''))
            return isNaN(val) ? sum : sum + val
          }
          const rawMatch = oteStr.match(/(\d[\d,]+)/)
          if (rawMatch) {
            const val = parseFloat(rawMatch[1].replace(/,/g, ''))
            if (!isNaN(val) && val > 500) return sum + Math.round(val / 1000)
            if (!isNaN(val)) return sum + val
          }
          return sum
        }, 0)
        console.log(`[HomePage] Live roles fetched: ${allJobs.length}`)

        setStats({
          liveRoles: allJobs.length,
          companies: statsCompanyMap.size,
          avgOteNum: allJobs.length > 0 ? Math.round(totalOte / allJobs.length) : 0
        })

        // Build top companies from live jobs; use KNOWN_DOMAINS to get correct logo domains
        const seedMap = new Map<string, { count: number; domain: string | null }>()
        allJobs.forEach(j => {
          const existing = seedMap.get(j.company)
          const slug = j.company.toLowerCase().replace(/[^\w\s]/gi, '').trim().split(/\s+/)[0]
          const knownDomain = KNOWN_DOMAINS[slug] || KNOWN_DOMAINS[j.company.toLowerCase()] || null
          const domain = j.domain || knownDomain
          if (existing) {
            seedMap.set(j.company, { count: existing.count + 1, domain: existing.domain || domain })
          } else {
            seedMap.set(j.company, { count: 1, domain })
          }
        })
        const fromJobs = Array.from(seedMap.entries())
          .map(([name, { count, domain }]) => ({ name, count, domain }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
        setTopCompanies(fromJobs.length > 0 ? fromJobs : FALLBACK_COMPANIES)
      } catch (error) {
        console.error('Error loading homepage data:', error)
      }
    }
    loadData()
  }, [])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscribeEmail) return
    setSubscribeStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      })
      const data = await res.json()
      if (data.ok) {
        setSubscribeStatus('success')
        setSubscribeEmail('')
      } else {
        setSubscribeStatus('error')
      }
    } catch {
      setSubscribeStatus('error')
    }
  }

  return (
    <div className="flex flex-col page-transition overflow-x-hidden">
      <Helmet>
        <title>SalesRoles.co | Sales Jobs With Full Salary & OTE Transparency</title>
        <meta name="description" content="The only job board built exclusively for sales professionals. 118 live roles with base salary, OTE, and commission shown upfront. Account Executive, SDR, BDR, and sales management roles in the US, UK, and Australia." />
        <meta property="og:title" content="SalesRoles.co | Sales Jobs With Full Salary & OTE Transparency" />
        <meta property="og:description" content="Browse 100+ sales jobs that show base salary, OTE, and commission upfront. Every role. Every time." />
        <meta property="og:url" content="https://salesroles.co" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://salesroles.co/logo.svg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="SalesRoles.co | Sales Jobs With Full Salary & OTE Transparency" />
        <meta name="twitter:description" content="Browse 100+ sales jobs that show base salary, OTE, and commission upfront. Every role. Every time." />
        <meta name="twitter:image" content="https://salesroles.co/logo.svg" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative pt-8 pb-24 md:pt-16 md:pb-48 hero-glow overflow-hidden">
        {/* Radial glow orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-[1]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.30) 0%, rgba(16,185,129,0.10) 45%, transparent 70%)', filter: 'blur(80px)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-[1]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.30) 0%, rgba(16,185,129,0.10) 45%, transparent 70%)', filter: 'blur(80px)' }} />
        <Container className="text-center space-y-10 md:space-y-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-6 md:space-y-8"
          >
            <Badge variant="outline" className="px-6 py-2 text-primary border-primary/20 bg-primary/5 tracking-tight text-[10px] font-black shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              Premium Job Board for Sales Professionals
            </Badge>
            <h1 className="text-4xl sm:text-7xl md:text-[100px] font-black tracking-tighter leading-[0.95] max-w-5xl mx-auto">
              We Only Do <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Sales.</span><br />
              With Full <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Transparency.</span>
            </h1>
            <p className="text-lg md:text-3xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
              Find global remote and on-site sales roles with mandatory compensation transparency.
              No more guessing base, OTE, or commission.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/jobs">
              <Button size="lg" className="bg-primary text-primary-foreground font-black px-12 tracking-widest text-[11px] h-16 rounded-2xl cta-glow w-full sm:w-auto">
                Find My Next Role
              </Button>
            </Link>
            <Link to="/post-job">
              <Button size="lg" variant="outline" className="font-black px-12 tracking-widest text-[11px] h-16 rounded-2xl border-white/10 hover:bg-white/5 w-full sm:w-auto">
                Post a Job
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-4"
          >
            <span>Popular:</span>
            <Link to="/jobs" search={{ q: 'Account Executive' } as any} className="hover:text-primary">Account Executive</Link>
            <Link to="/jobs" search={{ q: 'SDR' } as any} className="hover:text-primary">SDR</Link>
            <Link to="/jobs" search={{ q: 'Business Development' } as any} className="hover:text-primary">Business Development</Link>
            <Link to="/remote-sales-jobs" className="hover:text-primary">Remote</Link>
          </motion.div>
        </Container>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-y border-border py-8 md:py-12">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/50 border border-border text-center">
              <Briefcase className="text-primary mb-3" size={28} />
              <p className="text-4xl font-black tracking-tighter"><AnimatedCounter target={stats.liveRoles} /></p>
              <p className="text-sm text-muted-foreground font-bold mt-1">Live Roles</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/50 border border-border text-center">
              <TrendingUp className="text-primary mb-3" size={28} />
              <p className="text-4xl font-black tracking-tighter"><AnimatedCounter target={stats.companies} /></p>
              <p className="text-sm text-muted-foreground font-bold mt-1">Companies Hiring</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/50 border border-border text-center">
              <DollarSign className="text-primary mb-3" size={28} />
              <p className="text-4xl font-black tracking-tighter"><AnimatedCounter target={stats.avgOteNum} prefix="$" suffix="k" /></p>
              <p className="text-sm text-muted-foreground font-bold mt-1">Average OTE</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Latest Openings */}
      <section className="py-20 md:py-32 bg-background relative overflow-hidden">
        {/* Orbit streaks — travel the section perimeter */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {[0, 2.33, 4.67].map((begin) => (
            <g key={begin}>
              {/* Tail layers — stacked lines widening toward the head */}
              <line x1="-40" y1="0" x2="0" y2="0" stroke="white" strokeWidth="1" strokeOpacity="0.10" strokeLinecap="round">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </line>
              <line x1="-28" y1="0" x2="0" y2="0" stroke="white" strokeWidth="1.3" strokeOpacity="0.25" strokeLinecap="round">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </line>
              <line x1="-16" y1="0" x2="0" y2="0" stroke="white" strokeWidth="1.7" strokeOpacity="0.50" strokeLinecap="round">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </line>
              <line x1="-6" y1="0" x2="0" y2="0" stroke="white" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </line>
              {/* White head dot */}
              <circle cx="0" cy="0" r="2" fill="white" fillOpacity="0.9">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </circle>
              {/* Emerald glow dot */}
              <circle cx="0" cy="0" r="3" fill="none" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.7">
                <animateMotion dur="7s" begin={`${begin}s`} repeatCount="indefinite" rotate="auto"
                  path="M 8,1 L 992,1 Q 999,1 999,8 L 999,692 Q 999,699 992,699 L 8,699 Q 1,699 1,692 L 1,8 Q 1,1 8,1 Z" />
              </circle>
            </g>
          ))}
        </svg>
        <Container className="space-y-16 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Latest Openings</h2>
              <p className="text-muted-foreground text-lg">Premium opportunities from top-tier sales teams.</p>
            </div>
            <Link to="/jobs">
              <Button variant="ghost" className="text-primary hover:text-primary/80 font-bold group">
                View All Jobs <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
              </Button>
            </Link>
          </div>

          <div className="grid gap-6">
            {partnerJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/jobs/${job.id}`} className="block hover:opacity-90 transition-opacity cursor-pointer">
                  <Card className="job-card-hover p-6 md:p-8 border border-white/5 group relative overflow-hidden w-full">
                    <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8">
                      <div className="flex gap-4 md:gap-6 min-w-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/50 overflow-hidden relative">
                          <CompanyLogo domain={job.domain || getDomain(job.company_website || '')} name={job.company} uploadedLogoUrl={job.company_logo_url} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                            {job.featured && <Badge className="bg-primary/20 text-primary border-primary/20 shrink-0">Featured</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-3 md:gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-bold text-foreground"><Briefcase size={14} /> {job.company}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                        <div className="text-left md:text-right">
                          <p className="text-sm text-muted-foreground tracking-wider font-bold">OTE Range</p>
                          <p className="text-xl md:text-2xl font-black text-foreground">{job.ote}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Trusted Companies Marquee */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border">
        <Container className="text-center space-y-10">
          <h2 className="text-sm font-bold tracking-[0.1em] text-muted-foreground">Trusted by the best sales teams</h2>
          <div className="overflow-hidden relative">
            <div className="marquee-track">
              {[...marqueeCompanies, ...marqueeCompanies].map((company, i) => (
                <div key={i} className="flex items-center gap-3 mx-10 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border border-white/10">
                    <CompanyLogo domain={company.domain} name={company.name} />
                  </div>
                  <span className="text-lg font-black tracking-tight text-white">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Subscribe — FIX 6 */}
      <section className="py-16 md:py-24 bg-background border-b border-border">
        <Container className="max-w-2xl text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Get Weekly Job Alerts</h2>
            <p className="text-muted-foreground font-medium">New roles every Monday morning. Full OTE, no noise. Unsubscribe anytime.</p>
          </div>
          {subscribeStatus === 'success' ? (
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
              <p className="text-primary font-bold">You're subscribed. See you Monday.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={subscribeEmail}
                onChange={e => setSubscribeEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-card border border-border rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
              />
              <Button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="bg-primary text-primary-foreground font-black px-8 h-14 cta-glow whitespace-nowrap"
              >
                {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
              </Button>
            </form>
          )}
          {subscribeStatus === 'error' && (
            <p className="text-destructive text-sm font-medium">Something went wrong. Please try again.</p>
          )}
        </Container>
      </section>

      {/* Companies to Watch */}
      <section className="py-20 md:py-32 bg-background relative overflow-hidden">
        {/* Aurora falling light columns */}
        <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden pointer-events-none" aria-hidden="true">
          <span className="sr-aurora-bar" style={{ left: '7%',  width: 2, animationDuration: '2.2s',  animationDelay: '0s' }} />
          <span className="sr-aurora-bar" style={{ left: '18%', width: 3, animationDuration: '1.8s',  animationDelay: '0.35s' }} />
          <span className="sr-aurora-bar" style={{ left: '31%', width: 2, animationDuration: '2.6s',  animationDelay: '0.75s' }} />
          <span className="sr-aurora-bar" style={{ left: '44%', width: 3, animationDuration: '1.55s', animationDelay: '1.2s' }} />
          <span className="sr-aurora-bar" style={{ left: '57%', width: 2, animationDuration: '2.9s',  animationDelay: '0.5s' }} />
          <span className="sr-aurora-bar" style={{ left: '71%', width: 3, animationDuration: '2.1s',  animationDelay: '0.95s' }} />
          <span className="sr-aurora-bar" style={{ left: '84%', width: 2, animationDuration: '1.9s',  animationDelay: '1.55s' }} />
          <span className="sr-aurora-dot" style={{ left: '13%', animationDuration: '1.7s',  animationDelay: '0.2s' }} />
          <span className="sr-aurora-dot" style={{ left: '39%', animationDuration: '2.4s',  animationDelay: '0.85s' }} />
          <span className="sr-aurora-dot" style={{ left: '63%', animationDuration: '1.5s',  animationDelay: '1.1s' }} />
          <span className="sr-aurora-dot" style={{ left: '80%', animationDuration: '2.2s',  animationDelay: '0.4s' }} />
        </div>
        <Container className="space-y-16 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Companies to Watch</h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed">High-growth teams hiring aggressively this month.</p>
          </div>

          {topCompanies.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
              <Card className="p-16 text-center border-dashed border-white/10 bg-card/10 rounded-[40px]">
                <p className="text-muted-foreground font-medium text-lg">Hiring data is being benchmarked. Check back soon.</p>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {topCompanies.map((company, i) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/company/${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="group">
                    <div className="bg-card p-10 rounded-[32px] border border-white/5 text-center space-y-6 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_rgba(16,185,129,0.12)] relative overflow-hidden h-full">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                      <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground border border-white/5 group-hover:border-primary/30 transition-all duration-500 group-hover:scale-110 shadow-xl overflow-hidden relative">
                        <CompanyLogo domain={company.domain} name={company.name} />
                      </div>
                      <div>
                        <h3 className="font-black group-hover:text-primary transition-colors text-xl tracking-tight leading-none">{company.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.1em] mt-4 opacity-50">{company.count} Active Roles</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-card/20 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <Container className="space-y-20 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">The standard for <span className="text-primary underline underline-offset-[12px] decoration-primary/30">modern</span> sales hiring.</h2>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl mx-auto leading-relaxed">Trusted by thousands of professionals and high-growth companies worldwide.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Card className="p-10 border border-white/5 bg-card/50 backdrop-blur-xl h-full flex flex-col justify-between rounded-[32px] hover:border-primary/30 transition-all duration-500 group">
                  <div className="space-y-6">
                    <div className="flex gap-1 text-primary">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <Quote className="text-primary w-10 h-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-lg leading-relaxed text-foreground font-medium">"{t.quote}"</p>
                  </div>
                  <div className="pt-8 mt-8 border-t border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-black tracking-widest text-[11px] text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-widest mt-0.5">{t.title}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}
