import React, { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Container, Card, Badge } from '@blinkdotnew/ui'
import { MapPin, Star, Share2, Briefcase, TrendingUp, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface WorkEntry {
  title: string
  company: string
  start: string
  end: string
  industry: string
  description: string
  cash_collected: string
  avg_deal_size: string
  highlights: string
}

interface CandidateProfile {
  id: number
  name: string
  headline: string
  location: string
  years_in_sales: number
  total_revenue: string
  companies_closed: number
  current_roles: string
  looking_for: string
  bio: string
  work_history: string
  cv_filename: string
  is_pro: number
}

export function CandidateProfilePage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { user } = useAuth()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cvMsg, setCvMsg] = useState('')

  useEffect(() => {
    fetch(`/api/candidates/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); return }
        setProfile(data)
        // Track view if logged in
        const token = localStorage.getItem('salesroles_token')
        if (token) {
          fetch(`/api/candidates/${id}/view`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCV = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { setCvMsg('Please log in to download CV'); return }
    const res = await fetch(`/api/candidates/${id}/download-cv`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.filename) {
      setCvMsg(`CV: ${data.filename}`)
    } else {
      setCvMsg(data.error || 'No CV available')
    }
  }

  if (loading) return (
    <Container className="py-24 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </Container>
  )

  if (notFound || !profile) return (
    <Container className="py-24 text-center">
      <h2 className="text-3xl font-black tracking-tighter mb-3">Profile Not Found</h2>
      <p className="text-white/40">This profile is private or does not exist.</p>
    </Container>
  )

  let currentRoles: string[] = []
  let lookingFor: string[] = []
  let workHistory: WorkEntry[] = []
  try { currentRoles = JSON.parse(profile.current_roles || '[]') } catch {}
  try { lookingFor = JSON.parse(profile.looking_for || '[]') } catch {}
  try { workHistory = JSON.parse(profile.work_history || '[]') } catch {}

  return (
    <Container className="pt-12 pb-16 md:pt-16 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header card */}
      <Card className="p-8 md:p-10 border border-white/5 bg-card/50 rounded-[40px] space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{profile.name}</h1>
              {profile.is_pro === 1 && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                  <Star size={10} /> PRO
                </span>
              )}
            </div>
            {profile.headline && <p className="text-white/60 font-medium">{profile.headline}</p>}
            {profile.location && (
              <p className="flex items-center gap-2 text-sm text-white/40">
                <MapPin size={14} className="text-primary" /> {profile.location}
              </p>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={handleShare} className="flex items-center gap-2 text-xs font-bold border border-white/10 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-colors">
              <Share2 size={14} /> {copied ? 'Copied!' : 'Share'}
            </button>
            {profile.cv_filename && (
              <button onClick={handleDownloadCV} className="flex items-center gap-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg transition-colors">
                Download CV
              </button>
            )}
          </div>
        </div>

        {cvMsg && <p className="text-xs text-white/40">{cvMsg}</p>}

        {/* Role tags */}
        {currentRoles.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-white/30">CURRENT ROLES</p>
            <div className="flex flex-wrap gap-2">
              {currentRoles.map(r => <Badge key={r} variant="outline" className="text-xs border-white/10 text-white/60">{r}</Badge>)}
            </div>
          </div>
        )}
        {lookingFor.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-white/30">LOOKING FOR</p>
            <div className="flex flex-wrap gap-2">
              {lookingFor.map(r => <Badge key={r} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{r}</Badge>)}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          {profile.years_in_sales != null && (
            <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-black text-emerald-400">{profile.years_in_sales}</p>
              <p className="text-[10px] font-bold tracking-widest text-white/40">YRS IN SALES</p>
            </div>
          )}
          {profile.total_revenue && (
            <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-black text-emerald-400">{profile.total_revenue}</p>
              <p className="text-[10px] font-bold tracking-widest text-white/40">TOTAL REVENUE</p>
            </div>
          )}
          {profile.companies_closed != null && (
            <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-black text-emerald-400">{profile.companies_closed}</p>
              <p className="text-[10px] font-bold tracking-widest text-white/40">COMPANIES</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <p className="text-[10px] font-bold tracking-widest text-white/30">ABOUT</p>
            <p className="text-sm text-white/60 leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </Card>

      {/* Work history */}
      {workHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Briefcase size={18} className="text-primary" /> Work History
          </h2>
          {workHistory.map((entry, i) => (
            <Card key={i} className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[32px] space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{entry.title}</h3>
                  <p className="text-white/60 font-medium flex items-center gap-2 mt-1">
                    <Building2 size={14} className="text-primary" /> {entry.company}
                    {entry.industry && <span className="text-white/30">· {entry.industry}</span>}
                  </p>
                </div>
                {(entry.start || entry.end) && (
                  <p className="text-sm text-white/30 font-medium shrink-0">{entry.start}{entry.start && entry.end ? ' – ' : ''}{entry.end}</p>
                )}
              </div>

              {(entry.cash_collected || entry.avg_deal_size) && (
                <div className="flex gap-6">
                  {entry.cash_collected && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold tracking-widest text-white/30">CASH COLLECTED</p>
                      <p className="text-lg font-black text-emerald-400">{entry.cash_collected}</p>
                    </div>
                  )}
                  {entry.avg_deal_size && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold tracking-widest text-white/30">AVG DEAL SIZE</p>
                      <p className="text-lg font-black text-emerald-400">{entry.avg_deal_size}</p>
                    </div>
                  )}
                </div>
              )}

              {entry.description && <p className="text-sm text-white/50 leading-relaxed">{entry.description}</p>}

              {entry.highlights && (
                <ul className="space-y-1.5">
                  {entry.highlights.split('\n').filter(Boolean).map((h, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                      <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  )
}
