import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Button,
  Container,
  Card,
  Badge,
  Tabs as UITabs,
  TabsList as UITabsList,
  TabsTrigger as UITabsTrigger,
  TabsContent as UITabsContent,
  StatGroup,
  Stat,
  Separator as UISeparator,
  EmptyState
} from '@blinkdotnew/ui'
import { Briefcase, Eye, MousePointer2, Settings, CheckCircle2, Building2, MapPin, Users, Star, Link2, Phone, Globe, TrendingUp, Clock, Lock, Camera } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Separator = UISeparator as any
const Tabs = UITabs as any
const TabsList = UITabsList as any
const TabsTrigger = UITabsTrigger as any
const TabsContent = UITabsContent as any

interface DashboardStats {
  liveJobs: number
  totalViews: number
  applyClicks: number
  avgCtr: number
}

interface SavedJob {
  id: string
  title: string
  company_name: string
  location: string
  ote: string
  base_salary: string
  work_type: string
}

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  // FIX 2: default to candidate; set from user.role or URL param once user loads
  const [role, setRole] = useState<'candidate' | 'company'>('candidate')
  const [stats, setStats] = useState<DashboardStats>({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [pendingJobs, setPendingJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [cvFilename, setCvFilename] = useState('')
  const [profileViews, setProfileViews] = useState<any[]>([])
  const [isPro, setIsPro] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [headline, setHeadline] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileData, setProfileData] = useState<any>(null)
  const [redirectToast, setRedirectToast] = useState<string | null>(null)
  // Company-specific state
  const [liveJobs, setLiveJobs] = useState<any[]>([])
  const [companyProfile, setCompanyProfile] = useState({
    company_name: '', company_website: '', company_logo_url: '',
    company_size: '', company_industry: '', location: '', bio: '',
  })
  const [cpSaving, setCpSaving] = useState(false)
  const [cpToast, setCpToast] = useState<string | null>(null)

  // FIX 2: once user loads, derive role from URL param first, then user.role
  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    if (mode === 'candidate' || mode === 'company') {
      setRole(mode)
    } else {
      setRole(user.role === 'company' ? 'company' : 'candidate')
    }
  }, [user])

  useEffect(() => {
    if (!user || role !== 'company') return
    const token = localStorage.getItem('salesroles_token')
    if (!token) return
    fetch('/api/company/pending-jobs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setPendingJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
    fetch('/api/company/live-jobs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setLiveJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
    fetch('/api/company/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setCompanyProfile({
            company_name: data.company_name || '',
            company_website: data.company_website || '',
            company_logo_url: data.company_logo_url || '',
            company_size: data.company_size || '',
            company_industry: data.company_industry || '',
            location: data.location || '',
            bio: data.bio || '',
          })
        }
      })
      .catch(() => {})
  }, [user, role])

  const fetchApplications = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) return
    try {
      const res = await fetch('/api/company/applications', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setApplications(Array.isArray(data) ? data : [])
    } catch {}
  }

  const downloadCandidatesCSV = () => {
    const headers = ['Name', 'Email', 'Job Title', 'Cover Letter', 'Applied Date']
    const rows = applications.map(a => [
      a.candidate_name || '',
      a.candidate_email || '',
      a.job_title || '',
      (a.cover_note || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      new Date(a.created_at).toLocaleDateString('en-GB')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadBlindedCSV = () => {
    const headers = ['Candidate', 'Job Title', 'Cover Letter', 'Applied Date']
    const rows = applications.map((a, i) => [
      `Candidate ${i + 1}`,
      a.job_title || '',
      (a.cover_note || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      new Date(a.created_at).toLocaleDateString('en-GB')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates-blinded-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCVUpload = async (file: File) => {
    const token = localStorage.getItem('salesroles_token')
    const formData = new FormData()
    formData.append('cv', file)
    try {
      const res = await fetch('/api/candidate/upload-cv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.ok) setCvFilename(data.filename)
    } catch {}
  }

  const handleDeleteCV = async () => {
    const token = localStorage.getItem('salesroles_token')
    await fetch('/api/candidate/delete-cv', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    setCvFilename('')
  }

  const handleAvatarUpload = async (file: File) => {
    const token = localStorage.getItem('salesroles_token')
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await fetch('/api/candidate/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.ok && data.avatar_url) setAvatarUrl(data.avatar_url)
    } catch {}
  }

  const saveCompanyProfile = async () => {
    const token = localStorage.getItem('salesroles_token')
    setCpSaving(true)
    try {
      const res = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(companyProfile),
      })
      const data = await res.json()
      if (data.ok) {
        setCpToast('Company profile saved!')
        setTimeout(() => setCpToast(null), 3000)
      } else {
        setCpToast('Save failed — please try again.')
        setTimeout(() => setCpToast(null), 3000)
      }
    } catch {
      setCpToast('Save failed — please try again.')
      setTimeout(() => setCpToast(null), 3000)
    } finally {
      setCpSaving(false)
    }
  }

  // Load candidate profile data (cv, pro status)
  useEffect(() => {
    if (!user || role !== 'candidate') return
    const token = localStorage.getItem('salesroles_token')
    fetch('/api/candidate/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.cv_filename) setCvFilename(data.cv_filename)
        if (data.is_pro) setIsPro(true)
      })
      .catch(() => {})
  }, [user, role])

  // Load profile views for Pro candidates
  useEffect(() => {
    if (!user || role !== 'candidate' || !isPro) return
    const token = localStorage.getItem('salesroles_token')
    fetch('/api/candidate/profile-views', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProfileViews(data) })
      .catch(() => {})
  }, [user, role, isPro])

  // Show toast from sessionStorage (e.g. redirect from candidate search gate)
  useEffect(() => {
    const msg = sessionStorage.getItem('dashboard_toast')
    if (msg) {
      sessionStorage.removeItem('dashboard_toast')
      // Render as a transient banner — reuse existing toast state pattern
      setRedirectToast(msg)
      setTimeout(() => setRedirectToast(null), 4000)
    }
  }, [])

  // FIX 1: fetch saved jobs for candidate view
  useEffect(() => {
    if (!user || role !== 'candidate') return
    setSavedLoading(true)
    const token = localStorage.getItem('salesroles_token')
    fetch('/api/saved-jobs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (!data.error) setSavedJobs(data.jobs || []) })
      .catch(() => {})
      .finally(() => setSavedLoading(false))
  }, [user, role])

  useEffect(() => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) return
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (!data.error) setStats(data) })
      .catch(() => {})
  }, [])

  // Load full profile from /api/auth/me on mount
  useEffect(() => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) return
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setProfileData(data)
        if (data.name) setProfileName(data.name)
        if (data.cv_filename) setCvFilename(data.cv_filename)
        if (data.headline) setHeadline(data.headline)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        if (data.is_pro) setIsPro(true)
      })
      .catch(() => {})
  }, [])

  if (isLoading) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium text-sm">Loading your dashboard...</p>
        </div>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md p-12 border border-white/5 bg-card/50 backdrop-blur-xl text-center space-y-8 rounded-[40px]">
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tighter">Sign In Required</h2>
            <p className="text-muted-foreground font-medium">Please sign in to access your dashboard.</p>
          </div>
          <div className="flex flex-col gap-4">
            <Link to="/register">
              <Button className="w-full bg-primary text-primary-foreground font-black h-14 cta-glow text-xs tracking-widest">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="w-full font-black h-12 border-white/10 text-xs tracking-widest">
                Create Account
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container className="pt-20 pb-16 md:py-32 md:px-8 space-y-16 animate-fade-in">
      {/* Redirect toast */}
      {redirectToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-xl backdrop-blur-sm">
          {redirectToast}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Dashboard</h1>
          <p className="text-muted-foreground font-medium text-lg">Welcome back, {profileName || user?.displayName || 'there'}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {role === 'company' ? (
            <>
              <Link to="/companies/candidates">
                <Button size="sm" variant="outline" className="font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Browse Candidates</Button>
              </Link>
              <Link to="/post-job">
                <Button size="sm" className="bg-primary text-primary-foreground font-bold">Post New Job</Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <Separator className="bg-border" />

      {role === 'company' ? (
        <div className="space-y-16">
          <StatGroup className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat label="Live Jobs" value={String(stats.liveJobs)} icon={<Briefcase size={20} className="text-primary" />} />
            <Stat label="Total Views" value={String(stats.totalViews)} icon={<Eye size={20} className="text-primary" />} />
            <Stat label="Apply Clicks" value={String(stats.applyClicks)} icon={<MousePointer2 size={20} className="text-primary" />} />
            <Stat label="Avg. CTR" value={`${stats.avgCtr}%`} icon={<CheckCircle2 size={20} className="text-primary" />} />
          </StatGroup>

          {/* Company profile save toast */}
          {cpToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-emerald-600/90 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-xl backdrop-blur-sm">
              {cpToast}
            </div>
          )}

          <Tabs defaultValue="jobs">
            <TabsList className="bg-card border border-border p-2 rounded-xl inline-flex flex-wrap gap-1">
              <TabsTrigger value="jobs" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap">Active Listings</TabsTrigger>
              <TabsTrigger value="pending" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap">Pending {pendingJobs.length > 0 && `(${pendingJobs.length})`}</TabsTrigger>
              <TabsTrigger value="candidates" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap" onClick={fetchApplications}>Candidates {applications.length > 0 && `(${applications.length})`}</TabsTrigger>
              <TabsTrigger value="expired" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap">Expired</TabsTrigger>
              <TabsTrigger value="billing" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap">Billing</TabsTrigger>
              <TabsTrigger value="settings" className="px-6 py-2.5 font-bold tracking-tight text-sm whitespace-nowrap">Company Profile</TabsTrigger>
            </TabsList>

            {/* Active Listings */}
            <TabsContent value="jobs" className="mt-10 space-y-4">
              {liveJobs.length === 0 ? (
                <div className="p-16 border border-dashed border-white/10 bg-card/20 rounded-[40px] flex flex-col items-center text-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Briefcase size={28} className="text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter">You haven't posted any jobs yet</h3>
                    <p className="text-muted-foreground font-medium max-w-sm">Post your first listing to start reaching the top 1% of sales talent — with full compensation transparency.</p>
                  </div>
                  <Link to="/post-job">
                    <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs tracking-widest px-8 py-3.5 rounded-xl transition-colors">
                      Post Your First Job →
                    </button>
                  </Link>
                </div>
              ) : (
                liveJobs.map((job: any) => (
                  <Card key={job.id} className="p-6 border border-white/5 bg-card/30 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.company_name} · {job.location}</p>
                        <p className="text-xs text-muted-foreground">
                          Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {job.expires_at && ` · Expires ${new Date(job.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Live</span>
                        <Link to={`/jobs/${job.id}`}>
                          <button className="text-xs border border-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-colors">View →</button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Pending */}
            <TabsContent value="pending" className="mt-10 space-y-4">
              {pendingJobs.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-white/40 font-medium">No listings pending review.</p>
                </div>
              ) : (
                pendingJobs.map((job: any) => (
                  <Card key={job.id} className="p-6 border border-white/5 bg-card/30 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Awaiting Review
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Candidates */}
            <TabsContent value="candidates" className="mt-10 space-y-4">
              {applications.length === 0 ? (
                <EmptyState
                  icon={<Users size={40} />}
                  title="No Applications Yet"
                  description="No applications yet. Share your job listing to start receiving candidates."
                  className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              ) : (
                <>
                  <div className="flex gap-3 mb-4">
                    <button onClick={downloadCandidatesCSV} className="border border-white/20 text-white/60 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Download CSV
                    </button>
                    <button onClick={downloadBlindedCSV} className="border border-white/20 text-white/60 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Download Blinded CSV
                    </button>
                  </div>
                  {applications.map((a: any) => (
                    <Card key={a.id} className="p-6 border border-white/5 bg-card/30 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{a.candidate_name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${a.status === 'new' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                              {a.status === 'new' ? 'New' : 'Reviewed'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{a.candidate_email}</p>
                          <p className="text-xs text-muted-foreground">Applied for <span className="font-bold text-foreground">{a.job_title}</span></p>
                          {a.cover_note && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {expandedNotes.has(a.id) ? a.cover_note : a.cover_note.slice(0, 100)}
                              {a.cover_note.length > 100 && (
                                <button
                                  onClick={() => setExpandedNotes(prev => {
                                    const next = new Set(prev)
                                    next.has(a.id) ? next.delete(a.id) : next.add(a.id)
                                    return next
                                  })}
                                  className="ml-1 text-primary text-xs font-bold"
                                >
                                  {expandedNotes.has(a.id) ? 'Show less' : '...more'}
                                </button>
                              )}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>

            {/* Expired */}
            <TabsContent value="expired" className="mt-10">
              <EmptyState
                icon={<Building2 size={40} />}
                title="No Expired Listings"
                description="Expired and draft listings will appear here."
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
            </TabsContent>

            {/* Billing */}
            <TabsContent value="billing" className="mt-10">
              <EmptyState
                icon={<CheckCircle2 size={40} />}
                title="No Invoices Yet"
                description="Your billing history will appear here after your first job listing purchase."
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
            </TabsContent>

            {/* Company Profile */}
            <TabsContent value="settings" className="mt-10">
              <Card className="border border-white/5 bg-card/30 rounded-2xl p-8 max-w-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-black tracking-tighter">Company Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">This information appears on your job listings and company profile page.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Company Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">COMPANY NAME</label>
                    <input
                      type="text"
                      value={companyProfile.company_name}
                      onChange={e => setCompanyProfile(p => ({ ...p, company_name: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">WEBSITE URL</label>
                    <input
                      type="url"
                      value={companyProfile.company_website}
                      onChange={e => setCompanyProfile(p => ({ ...p, company_website: e.target.value }))}
                      placeholder="https://yourcompany.com"
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Logo URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">LOGO URL</label>
                    <input
                      type="url"
                      value={companyProfile.company_logo_url}
                      onChange={e => setCompanyProfile(p => ({ ...p, company_logo_url: e.target.value }))}
                      placeholder="https://yourcompany.com/logo.png"
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">COMPANY SIZE</label>
                    <select
                      value={companyProfile.company_size}
                      onChange={e => setCompanyProfile(p => ({ ...p, company_size: e.target.value }))}
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="">Select size...</option>
                      {['1–10', '11–50', '51–200', '201–1,000', '1,000–5,000', '5,000+'].map(s => (
                        <option key={s} value={s}>{s} employees</option>
                      ))}
                    </select>
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">INDUSTRY</label>
                    <select
                      value={companyProfile.company_industry}
                      onChange={e => setCompanyProfile(p => ({ ...p, company_industry: e.target.value }))}
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="">Select industry...</option>
                      {['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'HR Tech', 'MarTech', 'Cybersecurity', 'Enterprise Software', 'E-commerce', 'Logistics', 'Real Estate Tech', 'InsurTech', 'Consulting', 'Media', 'Other'].map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">HEADQUARTERS LOCATION</label>
                    <input
                      type="text"
                      value={companyProfile.location}
                      onChange={e => setCompanyProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="London, UK"
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40">SHORT DESCRIPTION</label>
                    <textarea
                      value={companyProfile.bio}
                      onChange={e => setCompanyProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="A brief description of your company, mission, and culture..."
                      rows={4}
                      className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={saveCompanyProfile}
                  disabled={cpSaving}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black text-xs tracking-widest px-8 py-3.5 rounded-xl transition-colors"
                >
                  {cpSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Premium Profile Card */}
            <Card className="border-border bg-card/30 col-span-1 rounded-[32px] overflow-hidden">
              {/* Header gradient */}
              <div className="h-20 bg-gradient-to-br from-emerald-900/60 to-emerald-600/20 relative">
                {isPro && (
                  <span className="absolute top-3 right-3 text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold tracking-widest">PRO</span>
                )}
              </div>

              {/* Avatar */}
              <div className="px-6 -mt-10 mb-4">
                <label className="cursor-pointer group/avatar block w-20 h-20">
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }} />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                    {avatarUrl ? (
                      <img src={`/uploads/avatars/${avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-2xl">{(profileName || user?.displayName || '?')[0]?.toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                </label>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {/* Name + headline */}
                <div>
                  <h3 className="text-lg font-black tracking-tight">{profileName || user?.displayName}</h3>
                  {headline && <p className="text-sm text-emerald-400 font-medium mt-0.5">{headline}</p>}
                  {profileData?.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={12} /> {profileData.location}</p>
                  )}
                  {profileData?.availability && (profileData.availability === 'Actively looking' || profileData.availability === 'Open to opportunities') ? (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold mt-2 ${
                      profileData.availability === 'Actively looking'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        profileData.availability === 'Actively looking' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
                      }`} />
                      {profileData.availability}
                    </div>
                  ) : (
                    <Link to="/dashboard/profile" search={{ mode: 'candidate' } as any}>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-dashed border-white/20 text-white/30 hover:text-white/50 text-[10px] mt-2 transition-colors cursor-pointer">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        Set your availability
                      </div>
                    </Link>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* Career details */}
                <div className="space-y-2.5 text-sm">
                  {profileData?.target_role && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp size={14} className="text-primary shrink-0" />
                      <span className="truncate">Target: <span className="text-foreground font-medium">{profileData.target_role}</span></span>
                    </div>
                  )}
                  {profileData?.years_experience && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase size={14} className="text-primary shrink-0" />
                      <span>{profileData.years_experience} yrs experience</span>
                    </div>
                  )}
                  {profileData?.target_salary && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe size={14} className="text-primary shrink-0" />
                      <span>Target OTE: <span className="text-foreground font-medium">{profileData.target_salary}</span></span>
                    </div>
                  )}
                  {profileData?.availability && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={14} className="text-primary shrink-0" />
                      <span>{profileData.availability}</span>
                    </div>
                  )}
                  {profileData?.linkedin_url && (
                    <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Link2 size={14} className="text-primary shrink-0" />
                      <span className="truncate">LinkedIn</span>
                    </a>
                  )}
                  {profileData?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {profileData?.skills?.length > 0 && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-muted-foreground mb-2">SKILLS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(profileData.skills as string[]).slice(0, 6).map((s: string) => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="bg-border" />

                {/* Profile completeness */}
                {(() => {
                  const fields = ['headline', 'location', 'target_role', 'years_experience', 'skills', 'target_salary', 'availability', 'bio', 'linkedin_url']
                  const filled = fields.filter(f => {
                    const v = profileData?.[f]
                    return v && (Array.isArray(v) ? v.length > 0 : true)
                  }).length
                  const pct = Math.round((filled / fields.length) * 100)
                  return (
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1.5">
                        <span className="text-muted-foreground">PROFILE STRENGTH</span>
                        <span className="text-primary">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })()}

                {/* CV */}
                {cvFilename && (
                  <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-white/60 truncate">{cvFilename}</span>
                    <button onClick={handleDeleteCV} className="text-red-400/60 hover:text-red-400 text-xs shrink-0 transition-colors">Remove</button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  <Link to="/dashboard/profile" search={{ mode: 'candidate' } as any}>
                    <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs tracking-widest rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <Settings size={14} /> Edit Profile
                    </button>
                  </Link>
                  <label className="cursor-pointer w-full py-2 border border-white/10 text-white/60 hover:text-white font-bold text-xs tracking-widest rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCVUpload(f) }} />
                    {cvFilename ? 'Change CV' : 'Upload CV'}
                  </label>
                </div>
              </div>
            </Card>

            <div className="md:col-span-2 space-y-8">
              <Tabs defaultValue="saved">
                <TabsList className="bg-card border border-border p-1 rounded-xl inline-flex">
                  <TabsTrigger value="saved" className="px-6 font-bold tracking-tight whitespace-nowrap">Saved Jobs</TabsTrigger>
                  <TabsTrigger value="pro" className="px-6 font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5">
                    <Star size={12} className="text-emerald-400" /> Pro
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="saved" className="mt-6">
                  <div className="grid gap-4">
                    {savedLoading ? (
                      Array(2).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 h-24 animate-pulse bg-card/20 rounded-2xl" />
                      ))
                    ) : savedJobs.length === 0 ? (
                      <EmptyState
                        icon={<Briefcase size={40} />}
                        title="No Saved Opportunities Yet"
                        description="Browse jobs and click Save to add roles here."
                        action={{ label: "Browse Jobs", onClick: () => { window.location.href = '/jobs' } }}
                        className="p-16 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                      />
                    ) : (
                      savedJobs.map(job => (
                        <Link key={job.id} to={`/jobs/${job.id}`}>
                          <Card className="job-card-hover p-6 border border-white/5 group rounded-2xl">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-bold group-hover:text-primary transition-colors">{job.title}</h4>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-medium">
                                  <span className="flex items-center gap-1"><Briefcase size={12} className="text-primary" /> {job.company_name}</span>
                                  <span className="flex items-center gap-1"><MapPin size={12} className="text-primary" /> {job.location}</span>
                                  <Badge variant="outline" className="text-[10px] border-white/10">{job.work_type}</Badge>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs text-muted-foreground font-bold">OTE</p>
                                <p className="font-black text-primary">{job.ote || '—'}</p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pro" className="mt-6">
                  {isPro ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-emerald-400" />
                        <h3 className="text-base font-black tracking-tight text-emerald-400">Who Viewed Your Profile</h3>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
                      </div>
                      {profileViews.length === 0 ? (
                        <p className="text-white/40 text-sm p-8 text-center border border-dashed border-white/10 rounded-xl">No profile views yet. Make your profile public to start appearing in company searches.</p>
                      ) : (
                        profileViews.map((v: any, i: number) => {
                          const displayName = v.viewer_name || v.viewer_company || 'A company'
                          const initial = displayName.charAt(0).toUpperCase()
                          return (
                            <Card key={i} className="p-4 border border-white/5 bg-card/30 rounded-xl">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#0f1629] border border-white/10 flex items-center justify-center shrink-0 text-sm font-black text-emerald-400">
                                    {initial}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold leading-tight">{displayName}</p>
                                    <p className="text-xs text-white/40 mt-0.5">{v.action === 'cv_download' ? 'Downloaded your CV' : 'Viewed your profile'}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-white/30 shrink-0">{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                              </div>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Locked teaser */}
                      <div className="border border-white/10 rounded-xl p-6 bg-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                          <Eye size={16} className="text-white/30" />
                          <h3 className="text-white/30 font-bold text-sm">Who Viewed Your Profile</h3>
                          <span className="text-[10px] bg-white/5 text-white/30 border border-white/10 px-2 py-0.5 rounded-full">PRO</span>
                        </div>
                        <div className="space-y-3 blur-sm pointer-events-none select-none" aria-hidden>
                          {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                <div className={`h-3 bg-white/10 rounded w-${i === 1 ? '28' : i === 2 ? '36' : '24'}`} />
                              </div>
                              <div className="h-3 w-12 bg-white/10 rounded" />
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 gap-3">
                          <Star size={20} className="text-emerald-400" />
                          <p className="text-white/70 text-sm font-medium text-center px-4">Upgrade to Pro to see who's viewing your profile</p>
                          <a
                            href={`/api/payments/pro-checkout?token=${localStorage.getItem('salesroles_token') || ''}`}
                            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            Upgrade to Pro — $49/month
                          </a>
                        </div>
                      </div>
                      {/* Benefits list */}
                      <div className="bg-white/5 border border-emerald-500/20 rounded-xl p-5">
                        <h4 className="text-sm font-bold mb-3 text-emerald-400">Pro includes</h4>
                        <ul className="space-y-2">
                          {['See who viewed your profile', 'See who downloaded your CV', 'Pro badge in search results', 'Priority placement in candidate search'].map(b => (
                            <li key={b} className="flex items-center gap-2 text-sm text-white/60">
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />{b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
