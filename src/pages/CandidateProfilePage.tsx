import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Container, Card, Badge } from '@blinkdotnew/ui'
import { MapPin, Star, Share2, Briefcase, TrendingUp, Building2, FileText, Link2, DollarSign, Target, Zap, Award, Phone, Mail, Copy, Check, X, Bookmark, BookmarkCheck } from 'lucide-react'
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
  years_experience: number
  total_revenue: string
  companies_closed: number
  current_roles: string
  looking_for: string
  bio: string
  work_history: string
  cv_filename: string
  is_pro: number
  avatar_url: string
  linkedin_url: string
  target_role: string
  skills: string
  target_salary: string
  current_ote: string
  availability: string
  achievements: string
  industries: string
  deal_sizes: string
  sales_methodology: string
  profile_slug: string
}

function safeList(v: string | null | undefined): string[] {
  if (!v) return []
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch {}
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

function AvailabilityBadge({ status }: { status: string }) {
  if (!status || status === 'Not looking') return null
  const isActive = status === 'Actively looking'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      {status}
    </span>
  )
}

export function CandidateProfilePage() {
  const { identifier } = useParams({ strict: false }) as { identifier: string }
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cvMsg, setCvMsg] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactData, setContactData] = useState<{ phone?: string; email_contact?: string } | null>(null)
  const [contactError, setContactError] = useState('')
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!identifier) return
    fetch(`/api/candidates/${identifier}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); return }
        setProfile(data)
        const token = localStorage.getItem('salesroles_token')
        if (token) {
          fetch(`/api/candidates/${identifier}/view`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {})
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [identifier])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCV = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { setCvMsg('Please log in to download CV'); return }
    const res = await fetch(`/api/candidates/${identifier}/download-cv`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.filename) {
      setCvMsg(`CV: ${data.filename}`)
    } else {
      setCvMsg(data.error || 'No CV available')
    }
  }

  const handleContact = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { navigate({ to: '/login' as any }); return }
    if (contactData) { setContactOpen(true); return }
    setContactLoading(true)
    setContactError('')
    try {
      const res = await fetch(`/api/candidates/${identifier}/contact`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) { setContactError(data.error || 'Failed to load contact details'); setContactLoading(false); return }
      setContactData(data)
      setContactOpen(true)
    } catch {
      setContactError('Failed to load contact details')
    } finally {
      setContactLoading(false)
    }
  }

  useEffect(() => {
    if (!profile || !user || user.role !== 'company') return
    const token = localStorage.getItem('salesroles_token')
    if (!token) return
    fetch(`/api/saved-candidates/status/${profile.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (typeof data.saved === 'boolean') setIsSaved(data.saved) })
      .catch(() => {})
  }, [profile, user])

  const handleSaveCandidate = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { navigate({ to: '/login' as any }); return }
    if (!profile) return
    setSaveLoading(true)
    try {
      if (isSaved) {
        await fetch(`/api/saved-candidates/${profile.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsSaved(false)
      } else {
        await fetch('/api/saved-candidates', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: profile.id })
        })
        setIsSaved(true)
      }
    } catch {}
    setSaveLoading(false)
  }

  const copyToClipboard = (text: string, field: 'phone' | 'email') => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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

  const currentRoles = safeList(profile.current_roles)
  const lookingFor = safeList(profile.looking_for)
  const skills = safeList(profile.skills)
  const industries = safeList(profile.industries)
  const dealSizes = safeList(profile.deal_sizes)
  const achievements = safeList(profile.achievements)

  let workHistory: WorkEntry[] = []
  try { workHistory = JSON.parse(profile.work_history || '[]') } catch {}

  const yearsExp = profile.years_experience ?? profile.years_in_sales

  const initials = (profile.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Container className="pt-12 pb-16 md:pt-16 max-w-3xl mx-auto space-y-8 animate-fade-in">

      {/* Header card */}
      <Card className="p-8 md:p-10 border border-white/5 bg-card/50 rounded-[40px] space-y-6">

        {/* Top row: avatar + name block + action buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
              {profile.avatar_url && !avatarError ? (
                <img
                  src={
                    profile.avatar_url.startsWith('http')
                      ? profile.avatar_url
                      : profile.avatar_url.startsWith('/uploads/')
                        ? profile.avatar_url
                        : `/uploads/avatars/${profile.avatar_url}`
                  }
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-2xl font-black text-emerald-400">{initials}</span>
              )}
            </div>

            <div className="space-y-2 min-w-0">
              {/* Name + PRO badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">{profile.name}</h1>
                {profile.is_pro === 1 && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold shrink-0">
                    <Star size={10} /> PRO
                  </span>
                )}
              </div>

              {/* Headline */}
              {profile.headline && (
                <p className="text-white/70 font-medium text-lg leading-snug">{profile.headline}</p>
              )}

              {/* Availability badge */}
              {profile.availability && profile.availability !== 'Not looking' && (
                <AvailabilityBadge status={profile.availability} />
              )}

              {/* Location */}
              {profile.location && (
                <p className="flex items-center gap-1.5 text-sm text-white/40">
                  <MapPin size={13} className="text-primary" /> {profile.location}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0 items-start md:items-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-bold border border-white/10 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-colors"
            >
              <Share2 size={13} /> {copied ? 'Copied!' : 'Share'}
            </button>
            {profile.cv_filename && (
              <button
                onClick={handleDownloadCV}
                className="flex items-center gap-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FileText size={13} /> Download CV
              </button>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold border border-white/10 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <Link2 size={13} /> LinkedIn
              </a>
            )}
            {(!user || user.role === 'company') && (
              <button
                onClick={handleContact}
                disabled={contactLoading}
                className="flex items-center gap-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Mail size={13} /> {contactLoading ? 'Loading…' : 'Contact Candidate'}
              </button>
            )}
            {user?.role === 'company' && (
              <button
                onClick={handleSaveCandidate}
                disabled={saveLoading}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                    : 'border border-white/10 text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {saveLoading ? 'Saving…' : isSaved ? 'Saved' : 'Save Candidate'}
              </button>
            )}
          </div>
        </div>

        {cvMsg && <p className="text-xs text-white/40 -mt-2">{cvMsg}</p>}

        {/* Contact modal */}
        {contactOpen && contactData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setContactOpen(false)}>
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base tracking-tight">Contact Details</h3>
                <button onClick={() => setContactOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              {contactData.phone ? (
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium truncate">{contactData.phone}</span>
                  </div>
                  <button onClick={() => copyToClipboard(contactData.phone!, 'phone')} className="shrink-0 text-white/40 hover:text-emerald-400 transition-colors">
                    {copiedField === 'phone' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/30 bg-white/5 rounded-xl px-4 py-3 flex items-center gap-2"><Phone size={14} /> No phone listed</p>
              )}
              {contactData.email_contact ? (
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium truncate">{contactData.email_contact}</span>
                  </div>
                  <button onClick={() => copyToClipboard(contactData.email_contact!, 'email')} className="shrink-0 text-white/40 hover:text-emerald-400 transition-colors">
                    {copiedField === 'email' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/30 bg-white/5 rounded-xl px-4 py-3 flex items-center gap-2"><Mail size={14} /> No email listed</p>
              )}
            </div>
          </div>
        )}
        {contactError && <p className="text-xs text-red-400 -mt-2">{contactError}</p>}

        {/* Stats grid */}
        {(yearsExp != null || profile.target_salary || profile.current_ote || profile.total_revenue || profile.companies_closed != null) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {yearsExp != null && (
              <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
                <p className="text-2xl font-black text-emerald-400">{yearsExp}</p>
                <p className="text-[10px] font-bold tracking-widest text-white/40">YRS EXP</p>
              </div>
            )}
            {profile.current_ote && (
              <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
                <p className="text-xl font-black text-white/80 truncate">{profile.current_ote}</p>
                <p className="text-[10px] font-bold tracking-widest text-white/40">CURRENT OTE</p>
              </div>
            )}
            {profile.target_salary && (
              <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
                <p className="text-xl font-black text-emerald-400 truncate">{profile.target_salary}</p>
                <p className="text-[10px] font-bold tracking-widest text-white/40">TARGET OTE</p>
              </div>
            )}
            {profile.total_revenue && (
              <div className="bg-white/5 rounded-xl p-4 text-center space-y-1">
                <p className="text-xl font-black text-emerald-400 truncate">{profile.total_revenue}</p>
                <p className="text-[10px] font-bold tracking-widest text-white/40">TOTAL REVENUE</p>
              </div>
            )}
          </div>
        )}

        {/* Deal sizes + methodology */}
        {(dealSizes.length > 0 || profile.sales_methodology) && (
          <div className="flex flex-wrap gap-6 pt-1">
            {dealSizes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold tracking-widest text-white/30">DEAL SIZES</p>
                <div className="flex flex-wrap gap-1.5">
                  {dealSizes.map(d => (
                    <span key={d} className="flex items-center gap-1 text-xs bg-white/5 text-white/60 border border-white/10 px-2.5 py-1 rounded-full">
                      <DollarSign size={11} className="text-emerald-500/60" /> {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {safeList(profile.sales_methodology).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold tracking-widest text-white/30">METHODOLOGY</p>
                <div className="flex flex-wrap gap-1.5">
                  {safeList(profile.sales_methodology).map(m => (
                    <span key={m} className="inline-flex items-center gap-1 text-xs bg-white/5 text-white/60 border border-white/10 px-2.5 py-1 rounded-full">
                      <Zap size={11} className="text-emerald-500/60" /> {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Experience (roles worked in) */}
        {safeList(profile.target_role).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-white/30">EXPERIENCE</p>
            <div className="flex flex-wrap gap-2">
              {safeList(profile.target_role).map(r => (
                <span key={r} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Industries */}
        {industries.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-white/30">INDUSTRIES</p>
            <div className="flex flex-wrap gap-2">
              {industries.map(ind => (
                <Badge key={ind} variant="outline" className="text-xs border-white/10 text-white/50">{ind}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-white/30">SKILLS</p>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Role tags (legacy) */}
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

        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <p className="text-[10px] font-bold tracking-widest text-white/30">ABOUT</p>
            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </div>
        )}
      </Card>

      {/* Key achievements */}
      {achievements.length > 0 && (
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[32px] space-y-4">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Award size={16} className="text-emerald-400" /> Key Achievements
          </h2>
          <ul className="space-y-2">
            {achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        </Card>
      )}

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
                  <p className="text-sm text-white/30 font-medium shrink-0">
                    {entry.start}{entry.start && entry.end ? ' – ' : ''}{entry.end}
                  </p>
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

              {entry.description && (
                <p className="text-sm text-white/50 leading-relaxed">{entry.description}</p>
              )}

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
