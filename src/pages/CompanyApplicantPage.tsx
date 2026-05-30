import React, { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Container, Card } from '@blinkdotnew/ui'
import { ArrowLeft, MapPin, Link2, Download } from 'lucide-react'

function parseRoles(val: string | null | undefined): string {
  if (!val) return ''
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed.join(', ') : val
  } catch {
    return val
  }
}

export function CompanyApplicantPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { setError('Sign in required'); setLoading(false); return }
    fetch(`/api/company/applicant/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setProfile(data)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load profile'); setLoading(false) })
  }, [id])

  const skills: string[] = (() => {
    if (!profile?.skills) return []
    try {
      const p = JSON.parse(profile.skills)
      return Array.isArray(p) ? p : []
    } catch {
      return (profile.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  })()

  if (loading) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </Container>
    )
  }

  if (error || !profile) {
    return (
      <Container className="py-24 text-center space-y-4">
        <p className="text-muted-foreground">{error || 'Profile not found.'}</p>
        <button
          onClick={() => window.history.back()}
          className="text-primary text-sm font-bold hover:underline flex items-center gap-1.5 mx-auto"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </Container>
    )
  }

  return (
    <Container className="pt-12 pb-24 max-w-3xl mx-auto px-4">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-10"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="space-y-6">
        {/* Profile header */}
        <Card className="p-6 sm:p-8 border border-white/5 bg-card/30 rounded-[32px] space-y-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-xl">
              {(profile.name || '?')[0].toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-black tracking-tight">{profile.name}</h1>
              {profile.headline && (
                <p className="text-emerald-400 font-medium text-sm">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin size={13} /> {profile.location}
                </p>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Link2 size={13} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Stats grid */}
          {(profile.years_experience || profile.target_role || profile.target_salary || profile.availability) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.years_experience && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/40 font-black tracking-widest mb-1">EXPERIENCE</p>
                  <p className="font-black text-sm">{profile.years_experience} yrs</p>
                </div>
              )}
              {profile.target_role && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/40 font-black tracking-widest mb-1">TARGET ROLE</p>
                  <p className="font-black text-xs leading-snug">{parseRoles(profile.target_role)}</p>
                </div>
              )}
              {profile.target_salary && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/40 font-black tracking-widest mb-1">TARGET OTE</p>
                  <p className="font-black text-sm">{profile.target_salary}</p>
                </div>
              )}
              {profile.availability && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/40 font-black tracking-widest mb-1">AVAILABILITY</p>
                  <p className="font-black text-xs leading-snug">{profile.availability}</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 font-black tracking-widest mb-3">SKILLS</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: string) => (
                  <span key={s} className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-[10px] text-white/40 font-black tracking-widest mb-2">ABOUT</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </Card>

        {/* Cover letter */}
        {profile.cover_note && (
          <Card className="p-6 sm:p-8 border border-white/5 bg-card/30 rounded-[32px]">
            <p className="text-[10px] text-white/40 font-black tracking-widest mb-3">COVER LETTER</p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.cover_note}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {profile.cv_filename && (
            <a
              href={`/api/candidates/${id}/download-cv`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-primary-foreground font-black text-xs tracking-widest px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Download size={14} /> Download CV
            </a>
          )}
          {profile.profile_slug && (
            <a
              href={`/profile/${profile.profile_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/10 text-white/60 hover:text-white font-bold text-xs tracking-widest px-6 py-3 rounded-xl transition-colors"
            >
              Full Public Profile →
            </a>
          )}
        </div>
      </div>
    </Container>
  )
}
