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
import { Briefcase, Eye, MousePointer2, Settings, User, CheckCircle2, Building2, MapPin, Users } from 'lucide-react'
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
    <Container className="pt-20 pb-12 md:py-24 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Dashboard</h1>
          <p className="text-muted-foreground font-medium text-lg">Welcome back, {user.displayName || 'Sales Professional'}.</p>
        </div>
        <div className="flex gap-4">
          {/* FIX 2: no switch button — role comes from user.role */}
          {role === 'company' ? (
            <Link to="/post-job">
              <Button size="sm" className="bg-primary text-primary-foreground font-bold">Post New Job</Button>
            </Link>
          ) : (
            <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) alert(`CV "${file.name}" selected. File upload coming soon.`)
                }}
              />
              Upload CV
            </label>
          )}
        </div>
      </div>

      <Separator className="bg-border" />

      {role === 'company' ? (
        <div className="space-y-12">
          <StatGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Live Jobs" value={String(stats.liveJobs)} icon={<Briefcase size={20} className="text-primary" />} />
            <Stat label="Total Views" value={String(stats.totalViews)} icon={<Eye size={20} className="text-primary" />} />
            <Stat label="Apply Clicks" value={String(stats.applyClicks)} icon={<MousePointer2 size={20} className="text-primary" />} />
            <Stat label="Avg. CTR" value={`${stats.avgCtr}%`} icon={<CheckCircle2 size={20} className="text-primary" />} />
          </StatGroup>

          <Tabs defaultValue="jobs">
            <TabsList className="bg-card border border-border p-1 rounded-xl overflow-x-auto flex-nowrap inline-flex">
              <TabsTrigger value="jobs" className="px-8 font-bold tracking-tight whitespace-nowrap">Active Listings</TabsTrigger>
              <TabsTrigger value="pending" className="px-8 font-bold tracking-tight whitespace-nowrap">Pending Approval {pendingJobs.length > 0 && `(${pendingJobs.length})`}</TabsTrigger>
              <TabsTrigger value="candidates" className="px-8 font-bold tracking-tight whitespace-nowrap" onClick={fetchApplications}>Candidates {applications.length > 0 && `(${applications.length})`}</TabsTrigger>
              <TabsTrigger value="expired" className="px-8 font-bold tracking-tight whitespace-nowrap">Expired / Drafts</TabsTrigger>
              <TabsTrigger value="billing" className="px-8 font-bold tracking-tight whitespace-nowrap">Billing & Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="mt-8 space-y-4">
              <EmptyState
                icon={<Briefcase size={40} />}
                title="No Active Listings"
                description="You haven't posted any job listings yet. Start hiring the top 1% of sales talent today."
                action={{ label: "Post Your First Job", onClick: () => { window.location.href = '/post-job' } }}
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
            </TabsContent>
            <TabsContent value="pending" className="mt-8 space-y-4">
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

            <TabsContent value="candidates" className="mt-8 space-y-4">
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

            <TabsContent value="expired" className="mt-8">
              <EmptyState
                icon={<Building2 size={40} />}
                title="No Expired Listings"
                description="Expired and draft listings will appear here."
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
            </TabsContent>
            <TabsContent value="billing" className="mt-8">
              <EmptyState
                icon={<CheckCircle2 size={40} />}
                title="No Invoices Yet"
                description="Your billing history will appear here after your first job listing purchase."
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-border bg-card/30 space-y-4 col-span-1 rounded-[32px]">
              <div className="space-y-2">
                <h3 className="font-bold tracking-widest text-xs text-muted-foreground">Profile</h3>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-primary" />
                  <span className="text-sm font-medium">{user.displayName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-primary" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-primary" />
                  {/* FIX 8: pass mode=candidate so back button returns to correct view */}
                  <Link to="/dashboard/profile" search={{ mode: 'candidate' } as any} className="text-sm font-bold text-primary hover:underline">Edit Profile</Link>
                </div>
              </div>
            </Card>

            <div className="md:col-span-2 space-y-8">
              <h3 className="text-2xl font-black tracking-tighter">Saved Opportunities</h3>
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
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
