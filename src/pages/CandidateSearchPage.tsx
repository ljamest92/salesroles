import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Container, Card, Badge } from '@blinkdotnew/ui'
import { Search, MapPin, Star, Download } from 'lucide-react'

interface Candidate {
  id: number
  name: string
  headline: string
  location: string
  years_in_sales: number
  total_revenue: string
  current_roles: string
  looking_for: string
  cv_filename: string
  is_pro: number
}

const CANDIDATES_PER_PAGE = 12

export function CandidateSearchPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [cvMessages, setCvMessages] = useState<Record<number, string>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/candidates?search=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(data => { setCandidates(Array.isArray(data) ? data : []); setCurrentPage(1) })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false))
  }, [searchQuery])

  const handleDownloadCV = async (candidateId: number) => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { setCvMessages(m => ({ ...m, [candidateId]: 'Log in to download' })); return }
    const res = await fetch(`/api/candidates/${candidateId}/download-cv`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setCvMessages(m => ({ ...m, [candidateId]: data.filename ? `CV: ${data.filename}` : (data.error || 'No CV') }))
  }

  const totalPages = Math.ceil(candidates.length / CANDIDATES_PER_PAGE)
  const paginated = candidates.slice((currentPage - 1) * CANDIDATES_PER_PAGE, currentPage * CANDIDATES_PER_PAGE)

  return (
    <Container className="pt-12 pb-16 md:pt-16 space-y-10 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
          Find <span className="text-primary">Sales Talent.</span>
        </h1>
        <p className="text-white/50 text-lg font-medium">Browse verified sales professionals open to new opportunities.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, headline, or role type..."
          className="w-full bg-card/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {!loading && candidates.length > 0 && (
        <p className="text-white/30 text-sm">
          Showing {(currentPage - 1) * CANDIDATES_PER_PAGE + 1}–{Math.min(currentPage * CANDIDATES_PER_PAGE, candidates.length)} of {candidates.length} candidates
        </p>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Card key={i} className="h-48 animate-pulse bg-card/20 rounded-[28px]" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-[40px]">
          <p className="text-white/40 font-medium">No candidates found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map(c => {
            let roles: string[] = []
            let lookingFor: string[] = []
            try { roles = JSON.parse(c.current_roles || '[]') } catch {}
            try { lookingFor = JSON.parse(c.looking_for || '[]') } catch {}

            return (
              <Card key={c.id} className="p-6 border border-white/5 bg-card/30 rounded-[28px] space-y-4 flex flex-col">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg tracking-tight">{c.name}</h3>
                    {c.is_pro === 1 && (
                      <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        <Star size={8} /> PRO
                      </span>
                    )}
                  </div>
                  {c.headline && <p className="text-sm text-white/50">{c.headline}</p>}
                  {c.location && <p className="flex items-center gap-1.5 text-xs text-white/30"><MapPin size={12} className="text-primary" /> {c.location}</p>}
                </div>

                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {roles.slice(0, 3).map(r => <Badge key={r} variant="outline" className="text-[10px] border-white/10 text-white/50">{r}</Badge>)}
                    {roles.length > 3 && <span className="text-[10px] text-white/30">+{roles.length - 3}</span>}
                  </div>
                )}

                {(c.years_in_sales != null || c.total_revenue) && (
                  <div className="flex gap-4 text-center">
                    {c.years_in_sales != null && (
                      <div>
                        <p className="text-sm font-black text-emerald-400">{c.years_in_sales}</p>
                        <p className="text-[9px] font-bold text-white/30 tracking-widest">YRS</p>
                      </div>
                    )}
                    {c.total_revenue && (
                      <div>
                        <p className="text-sm font-black text-emerald-400">{c.total_revenue}</p>
                        <p className="text-[9px] font-bold text-white/30 tracking-widest">REVENUE</p>
                      </div>
                    )}
                  </div>
                )}

                {cvMessages[c.id] && <p className="text-[11px] text-white/40">{cvMessages[c.id]}</p>}

                <div className="flex gap-2 pt-1">
                  <Link to={`/profile/${c.id}`} className="flex-1 text-center text-xs font-bold bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors">
                    View Profile
                  </Link>
                  {c.cv_filename && (
                    <button onClick={() => handleDownloadCV(c.id)} className="flex items-center gap-1.5 text-xs font-bold border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 text-white/50 px-3 py-2 rounded-lg transition-colors">
                      <Download size={12} /> CV
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-white/30 px-1">...</span>}
                <button onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-emerald-500 text-white' : 'border border-white/20 text-white/60 hover:text-white'}`}>
                  {page}
                </button>
              </React.Fragment>
            ))
          }
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">
            Next
          </button>
        </div>
      )}
    </Container>
  )
}
