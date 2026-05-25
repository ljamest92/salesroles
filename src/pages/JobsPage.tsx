import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { 
  Button, 
  Container, 
  Input, 
  Card, 
  Badge, 
  Select, 
  SelectTrigger as UISelectTrigger, 
  SelectValue, 
  SelectContent as UISelectContent, 
  SelectItem as UISelectItem, 
  Skeleton,
  StatGroup,
  Stat,
  EmptyState,
  toast, Toaster
} from '@blinkdotnew/ui'
import { Search, MapPin, Briefcase, DollarSign, Filter, SlidersHorizontal, ArrowUpDown, Building2, TrendingUp, CheckCircle2, ShieldAlert, Share2 } from 'lucide-react'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { motion } from 'framer-motion'
import { ReportModal } from '../components/ReportModal'
import { blink } from '../lib/blink'

const SelectTrigger = UISelectTrigger as any;
const SelectContent = UISelectContent as any;
const SelectItem = UISelectItem as any;

export function JobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [stats, setStats] = useState({
    liveRoles: 0,
    avgOte: '$0'
  })
  const [reportingJobId, setReportingJobId] = useState<string | null>(null)

  const getFallbackLogo = (name: string) => {
    const letter = name.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${letter}&background=0D0D0D&color=10B981&size=128&font-size=0.5&bold=true`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const pJobs = await fetchPartnerJobs()
        const dbJobs = await blink.db.jobs.list({ where: { status: 'live' } }).catch(() => [])

        const mappedDbJobs: Job[] = dbJobs.map((job: any) => ({
          ...job,
          company: job.companyName || job.company,
          is_partner: false
        }));

        const allJobs = [...mappedDbJobs, ...pJobs];
        setJobs(allJobs)
        
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
        }, 0);
        const avgOte = allJobs.length > 0 ? `$${Math.round(totalOte / allJobs.length)}k` : '$0';
        
        setStats({
          liveRoles: allJobs.length,
          avgOte: avgOte
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading jobs:', error);
        setIsLoading(false)
      }
    };

    loadData();
  }, [])

  const filteredJobs = jobs.filter(job => 
    (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.sector.toLowerCase().includes(searchQuery.toLowerCase())) &&
    job.location.toLowerCase().includes(locationQuery.toLowerCase())
  )

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/jobs/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied', { description: 'The job URL is now in your clipboard.' })
  }

  return (
    <Container className="pt-20 pb-12 md:py-24 space-y-16 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">Find Your Next <span className="text-primary">Sales Role.</span></h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">Browse {stats.liveRoles} verified live sales roles with mandatory transparent compensation.</p>
        </div>
        
        <Card className="p-8 bg-card/50 border border-white/5 backdrop-blur-xl w-full md:w-auto min-w-[260px] shrink-0 shadow-2xl relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-full" />
          <StatGroup className="flex gap-12">
            <Stat label="Live Roles" value={stats.liveRoles.toString()} />
            <Stat label="Average OTE" value={stats.avgOte} />
          </StatGroup>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Filters Sidebar */}
        <aside className="lg:w-72 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-bold tracking-wider text-sm flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" /> Filters
            </h3>
            <Button variant="link" size="sm" className="text-primary text-xs p-0 h-auto">Clear All</Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Work Type</label>
              <div className="grid grid-cols-1 gap-2">
                {['Remote', 'Hybrid', 'On-site'].map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" className="rounded border-border bg-secondary text-primary focus:ring-primary" />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Seniority</label>
              <div className="grid grid-cols-1 gap-2">
                {['Entry Level', 'Mid-Level', 'Senior', 'Director', 'VP / Executive'].map(level => (
                  <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" className="rounded border-border bg-secondary text-primary focus:ring-primary" />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Sector</label>
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {['SaaS', 'FinTech', 'HealthTech', 'AdTech', 'Hardware', 'Cybersecurity', 'MarTech', 'E-commerce', 'Logistics', 'PropTech', 'EdTech', 'InsurTech', 'Recruitment', 'Consulting', 'Telecommunications', 'Financial Services', 'Retail', 'Manufacturing', 'Media', 'Professional Services'].map(sector => (
                  <label key={sector} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" className="rounded border-border bg-secondary text-primary focus:ring-primary" />
                    {sector}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Ote Range</label>
              <Select>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50k">$0 - $50k</SelectItem>
                  <SelectItem value="50-100k">$50k - $100k</SelectItem>
                  <SelectItem value="100-200k">$100k - $200k</SelectItem>
                  <SelectItem value="200k+">$200k+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Main Jobs List */}
        <div className="flex-1 space-y-10">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/30 p-2 rounded-3xl border border-white/5 backdrop-blur-xl shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, company..." 
                className="w-full bg-transparent border-none rounded-xl pl-14 pr-4 py-5 text-sm focus:outline-none transition-all font-medium"
              />
            </div>
            <div className="relative flex-1 w-full border-l border-white/5 pl-2 hidden md:block">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City or Remote..." 
                className="w-full bg-transparent border-none rounded-xl pl-14 pr-4 py-5 text-sm focus:outline-none transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-3 pr-4">
              <Select defaultValue="latest">
                <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-white/5 h-11 text-[11px] font-black tracking-widest rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/5">
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="highest_ote">Highest OTE</SelectItem>
                  <SelectItem value="most_relevant">Relevant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="p-10 border border-white/5 bg-card/30 animate-pulse h-48 rounded-3xl" />
              ))
            ) : filteredJobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState
                  icon={<Search size={40} />}
                  title="No Roles Found"
                  description="We couldn't find any listings matching your search. Try broadening your filters or different keywords."
                  action={{
                    label: "Reset Search",
                    onClick: () => { setSearchQuery(''); setLocationQuery(''); }
                  }}
                  className="p-32 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              </motion.div>
            ) : (
              filteredJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="job-card-hover p-10 border border-white/5 group relative overflow-hidden rounded-[32px]">
                    <div className="flex flex-col md:flex-row justify-between gap-10">
                      <div className="flex gap-8">
                        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-xl transition-all group-hover:scale-105 duration-500 overflow-hidden relative">
                           <img 
                             src={job.logo_url} 
                             alt={job.company} 
                             className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                             onError={(e) => {
                               e.currentTarget.src = getFallbackLogo(job.company);
                             }}
                           />
                           <Building2 size={40} className="absolute z-[-1]" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors leading-none">
                              <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                            </h3>
                            {i <= 1 && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[9px] tracking-widest">Featured</Badge>}
                            {job.is_partner && <Badge variant="outline" className="text-[9px] font-black text-muted-foreground/40 border-white/10 tracking-widest">Via Partner</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-6 text-muted-foreground font-bold text-[11px] tracking-[0.15em] pt-2">
                            <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-foreground hover:text-primary transition-colors">{job.company}</Link>
                            <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {job.location}</span>
                            <span className="flex items-center gap-2"><Briefcase size={16} className="text-primary" /> {job.sector}</span>
                          </div>
                          
                          <div className="flex gap-4 pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <button onClick={() => handleShare(job.id)} className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-muted-foreground hover:text-primary transition-colors">
                               <Share2 size={12} /> Share
                             </button>
                             <button onClick={() => setReportingJobId(job.id)} className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-muted-foreground hover:text-destructive transition-colors">
                               <ShieldAlert size={12} /> Report
                             </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-black tracking-[0.25em] mb-2 opacity-50">On-Target Earnings</p>
                          <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">{job.ote}</p>
                          <p className="text-[11px] text-primary font-black tracking-[0.2em] mt-2 underline underline-offset-4">Base Salary: {job.base_salary}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <div className="flex justify-center gap-2 pt-8">
            <Button variant="outline" disabled>Previous</Button>
            <Button variant="outline" className="bg-primary text-primary-foreground border-primary">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </div>
      
      <ReportModal 
        jobId={reportingJobId || ''} 
        isOpen={!!reportingJobId} 
        onOpenChange={(open) => !open && setReportingJobId(null)} 
      />
      <Toaster />
    </Container>
  )
}