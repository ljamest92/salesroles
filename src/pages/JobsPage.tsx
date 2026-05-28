import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
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
  EmptyState,
  toast
} from '@blinkdotnew/ui'
import AnimatedCounter from '../components/AnimatedCounter'
import { Search, MapPin, Briefcase, SlidersHorizontal, Building2, ShieldAlert, Share2 } from 'lucide-react'
import { type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'
import { motion } from 'framer-motion'
import { ReportModal } from '../components/ReportModal'
import { useAuth } from '../hooks/useAuth'

const SelectTrigger = UISelectTrigger as any
const SelectContent = UISelectContent as any
const SelectItem = UISelectItem as any

const JOBS_PER_PAGE = 10

export function JobsPage() {
  const { user } = useAuth()
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
  const [workTypeFilters, setWorkTypeFilters] = useState<string[]>([])
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([])
  const [sectorFilters, setSectorFilters] = useState<string[]>([])
  const [stats, setStats] = useState({ liveRoles: 0, avgOteNum: 0 })
  const [reportingJobId, setReportingJobId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('latest')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOTERange, setSelectedOTERange] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

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
          avgOteNum: unique.length > 0 ? Math.round(totalOte / unique.length) : 0
        })
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
        setIsLoading(false)
      }
    }
    fetchAllJobs()
  }, [])

  // Fetch applied job IDs for the logged-in candidate
  useEffect(() => {
    const token = localStorage.getItem('salesroles_token')
    if (!token || !user || (user as any).role !== 'candidate') return
    fetch('/api/candidate/applied-job-ids', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(ids => { if (Array.isArray(ids)) setAppliedJobIds(new Set(ids)) })
      .catch(() => {})
  }, [user])

  // Sync locationTags → ?location= URL param
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

  // Sync searchTags → ?search= URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (searchTags.length > 0) {
      params.set('search', searchTags.join(','))
    } else {
      params.delete('search')
    }
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

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const clearAll = () => {
    setSearchTags([])
    setTagInput('')
    setLocationTags([])
    setLocationInput('')
    setWorkTypeFilters([])
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTags.length === 0 || searchTags.some(tag => {
      const t = tag.toLowerCase()
      return (job.title ?? '').toLowerCase().includes(t) ||
        (job.company ?? '').toLowerCase().includes(t)
    })
    const matchesLocation = locationTags.length === 0 || locationTags.some(tag =>
      (job.location ?? '').toLowerCase().includes(tag.toLowerCase())
    )
    const matchesWorkType = workTypeFilters.length === 0 || workTypeFilters.includes(job.job_type)
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
    return matchesSearch && matchesLocation && matchesWorkType && matchesSeniority && matchesSector && matchesOTE
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
    // Default 'latest': featured jobs float to the top, then most recent
    const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    if (featuredDiff !== 0) return featuredDiff
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${id}`)
    toast.success('Link copied', { description: 'The job URL is now in your clipboard.' })
  }

  const userPaginatedRef = useRef(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTags, locationTags, workTypeFilters, seniorityFilters, sectorFilters, selectedOTERange, sortBy])

  useEffect(() => {
    if (!userPaginatedRef.current) return
    userPaginatedRef.current = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const activeFilterCount = workTypeFilters.length + seniorityFilters.length + sectorFilters.length + locationTags.length

  const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE)
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  )

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-16 animate-fade-in overflow-x-hidden">
      <Helmet>
        <title>Browse Sales Jobs | Base Salary & OTE on Every Listing | SalesRoles.co</title>
        <meta name="description" content="Search 100+ sales jobs with full compensation transparency. Filter by role, location, and seniority. Base salary, OTE, and commission shown on every listing. No surprises at offer stage." />
        <meta property="og:title" content="Browse Sales Jobs | Base Salary & OTE on Every Listing | SalesRoles.co" />
        <meta property="og:description" content="Search 100+ sales jobs with full compensation transparency. Filter by role, location, and seniority. Base salary, OTE, and commission shown on every listing. No surprises at offer stage." />
        <meta property="og:url" content="https://salesroles.co/jobs" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://salesroles.co/logo.svg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Browse Sales Jobs | Base Salary & OTE on Every Listing | SalesRoles.co" />
        <meta name="twitter:description" content="Search 100+ sales jobs with full compensation transparency. Filter by role, location, and seniority. Base salary, OTE, and commission shown on every listing. No surprises at offer stage." />
        <meta name="twitter:image" content="https://salesroles.co/logo.svg" />
      </Helmet>
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
            Find Your Next <span className="text-primary">Sales Role.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
            Browse {stats.liveRoles} verified live sales roles with mandatory transparent compensation.
          </p>
        </div>
        <Card className="p-6 sm:p-8 bg-card/50 border border-white/5 backdrop-blur-xl w-full md:w-auto shrink-0 shadow-2xl relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-full" />
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4 space-y-1 text-center">
              <p className="text-2xl font-black tracking-tighter"><AnimatedCounter target={stats.liveRoles} /></p>
              <p className="text-xs text-muted-foreground font-bold tracking-widest">Live Roles</p>
            </div>
            <div className="pl-4 space-y-1 text-center">
              <p className="text-2xl font-black tracking-tighter text-emerald-400"><AnimatedCounter target={stats.avgOteNum} prefix="$" suffix="k" /></p>
              <p className="text-xs text-muted-foreground font-bold tracking-widest">Average OTE</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile filter toggle */}
      <div className="flex lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 font-bold"
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={16} className="text-primary" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-2 py-0.5 ml-1">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Filters Sidebar — hidden on mobile until toggled */}
        <aside className={`lg:w-72 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
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
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  onBlur={() => { if (locationInput.trim()) addLocationTag(locationInput) }}
                  placeholder="City, country or region…"
                  className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {locationInput && (
                  <button
                    onClick={() => setLocationInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Remote', value: 'Remote' },
                  { label: 'Australia', value: 'Australia' },
                  { label: 'United Kingdom', value: 'UK' },
                  { label: 'United States', value: 'US' },
                  { label: 'Europe', value: 'Europe' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => {
                      if (!locationTags.includes(value)) addLocationTag(value)
                    }}
                    className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border transition-colors ${
                      locationTags.includes(value)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/20 text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-400'
                    }`}
                  >
                    {label}
                  </button>
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
          </div>
        </aside>

        {/* Main Jobs List */}
        <div className="flex-1 space-y-10 min-w-0">
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

          {!isLoading && sortedJobs.length > 0 && (
            <p className="text-white/40 text-sm mb-4">
              Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1}–{Math.min(currentPage * JOBS_PER_PAGE, sortedJobs.length)} of {sortedJobs.length} roles
            </p>
          )}

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
              paginatedJobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <Card className="job-card-hover p-5 sm:p-8 md:p-10 border border-white/5 group relative overflow-hidden rounded-[32px]">
                      <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-10 min-w-0">
                        <div className="flex gap-4 sm:gap-6 md:gap-8 min-w-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-xl transition-all group-hover:scale-105 duration-500 overflow-hidden relative">
                            <CompanyLogo domain={job.domain || getDomain(job.company_website || '')} name={job.company} uploadedLogoUrl={job.company_logo_url} />
                          </div>
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors leading-none">
                                <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                              </h3>
                              {job.featured && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[9px] tracking-widest">Featured</Badge>}
                              {job.is_partner && <Badge variant="outline" className="text-[9px] font-black text-muted-foreground/40 border-white/10 tracking-widest">Via Partner</Badge>}
                              {job.via_partner && (
                                <span className="text-xs border border-emerald-500/30 text-emerald-400/70 px-2 py-0.5 rounded-full">
                                  Via Partner
                                </span>
                              )}
                              {appliedJobIds.has(job.id) && (
                                <span className="text-[9px] font-black tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                  ✓ Applied
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-6 text-muted-foreground font-bold text-[11px] tracking-[0.15em] pt-2">
                              <Link to={`/company/${(job.company ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-foreground hover:text-primary transition-colors">{job.company}</Link>
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
                        <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 text-right shrink-0">
                          <div>
                            {(job.via_partner || job.is_partner) && (!job.ote || job.ote === 'Salary Not Disclosed') ? (
                              <span className="text-white/40 text-sm">Salary not disclosed</span>
                            ) : (
                              <>
                                <p className="text-[10px] text-muted-foreground font-black tracking-[0.25em] mb-2 opacity-50">On-Target Earnings</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">{job.ote}</p>
                                {job.base_salary && job.base_salary !== 'Salary Not Disclosed' && (
                                  <p className="text-[11px] text-primary font-black tracking-[0.2em] mt-2 underline underline-offset-4">Base: {job.base_salary}</p>
                                )}
                              </>
                            )}
                          </div>
                          {(job.via_partner || job.is_partner || job.id.startsWith('adzuna-') || job.id.startsWith('remotive-')) && job.application_url && (
                            <a
                              href={job.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-xs font-black tracking-widest bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                            >
                              Apply →
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
              <button
                onClick={() => { userPaginatedRef.current = true; setCurrentPage(p => Math.max(1, p - 1)) }}
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
                      onClick={() => { userPaginatedRef.current = true; setCurrentPage(page) }}
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
                onClick={() => { userPaginatedRef.current = true; setCurrentPage(p => Math.min(totalPages, p + 1)) }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
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
