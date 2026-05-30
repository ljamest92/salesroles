import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
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
import AnimatedCounter from '../components/AnimatedCounter'

const SelectTrigger = UISelectTrigger as any
const SelectContent = UISelectContent as any
const SelectItem = UISelectItem as any

const JOBS_PER_PAGE = 10

export function RemoteSalesJobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchTags, setSearchTags] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('search') || ''
    return raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : []
  })
  const [tagInput, setTagInput] = useState('')
  const [locationTags, setLocationTags] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('location') || ''
    return raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : []
  })
  const [locationInput, setLocationInput] = useState('')
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([])
  const [sectorFilters, setSectorFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('latest')
  const [selectedOTERange, setSelectedOTERange] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

        const PER_COMPANY_CAP = 15
        const companyCount = new Map<string, number>()
        const capped = remoteJobs.filter((job: any) => {
          const name = job.company || ''
          const n = (companyCount.get(name) || 0) + 1
          companyCount.set(name, n)
          return n <= PER_COMPANY_CAP
        })
        setJobs(capped as Job[])
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
    setSearchTags([])
    setTagInput('')
    setLocationTags([])
    setLocationInput('')
    setSeniorityFilters([])
    setSectorFilters([])
    setSelectedOTERange('')
  }

  const addTag = (raw: string) => {
    const val = raw.trim().replace(/,$/, '').trim()
    if (!val) return
    setSearchTags(prev => prev.includes(val) ? prev : [...prev, val])
    setTagInput('')
  }

  const removeTag = (tag: string) => setSearchTags(prev => prev.filter(t => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '') {
      setSearchTags(prev => prev.slice(0, -1))
    }
  }

  const addLocationTag = (raw: string) => {
    const val = raw.trim().replace(/,$/, '').trim()
    if (!val) return
    setLocationTags(prev => prev.includes(val) ? prev : [...prev, val])
    setLocationInput('')
  }

  const removeLocationTag = (tag: string) => setLocationTags(prev => prev.filter(t => t !== tag))

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addLocationTag(locationInput)
    } else if (e.key === 'Backspace' && locationInput === '') {
      setLocationTags(prev => prev.slice(0, -1))
    }
  }

  const parseOTE = (ote: any): number => {
    if (!ote) return 0
    if (typeof ote === 'number') return ote
    return parseInt(String(ote).replace(/\D/g, '')) || 0
  }

  const filtered = jobs.filter(job => {
    const matchesSearch = searchTags.length === 0 || searchTags.some(tag => {
      const t = tag.toLowerCase()
      return job.title.toLowerCase().includes(t) || job.company.toLowerCase().includes(t)
    })
    const matchesSeniority = seniorityFilters.length === 0 || seniorityFilters.includes(job.seniority)
    const matchesSector = sectorFilters.length === 0 || sectorFilters.includes(job.sector)
    const matchesOTE = !selectedOTERange || (() => {
      const ote = parseOTE(job.ote)
      const ranges: Record<string, [number, number]> = {
        '$50k – $100k': [50000, 100000],
        '$100k – $150k': [100000, 150000],
        '$150k – $200k': [150000, 200000],
        '$200k – $300k': [200000, 300000],
        '$300k+': [300000, Infinity],
      }
      const range = ranges[selectedOTERange]
      if (!range) return true
      return ote >= range[0] && ote <= range[1]
    })()
    const REGION_KEYWORDS: Record<string, string[]> = {
      'Americas': ['usa', 'united states', 'canada', 'mexico', 'brazil', 'new york', 'san francisco', 'austin', 'chicago', 'los angeles', 'seattle', 'boston', 'toronto', 'vancouver', 'latin america', 'south america', 'north america', 'americas'],
      'Europe': ['uk', 'united kingdom', 'england', 'london', 'germany', 'berlin', 'france', 'paris', 'netherlands', 'amsterdam', 'spain', 'madrid', 'ireland', 'dublin', 'sweden', 'stockholm', 'europe', 'european'],
      'Asia-Pacific': ['australia', 'sydney', 'melbourne', 'new zealand', 'singapore', 'japan', 'tokyo', 'india', 'bangalore', 'hong kong', 'apac', 'asia', 'pacific'],
      'Global': ['global', 'worldwide', 'anywhere', 'international', 'remote'],
    }
    const loc = (job.location ?? '').toLowerCase()
    const matchesLocation = locationTags.length === 0 || locationTags.some(tag => {
      const keywords = REGION_KEYWORDS[tag]
      if (keywords) return keywords.some(kw => loc.includes(kw))
      return loc.includes(tag.toLowerCase())
    })
    return matchesSearch && matchesSeniority && matchesSector && matchesOTE && matchesLocation
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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTags, locationTags, seniorityFilters, sectorFilters, selectedOTERange, sortBy])


  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (searchTags.length > 0) { params.set('search', searchTags.join(',')) }
    else { params.delete('search') }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    const scrollY = window.scrollY
    const origScrollTo = window.scrollTo.bind(window)
    ;(window as any).scrollTo = () => {}
    window.history.replaceState(null, '', newUrl)
    requestAnimationFrame(() => {
      ;(window as any).scrollTo = origScrollTo
      window.scrollTo(0, scrollY)
    })
  }, [searchTags])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (locationTags.length > 0) { params.set('location', locationTags.join(',')) }
    else { params.delete('location') }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    const scrollY = window.scrollY
    const origScrollTo = window.scrollTo.bind(window)
    ;(window as any).scrollTo = () => {}
    window.history.replaceState(null, '', newUrl)
    requestAnimationFrame(() => {
      ;(window as any).scrollTo = origScrollTo
      window.scrollTo(0, scrollY)
    })
  }, [locationTags])

  const activeFilterCount = seniorityFilters.length + sectorFilters.length + (selectedOTERange ? 1 : 0) + locationTags.length

  const remoteCount = jobs.filter(j =>
    (j as any).work_type === 'Remote' || (j as any).work_type === 'remote' || (j as any).remote === true
  ).length || jobs.length

  const otejobs = jobs.filter(j => j.ote && j.ote !== 'Salary Not Disclosed')
  const avgOTENum = otejobs.length > 0
    ? Math.round(otejobs.reduce((sum, j) => {
        const ote = typeof j.ote === 'number' ? j.ote : parseInt(String(j.ote || '0').replace(/\D/g, '')) || 0
        return sum + ote
      }, 0) / otejobs.length / 1000)
    : 0

  const totalPages = Math.ceil(sorted.length / JOBS_PER_PAGE)
  const paginatedJobs = sorted.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  )

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12 animate-fade-in overflow-x-hidden">
      <Helmet>
        <title>Remote Sales Jobs | Full Comp Transparency | SalesRoles.co</title>
        <meta name="description" content="Find remote sales jobs worldwide with base salary, OTE, and commission shown upfront. Account Executive, SDR, BDR, and sales management roles. Work from anywhere and know your comp before you apply." />
        <meta property="og:title" content="Remote Sales Jobs | Full Comp Transparency | SalesRoles.co" />
        <meta property="og:description" content="Find remote sales jobs worldwide with base salary, OTE, and commission shown upfront. Account Executive, SDR, BDR, and sales management roles. Work from anywhere and know your comp before you apply." />
        <meta property="og:url" content="https://salesroles.co/remote-sales-jobs" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://salesroles.co/logo.svg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Remote Sales Jobs | Full Comp Transparency | SalesRoles.co" />
        <meta name="twitter:description" content="Find remote sales jobs worldwide with base salary, OTE, and commission shown upfront. Account Executive, SDR, BDR, and sales management roles. Work from anywhere and know your comp before you apply." />
        <meta name="twitter:image" content="https://salesroles.co/logo.svg" />
      </Helmet>
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-4">
          <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 text-[10px] font-black">Remote Only</Badge>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
            Remote <span className="text-primary">Sales Jobs.</span>
          </h1>
        </div>
        <div className="border border-white/10 rounded-2xl p-4 bg-white/5 w-full md:w-auto min-w-[260px] shrink-0">
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4 text-center">
              <p className="text-white/50 text-xs mb-1">Remote Roles</p>
              <p className="text-white text-2xl font-bold">
                <AnimatedCounter target={remoteCount} />
              </p>
            </div>
            <div className="pl-4 text-center">
              <p className="text-white/50 text-xs mb-1">Average OTE</p>
              <p className="text-emerald-400 text-2xl font-bold">
                <AnimatedCounter target={avgOTENum} prefix="$" suffix="k" />
              </p>
            </div>
          </div>
        </div>
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

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">OTE Range</label>
              <Select value={selectedOTERange || '__all__'} onValueChange={v => setSelectedOTERange(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="All OTE Ranges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All OTE Ranges</SelectItem>
                  <SelectItem value="$50k – $100k">$50k – $100k</SelectItem>
                  <SelectItem value="$100k – $150k">$100k – $150k</SelectItem>
                  <SelectItem value="$150k – $200k">$150k – $200k</SelectItem>
                  <SelectItem value="$200k – $300k">$200k – $300k</SelectItem>
                  <SelectItem value="$300k+">$300k+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Location / Timezone</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  onBlur={() => { if (locationInput.trim()) addLocationTag(locationInput) }}
                  placeholder="Country or timezone…"
                  className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {locationInput && (
                  <button
                    onClick={() => setLocationInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                  >✕</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Americas', value: 'Americas' },
                  { label: 'Europe', value: 'Europe' },
                  { label: 'Asia-Pacific', value: 'Asia-Pacific' },
                  { label: 'Global', value: 'Global' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => { locationTags.includes(value) ? removeLocationTag(value) : addLocationTag(value) }}
                    className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border transition-colors ${
                      locationTags.includes(value)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/20 text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-400'
                    }`}
                  >{label}</button>
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
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder="Search by title, company…"
                className="w-full bg-transparent border-none pl-14 pr-4 py-5 text-sm focus:outline-none transition-all font-medium"
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

          {(searchTags.length > 0 || locationTags.length > 0) && (
            <div className="flex flex-wrap gap-2 -mt-4">
              {searchTags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-black tracking-widest px-3 py-1.5 rounded-full">
                  <Search size={11} />
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-white transition-colors" aria-label={`Remove ${tag}`}>✕</button>
                </span>
              ))}
              {locationTags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-black tracking-widest px-3 py-1.5 rounded-full">
                  <MapPin size={11} />
                  {tag}
                  <button onClick={() => removeLocationTag(tag)} className="ml-1 hover:text-white transition-colors" aria-label={`Remove ${tag}`}>✕</button>
                </span>
              ))}
            </div>
          )}

          {!isLoading && sorted.length > 0 && (
            <p className="text-white/40 text-sm mb-4">
              Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1}–{Math.min(currentPage * JOBS_PER_PAGE, sorted.length)} of {sorted.length} roles
            </p>
          )}

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
              paginatedJobs.map((job, i) => (
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
                            <CompanyLogo domain={job.domain || getDomain(job.company_website || '')} name={job.company} uploadedLogoUrl={job.company_logo_url} />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
              <button
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); setTimeout(() => window.scrollTo(0, 0), 0) }}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-white/30 px-2">...</span>
                    )}
                    <button
                      onClick={() => { setCurrentPage(page); setTimeout(() => window.scrollTo(0, 0), 0) }}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-500 text-white'
                          : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
              <button
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); setTimeout(() => window.scrollTo(0, 0), 0) }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
