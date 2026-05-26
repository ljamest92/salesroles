import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Button, Container, Card, Badge,
  Select, SelectTrigger as UISelectTrigger, SelectValue,
  SelectContent as UISelectContent, SelectItem as UISelectItem,
  Skeleton, EmptyState
} from '@blinkdotnew/ui'
import { Search, MapPin, Briefcase, SlidersHorizontal } from 'lucide-react'
import { type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'
import { motion } from 'framer-motion'

const SelectTrigger = UISelectTrigger as any
const SelectContent = UISelectContent as any
const SelectItem = UISelectItem as any

export function RemoteSalesJobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([])
  const [sectorFilters, setSectorFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('latest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [localRes, externalRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/jobs/external')
        ])
        const localData = localRes.ok ? await localRes.json() : { jobs: [] }
        const externalData = externalRes.ok ? await externalRes.json() : []

        const localJobs = (localData.jobs || []).map((j: any) => ({
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

        // Pre-filter to Remote only
        const remoteJobs = unique.filter((j: any) =>
          (j.job_type || '').toLowerCase().includes('remote') ||
          (j.location || '').toLowerCase().includes('remote')
        )

        setJobs(remoteJobs as Job[])
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const clearAll = () => {
    setSearchQuery('')
    setSeniorityFilters([])
    setSectorFilters([])
  }

  const filtered = jobs.filter(job => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.sector.toLowerCase().includes(q)
    const matchesSeniority = seniorityFilters.length === 0 || seniorityFilters.includes(job.seniority)
    const matchesSector = sectorFilters.length === 0 || sectorFilters.includes(job.sector)
    return matchesSearch && matchesSeniority && matchesSector
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'highest_ote') {
      const oteA = parseInt(String(a.ote || '0').replace(/\D/g, '')) || 0
      const oteB = parseInt(String(b.ote || '0').replace(/\D/g, '')) || 0
      return oteB - oteA
    }
    if (sortBy === 'most_relevant') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  const activeFilterCount = seniorityFilters.length + sectorFilters.length

  const validOTEJobs = jobs.filter(j => j.ote && j.ote !== 'Salary Not Disclosed')
  const avgOTE = validOTEJobs.length > 0
    ? Math.round(validOTEJobs.reduce((sum, j) => {
        const ote = typeof j.ote === 'number' ? j.ote : parseInt(String(j.ote || '0').replace(/\D/g, '')) || 0
        return sum + ote
      }, 0) / validOTEJobs.length / 1000)
    : 0

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12 animate-fade-in overflow-x-hidden">
      <div className="space-y-4">
        <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 text-[10px] font-black">Remote Only</Badge>
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
          Remote <span className="text-primary">Sales Jobs.</span>
        </h1>
        {!isLoading && (
          <div className="flex gap-4 mt-6 justify-center">
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl font-bold text-white">{jobs.length}</div>
              <div className="text-white/50 text-sm">Remote Roles</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{avgOTE > 0 ? `$${avgOTE}k` : '—'}</div>
              <div className="text-white/50 text-sm">Average OTE</div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter toggle */}
      <div className="flex lg:hidden">
        <Button variant="outline" size="sm" className="gap-2 font-bold" onClick={() => setShowFilters(v => !v)}>
          <SlidersHorizontal size={16} className="text-primary" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-2 py-0.5 ml-1">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Sidebar */}
        <aside className={`lg:w-72 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold tracking-wider text-sm flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" /> Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-2 py-0.5">{activeFilterCount}</span>
              )}
            </h3>
            <Button variant="link" size="sm" className="text-primary text-xs p-0 h-auto" onClick={clearAll}>Clear All</Button>
          </div>

          <div className="space-y-6">
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
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {['Sales', 'SaaS', 'FinTech', 'HealthTech', 'AdTech', 'Hardware', 'Cybersecurity', 'MarTech', 'E-commerce', 'Logistics', 'PropTech', 'EdTech'].map(sector => (
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
          </div>
        </aside>

        {/* Job list */}
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
            ) : sorted.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState
                  icon={<Search size={40} />}
                  title="No Remote Roles Found"
                  description="Try adjusting your filters or check back soon for new listings."
                  action={{ label: 'Reset Filters', onClick: clearAll }}
                  className="p-32 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              </motion.div>
            ) : (
              sorted.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link to={`/jobs/${job.id}`}>
                    <Card className="job-card-hover p-8 md:p-10 border border-white/5 group relative overflow-hidden rounded-[32px]">
                      <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-10">
                        <div className="flex gap-6 md:gap-8 min-w-0">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-xl group-hover:scale-105 transition-all duration-500 overflow-hidden">
                            <CompanyLogo domain={getDomain(job.company_website || job.domain, job.company)} name={job.company} />
                          </div>
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors leading-none">
                                {job.title}
                              </h3>
                              {job.featured && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[9px] tracking-widest shrink-0">Featured</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-4 md:gap-6 text-muted-foreground font-bold text-[11px] tracking-[0.15em] pt-2">
                              <span className="text-foreground">{job.company}</span>
                              <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {job.location}</span>
                              <span className="flex items-center gap-2"><Briefcase size={14} className="text-primary" /> {job.sector}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 text-right">
                          {(job.via_partner || job.is_partner) && (!job.ote || job.ote === 'Salary Not Disclosed') ? (
                            <span className="text-white/40 text-sm">Salary not disclosed</span>
                          ) : (
                            <>
                              <p className="text-[10px] text-muted-foreground font-black tracking-[0.25em] mb-1 opacity-50 hidden md:block">On-Target Earnings</p>
                              <p className="text-2xl md:text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">{job.ote}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}
