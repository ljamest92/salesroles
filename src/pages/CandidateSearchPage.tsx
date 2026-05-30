import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Container } from '@blinkdotnew/ui'
import { Search, MapPin, Star, ChevronRight, FileText, Link2, SlidersHorizontal, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface Candidate {
  id: number
  name: string
  headline: string
  location: string
  target_role: string
  years_experience: string
  skills: string
  target_salary: string
  availability: string
  industries: string
  deal_sizes: string
  sales_methodology: string
  avatar_url: string
  cv_filename: string
  is_pro: number
  profile_slug: string
  achievements: string
  current_ote: string
  linkedin_url: string
}

const TARGET_ROLES = ['SDR', 'BDR', 'Account Executive', 'Senior Account Executive', 'Enterprise Account Executive', 'Account Manager', 'Sales Manager', 'VP of Sales', 'Sales Director', 'BDM']
const EXPERIENCE_OPTIONS = [
  { label: 'Less than 1 year', min: 0, max: 0 },
  { label: '1–2 years',        min: 1, max: 2 },
  { label: '3–5 years',        min: 3, max: 5 },
  { label: '5–10 years',       min: 5, max: 10 },
  { label: '10+ years',        min: 10, max: 999 },
]
const AVAILABILITY_OPTIONS = ['Actively looking', 'Open to opportunities']
const INDUSTRY_OPTIONS = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'HR Tech', 'MarTech', 'Cybersecurity', 'Enterprise Software', 'E-commerce', 'Logistics', 'Real Estate Tech', 'InsurTech']
const DEAL_SIZE_OPTIONS = ['<$10K', '$10K–$50K', '$50K–$100K', '$100K–$500K', '$500K–$1M', '$1M+']
const METHODOLOGY_OPTIONS = ['MEDDIC', 'SPIN Selling', 'Challenger Sale', 'Command of the Message', 'Sandler', 'Gap Selling']

const defaultFilters = {
  search: '',
  target_role: '',
  years_experience: '',
  availability: '',
  industry: '',
  deal_size: '',
  methodology: '',
  location: '',
  sort_by: 'relevance',
}

const selCls = "w-full bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 appearance-none"
const inpCls = "w-full bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50"

export function CandidateSearchPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [accessChecked, setAccessChecked] = useState(false)
  const [filters, setFilters] = useState({ ...defaultFilters })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const searchTimer = useRef<any>(null)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Gate: company accounts only
  useEffect(() => {
    if (authLoading) return
    if (!user || (user as any).role !== 'company') {
      // Store toast message in sessionStorage so dashboard can display it
      sessionStorage.setItem('dashboard_toast', 'This area is for hiring companies only.')
      navigate({ to: '/dashboard', search: { mode: 'candidate' } as any })
      return
    }
    setAccessChecked(true)
  }, [user, authLoading, navigate])

  const fetchCandidates = useCallback(async (f: typeof filters, p: number) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.search) params.set('search', f.search)
    if (f.target_role) params.set('target_role', f.target_role)
    if (f.years_experience) {
      const range = EXPERIENCE_OPTIONS.find(o => o.label === f.years_experience)
      if (range) {
        params.set('exp_min', String(range.min))
        params.set('exp_max', String(range.max))
      }
    }
    if (f.availability) params.set('availability', f.availability)
    if (f.industry) params.set('industry', f.industry)
    if (f.deal_size) params.set('deal_size', f.deal_size)
    if (f.methodology) params.set('methodology', f.methodology)
    if (f.location) params.set('location', f.location)
    params.set('sort_by', f.sort_by)
    params.set('page', String(p))
    try {
      const token = localStorage.getItem('salesroles_token')
      const res = await fetch(`/api/candidates?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setCandidates(data.candidates || [])
      setTotal(data.total || 0)
      setPages(data.pages || 0)
    } catch {
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search, instant for other filters
  const updateFilter = (key: string, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    setPage(1)
    if (key === 'search') {
      clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => fetchCandidates(next, 1), 350)
    } else {
      fetchCandidates(next, 1)
    }
  }

  const clearFilters = () => {
    setFilters({ ...defaultFilters })
    setPage(1)
    fetchCandidates({ ...defaultFilters }, 1)
  }

  useEffect(() => {
    fetchCandidates(filters, page)
  }, [page]) // eslint-disable-line

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'sort_by' && v !== '').length

  const safeList = (v: string | null | undefined): string[] => {
    if (!v) return []
    try { return JSON.parse(v) } catch { return v.split(',').map(s => s.trim()).filter(Boolean) }
  }

  const FilterSidebar = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black tracking-widest text-muted-foreground">FILTERS</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">SEARCH</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Name, headline, skills..." value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className={inpCls + ' pl-9'} />
        </div>
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">ROLE</label>
        <select value={filters.target_role} onChange={e => updateFilter('target_role', e.target.value)} className={selCls}>
          <option value="">All Roles</option>
          {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Experience */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">EXPERIENCE</label>
        <select value={filters.years_experience} onChange={e => updateFilter('years_experience', e.target.value)} className={selCls}>
          <option value="">Any</option>
          {EXPERIENCE_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
        </select>
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">AVAILABILITY</label>
        <select value={filters.availability} onChange={e => updateFilter('availability', e.target.value)} className={selCls}>
          <option value="">Any</option>
          {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Industry */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">INDUSTRY</label>
        <select value={filters.industry} onChange={e => updateFilter('industry', e.target.value)} className={selCls}>
          <option value="">Any</option>
          {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Deal Size */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">DEAL SIZE</label>
        <select value={filters.deal_size} onChange={e => updateFilter('deal_size', e.target.value)} className={selCls}>
          <option value="">Any</option>
          {DEAL_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Methodology */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">METHODOLOGY</label>
        <select value={filters.methodology} onChange={e => updateFilter('methodology', e.target.value)} className={selCls}>
          <option value="">Any</option>
          {METHODOLOGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black tracking-widest text-white/40">LOCATION</label>
        <input type="text" placeholder="City or country..." value={filters.location}
          onChange={e => updateFilter('location', e.target.value)} className={inpCls} />
      </div>
    </div>
  )

  // Don't render until access has been confirmed (prevents flash)
  if (authLoading || !accessChecked) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </Container>
    )
  }

  return (
    <Container className="pt-12 pb-16 md:pt-16 animate-fade-in">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
          Find <span className="text-emerald-400">Sales Talent.</span>
        </h1>
        <p className="text-white/50 text-lg font-medium">Browse verified sales professionals open to new opportunities.</p>
      </div>

      <div className="flex gap-8">
        {/* Filter sidebar — desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8 bg-[#0a0f1e] border border-white/10 rounded-2xl p-5">
            <FilterSidebar />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Mobile filter button + sort bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              <p className="text-white/40 text-sm">
                {total} candidate{total !== 1 ? 's' : ''}
                {activeFilterCount > 0 && <span className="text-emerald-400 ml-1">({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)</span>}
              </p>
            </div>
            <select
              value={filters.sort_by}
              onChange={e => updateFilter('sort_by', e.target.value)}
              className="bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 appearance-none shrink-0"
            >
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest First</option>
              <option value="experience_high">Most Experienced</option>
              <option value="experience_low">Least Experienced</option>
            </select>
          </div>

          {/* Mobile filters drawer */}
          {showFilters && (
            <div className="lg:hidden bg-card/50 border border-white/10 rounded-2xl p-5">
              <FilterSidebar />
            </div>
          )}

          {/* Candidates grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-56 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40 font-medium mb-2">No candidates found.</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-primary text-sm font-bold hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {candidates.map(c => {
                const skills = safeList(c.skills)
                const industries = safeList(c.industries)
                const dealSizes = safeList(c.deal_sizes)
                const slug = c.profile_slug || String(c.id)

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate({ to: `/profile/${slug}` as any })}
                    className="bg-white/5 border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 transition-all duration-200 group cursor-pointer flex flex-col gap-3"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.avatar_url ? (
                          <img src={`/uploads/avatars/${c.avatar_url}`} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-emerald-400 font-bold text-sm">{c.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-white font-semibold text-sm">{c.name}</h3>
                          {c.is_pro === 1 && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                              <Star size={8} /> PRO
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-xs truncate mt-0.5">{c.headline || c.target_role || 'Sales Professional'}</p>
                        {c.location && (
                          <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {c.location}
                          </p>
                        )}
                      </div>
                      {c.availability && c.availability !== 'Not looking' && (
                        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${
                          c.availability === 'Actively looking'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {c.availability === 'Actively looking' ? 'Active' : 'Open'}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    {(c.years_experience || c.target_salary || dealSizes.length > 0) && (
                      <div className="grid grid-cols-3 gap-2">
                        {c.years_experience && (
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-emerald-400 font-bold text-sm">{c.years_experience}</p>
                            <p className="text-white/30 text-[9px]">Yrs Exp</p>
                          </div>
                        )}
                        {c.target_salary && (
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-emerald-400 font-bold text-xs truncate">{c.target_salary}</p>
                            <p className="text-white/30 text-[9px]">Target OTE</p>
                          </div>
                        )}
                        {dealSizes.length > 0 && (
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-emerald-400 font-bold text-xs truncate">{dealSizes[0]}</p>
                            <p className="text-white/30 text-[9px]">Deal Size</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Industries */}
                    {industries.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {industries.slice(0, 3).map((ind, i) => (
                          <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">{ind}</span>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-2">
                        {c.cv_filename && (
                          <span className="flex items-center gap-1 text-[10px] text-white/30"><FileText size={10} /> CV</span>
                        )}
                        {c.linkedin_url && (
                          <span className="flex items-center gap-1 text-[10px] text-white/30"><Link2 size={10} /> LinkedIn</span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 group-hover:text-emerald-300 flex items-center gap-0.5 transition-colors font-bold">
                        View <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
              >
                Previous
              </button>
              <span className="text-white/30 text-sm">Page {page} of {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-4 py-2 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
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
