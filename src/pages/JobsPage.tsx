import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Button,
  Container,
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
  toast
} from '@blinkdotnew/ui'
import { Search, MapPin, Briefcase, SlidersHorizontal, Building2, ShieldAlert, Share2 } from 'lucide-react'
import { type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'
import { motion } from 'framer-motion'
import { ReportModal } from '../components/ReportModal'

const SelectTrigger = UISelectTrigger as any
const SelectContent = UISelectContent as any
const SelectItem = UISelectItem as any

export function JobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [workTypeFilters, setWorkTypeFilters] = useState<string[]>([])
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([])
  const [sectorFilters, setSectorFilters] = useState<string[]>([])
  const [stats, setStats] = useState({ liveRoles: 0, avgOte: '$0' })
  const [reportingJobId, setReportingJobId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const [localRes, externalRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/jobs/external')
        ])

        const localData = localRes.ok ? await localRes.json() : { jobs: [] }
        const externalData = externalRes.ok ? await externalRes.json() : []

        const localJobs = (localData.jobs || localData || []).map((j: any) => ({
          ...j,
          company: j.companyName || j.company || '',
        }))

        const externalJobs = (Array.isArray(externalData) ? externalData : []).map((j: any) => ({
          ...j,
          company: j.company_name || j.company || '',
          job_type: j.work_type || j.job_type || 'Remote',
          application_url: j.apply_url || j.application_url || '',
          commission_structure: j.commission_structure || '',
          currency: j.currency || 'USD',
          contact_email: '',
          status: 'live',
          featured: false,
          sector: j.sector || 'Sales',
          seniority: j.seniority || 'Mid-Level',
          base_salary: j.base_salary || 'Salary Not Disclosed',
          ote: j.ote || 'Salary Not Disclosed',
        }))

        const allJobs = [...localJobs, ...externalJobs]
        const seen = new Set()
        const unique = allJobs.filter((job: any) => {
          if (seen.has(job.id)) return false
          seen.add(job.id)
          return true
        })

        setJobs(unique as Job[])

        const totalOte = unique.reduce((sum: number, job: any) => {
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

        setStats({
          liveRoles: unique.length,
          avgOte: unique.length > 0 ? `$${Math.round(totalOte / unique.length)}k` : '$0'
        })
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
        setIsLoading(false)
      }
    }
    fetchAllJobs()
  }, [])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const clearAll = () => {
    setSearchQuery('')
    setLocationQuery('')
    setWorkTypeFilters([])
    setSeniorityFilters([])
    setSectorFilters([])
  }

  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.sector.toLowerCase().includes(q)
    const matchesLocation = !locationQuery ||
      job.location.toLowerCase().includes(locationQuery.toLowerCase())
    const matchesWorkType = workTypeFilters.length === 0 || workTypeFilters.includes(job.job_type)
    const matchesSeniority = seniorityFilters.length === 0 || seniorityFilters.includes(job.seniority)
    const matchesSector = sectorFilters.length === 0 || sectorFilters.includes(job.sector)
    return matchesSearch && matchesLocation && matchesWorkType && matchesSeniority && matchesSector
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'highest_ote') {
      const oteA = typeof a.ote === 'number' ? a.ote : parseInt(String(a.ote || '0').replace(/\D/g, '')) || 0
      const oteB = typeof b.ote === 'number' ? b.ote : parseInt(String(b.ote || '0').replace(/\D/g, '')) || 0
      return oteB - oteA
    }
    if (sortBy === 'most_relevant') {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${id}`)
    toast.success('Link copied', { description: 'The job URL is now in your clipboard.' })
  }

  const activeFilterCount = workTypeFilters.length + seniorityFilters.length + sectorFilters.length

  return (
    <Container className="pt-20 pb-12 md:py-24 space-y-16 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
            Find Your Next <span className="text-primary">Sales Role.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
            Browse {stats.liveRoles} verified live sales roles with mandatory transparent compensation.
          </p>
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
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-2 py-0.5">{activeFilterCount}</span>
              )}
            </h3>
            <Button variant="link" size="sm" className="text-primary text-xs p-0 h-auto" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Work Type</label>
              <div className="grid grid-cols-1 gap-2">
                {['Remote', 'Hybrid', 'On-site'].map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={workTypeFilters.includes(type)}
                      onChange={() => setWorkTypeFilters(prev => toggle(prev, type))}
                      className="rounded border-border bg-secondary text-primary focus:ring-primary"
                    />
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
                    <input
                      type="checkbox"
                      checked={seniorityFilters.includes(level)}
                      onChange={() => setSeniorityFilters(prev => toggle(prev, level))}
                      className="rounded border-border bg-secondary text-primary focus:ring-primary"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Sector</label>
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {['Sales', 'SaaS', 'FinTech', 'HealthTech', 'AdTech', 'Hardware', 'Cybersecurity', 'MarTech', 'E-commerce', 'Logistics', 'PropTech', 'EdTech', 'InsurTech', 'Recruitment', 'Consulting', 'Telecommunications', 'Financial Services', 'Retail', 'Manufacturing', 'Media', 'Professional Services'].map(sector => (
                  <label key={sector} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={sectorFilters.includes(sector)}
                      onChange={() => setSectorFilters(prev => toggle(prev, sector))}
                      className="rounded border-border bg-secondary text-primary focus:ring-primary"
                    />
                    {sector}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">OTE Range</label>
              <Select>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50k">$0 – $50k</SelectItem>
                  <SelectItem value="50-100k">$50k – $100k</SelectItem>
                  <SelectItem value="100-200k">$100k – $200k</SelectItem>
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
              <Select value={sortBy} onValueChange={setSortBy}>
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
                  action={{ label: 'Reset Filters', onClick: clearAll }}
                  className="p-32 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              </motion.div>
            ) : (
              sortedJobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <Card className="job-card-hover p-10 border border-white/5 group relative overflow-hidden rounded-[32px]">
                      <div className="flex flex-col md:flex-row justify-between gap-10">
                        <div className="flex gap-8">
                          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-xl transition-all group-hover:scale-105 duration-500 overflow-hidden relative">
                            <CompanyLogo domain={getDomain(job.company_website || job.domain, job.company)} name={job.company} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors leading-none">
                                <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                              </h3>
                              {job.featured && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[9px] tracking-widest">Featured</Badge>}
                              {job.is_partner && <Badge variant="outline" className="text-[9px] font-black text-muted-foreground/40 border-white/10 tracking-widest">Via Partner</Badge>}
                              {job.via_partner && (
                                <span className="text-xs border border-emerald-500/30 text-emerald-400/70 px-2 py-0.5 rounded-full">
                                  Via Partner
                                </span>
                              )}
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
                            {(job.via_partner || job.is_partner) && (!job.ote || job.ote === 'Salary Not Disclosed') ? (
                              <span className="text-white/40 text-sm">Salary not disclosed</span>
                            ) : (
                              <>
                                <p className="text-[10px] text-muted-foreground font-black tracking-[0.25em] mb-2 opacity-50">On-Target Earnings</p>
                                <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">{job.ote}</p>
                                {job.base_salary && job.base_salary !== 'Salary Not Disclosed' && (
                                  <p className="text-[11px] text-primary font-black tracking-[0.2em] mt-2 underline underline-offset-4">Base: {job.base_salary}</p>
                                )}
                              </>
                            )}
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
    </Container>
  )
}
