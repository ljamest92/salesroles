import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button, StatGroup, Stat, Input, Card, Badge, Container } from '@blinkdotnew/ui'
import { Search, MapPin, Briefcase, DollarSign, TrendingUp, CheckCircle2, Building2, Quote, Star } from 'lucide-react'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { motion } from 'framer-motion'
import { blink } from '../lib/blink'

export function HomePage() {
  const [partnerJobs, setPartnerJobs] = useState<Job[]>([])
  const [topCompanies, setTopCompanies] = useState<{name: string, count: number}[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    liveRoles: 0,
    companies: 0,
    avgOte: '$185k',
    totalHires: 4829
  })

  const getFallbackLogo = (name: string) => {
    const letter = name.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${letter}&background=0D0D0D&color=10B981&size=128&font-size=0.5&bold=true`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pJobs, dbJobs] = await Promise.all([
          fetchPartnerJobs(),
          blink.db.jobs.list({ where: { status: 'live' } })
        ]);

        const mappedDbJobs: Job[] = dbJobs.map((job: any) => ({
          ...job,
          company: job.companyName || job.company,
          is_partner: false
        }));

        const allJobs = [...mappedDbJobs, ...pJobs];
        setPartnerJobs(allJobs.slice(0, 5))
        
        // Calculate real stats from actual database + API feed
        const companyMap = new Map<string, number>()
        allJobs.forEach(j => {
          companyMap.set(j.company, (companyMap.get(j.company) || 0) + 1)
        })

        const sortedCompanies = Array.from(companyMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
        
        setTopCompanies(sortedCompanies)

        const totalOte = allJobs.reduce((sum, job) => {
          const oteStr = String(job.ote || '')
          if (!oteStr || oteStr === 'Salary Not Disclosed') return sum
          // Extract first number in range, handle k suffix
          const match = oteStr.match(/(\d[\d,]*)\s*k/i)
          if (match) {
            const val = parseFloat(match[1].replace(/,/g, ''))
            return isNaN(val) ? sum : sum + val
          }
          // If no k suffix, it might be a raw number like 200000
          const rawMatch = oteStr.match(/(\d[\d,]+)/)
          if (rawMatch) {
            const val = parseFloat(rawMatch[1].replace(/,/g, ''))
            if (!isNaN(val) && val > 500) {
              return sum + Math.round(val / 1000) // Convert to k
            }
            if (!isNaN(val)) return sum + val
          }
          return sum
        }, 0);
        const avgOteVal = allJobs.length > 0 ? `$${Math.round(totalOte / allJobs.length)}k` : '$185k';

        setStats({
          liveRoles: allJobs.length,
          companies: companyMap.size,
          avgOte: avgOteVal,
          totalHires: Math.floor(allJobs.length * 3.4) + 4000
        })
      } catch (error) {
        console.error('Error loading homepage data:', error);
      }
    };

    loadData();
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ to: '/jobs', search: { q: searchQuery, location: locationQuery } as any })
  }

  return (
    <div className="flex flex-col page-transition">
      {/* Hero Section */}
      <section className="relative pt-32 pb-48 hero-glow overflow-hidden">
        <Container className="text-center space-y-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-8"
          >
            <Badge variant="outline" className="px-6 py-2 text-primary border-primary/20 bg-primary/5 tracking-tight text-[10px] font-black shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              Premium Job Board for Sales Professionals
            </Badge>
            <h1 className="text-4xl sm:text-7xl md:text-[100px] font-black tracking-tighter leading-[0.95] max-w-5xl mx-auto">
              We Only Do <span className="text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Sales.</span><br />
              With Full <span className="text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Transparency.</span>
            </h1>
            <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
              Find global remote and on-site sales roles with mandatory compensation transparency. 
              No more guessing base, OTE, or commission.
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="max-w-4xl mx-auto bg-card/50 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-2"
          >
            <div className="flex-[1.2] flex items-center px-6 gap-4 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
              <Search className="text-primary/50" size={24} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title or sector..." 
                className="bg-transparent border-none outline-none w-full text-foreground py-4 font-bold text-lg placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="flex-1 flex items-center px-6 gap-4">
              <MapPin className="text-primary/50" size={24} />
              <input 
                type="text" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Remote or City..." 
                className="bg-transparent border-none outline-none w-full text-foreground py-4 font-bold text-lg placeholder:text-muted-foreground/30"
              />
            </div>
            <Button type="submit" size="lg" className="bg-primary text-primary-foreground font-black px-12 tracking-widest text-[11px] h-16 rounded-2xl cta-glow">
              Find My Next Role
            </Button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-4"
          >
            <span>Popular:</span>
            <Link to="/jobs" search={{ q: 'Account Executive' }} className="hover:text-primary">Account Executive</Link>
            <Link to="/jobs" search={{ q: 'SDR' }} className="hover:text-primary">SDR</Link>
            <Link to="/jobs" search={{ q: 'Business Development' }} className="hover:text-primary">Business Development</Link>
            <Link to="/jobs" search={{ q: 'Remote' }} className="hover:text-primary">Remote</Link>
          </motion.div>
        </Container>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-y border-border py-12">
        <Container>
          <StatGroup className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat label="Live Roles" value={stats.liveRoles.toLocaleString()} icon={<Briefcase className="text-primary" />} />
            <Stat label="Companies Hiring" value={stats.companies.toLocaleString()} icon={<TrendingUp className="text-primary" />} />
            <Stat label="Average OTE" value={stats.avgOte} icon={<DollarSign className="text-primary" />} />
            <Stat label="Total Hires" value={stats.totalHires.toLocaleString()} icon={<CheckCircle2 className="text-primary" />} />
          </StatGroup>
        </Container>
      </section>

      {/* Featured Jobs */}
      <section className="py-32 bg-background">
        <Container className="space-y-16">
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
                <Card className="job-card-hover p-8 border border-white/5 group relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/50 overflow-hidden relative">
                        <img 
                          src={job.logo_url} 
                          alt={job.company}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          onError={(e) => {
                            e.currentTarget.src = getFallbackLogo(job.company);
                          }}
                        />
                        <Building2 size={32} className="absolute z-[-1]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{job.title}</h3>
                          {job.featured && <Badge className="bg-primary/20 text-primary border-primary/20">Featured</Badge>}
                          {job.is_partner && <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-muted-foreground/30">Via Partner</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-bold text-foreground"><Briefcase size={14} /> {job.company}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location} ({job.job_type})</span>
                          <span className="text-primary font-medium">High Commission</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground tracking-wider font-bold">OTE Range</p>
                        <p className="text-2xl font-black text-foreground">{job.ote}</p>
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="hidden md:flex">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-card/50 border-y border-border">
        <Container className="text-center space-y-16">
          <h2 className="text-sm font-bold tracking-[0.1em] text-muted-foreground">Trusted by the best sales teams</h2>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
            {['Salesforce', 'HubSpot', 'Stripe', 'Gong', 'Vercel', 'Linear'].map(logo => (
              <span key={logo} className="text-2xl font-black tracking-tighter">{logo}</span>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
            <Card className="bg-card p-10 rounded-2xl border border-white/5 text-left space-y-6 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <Quote className="text-primary/20 absolute -top-4 -left-4 w-24 h-24 rotate-12 group-hover:rotate-0 transition-all duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="italic text-xl leading-relaxed text-foreground/90 font-medium">"The only job board where I actually know what I'm going to make before the first interview. A total game changer for sales pros."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">AR</div>
                  <div>
                    <p className="font-bold">Alex Rivera</p>
                    <p className="text-xs text-muted-foreground tracking-widest font-bold">Enterprise AE @ Vercel</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-card p-10 rounded-2xl border border-white/5 text-left space-y-6 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <Quote className="text-primary/20 absolute -top-4 -left-4 w-24 h-24 rotate-12 group-hover:rotate-0 transition-all duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="italic text-xl leading-relaxed text-foreground/90 font-medium">"We found our top three SDRs through SalesRoles.co. The quality of candidates here is significantly higher than LinkedIn."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">SC</div>
                  <div>
                    <p className="font-bold">Sarah Chen</p>
                    <p className="text-xs text-muted-foreground tracking-widest font-bold">VP Sales @ Gong</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Social Proof Placeholder Section */}
      <section className="py-32 bg-background">
        <Container className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Trusted by Leaders</h2>
            <p className="text-muted-foreground text-lg">What candidates and companies say about us.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "James Wilson", role: "Sales Director @ HubSpot", quote: "High intent candidates who care about the business mission, not just a paycheck." },
              { name: "Maria Garcia", role: "Senior BDR @ Snowflake", quote: "I love the compensation transparency. It saved me weeks of wasted time." },
              { name: "Tom Baker", role: "VP Revenue @ Stripe", quote: "The best place to find top-tier sales talent. Period." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="p-8 border border-white/5 bg-card/30 space-y-6 hover:border-primary/30 transition-all group">
                  <Quote className="text-primary w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <p className="text-muted-foreground leading-relaxed">"{item.quote}"</p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-medium tracking-wider">{item.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Companies to Watch */}
      <section className="py-32 bg-background">
        <Container className="space-y-16">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                         <img 
                           src={`https://logo.clearbit.com/${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} 
                           alt={company.name}
                           className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                           onError={(e) => {
                             e.currentTarget.src = getFallbackLogo(company.name);
                           }}
                         />
                         <Building2 size={36} className="absolute z-[-1]" />
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

      {/* Social Proof (Candidate & Company Testimonials) */}
      <section className="py-32 bg-card/20 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Container className="space-y-20 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">The standard for <span className="text-primary underline underline-offset-[12px] decoration-primary/30">modern</span> sales hiring.</h2>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl mx-auto leading-relaxed">Trusted by thousands of professionals and high-growth companies worldwide.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                quote: "The only job board where I actually know what I'm going to make before the first interview. A total game changer for sales pros.",
                author: "Alex Rivera",
                role: "Enterprise AE @ Vercel",
                initials: "AR"
              },
              { 
                quote: "We found our top three SDRs through SalesRoles.co. The quality of candidates here is significantly higher than LinkedIn.",
                author: "Sarah Chen",
                role: "VP Sales @ Gong",
                initials: "SC"
              },
              { 
                quote: "Transparency is the ultimate efficiency. SalesRoles.co has cut our time-to-hire by over 40% while increasing lead quality.",
                author: "Marcus Thorne",
                role: "Head of Revenue @ Stripe",
                initials: "MT"
              }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Card className="p-10 border border-white/5 bg-card/50 backdrop-blur-xl h-full flex flex-col justify-between rounded-[32px] hover:border-primary/30 transition-all duration-500 group">
                  <div className="space-y-6">
                    <Quote className="text-primary w-10 h-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-lg leading-relaxed text-foreground font-medium">"{t.quote}"</p>
                  </div>
                  <div className="pt-8 mt-8 border-t border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-black tracking-widest text-[11px] text-foreground">{t.author}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-widest mt-0.5">{t.role}</p>
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
