import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Button,
  Container,
  Card,
  Badge,
  StatGroup,
  Stat,
} from '@blinkdotnew/ui'
import { ShieldCheck, ShieldAlert, Users, Briefcase, DollarSign, Check, X, AlertTriangle, LogOut, Trash2, Settings } from 'lucide-react'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'

export function AdminPage() {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [stats, setStats] = useState({
    listings: 0,
    revenue: '$0',
    candidates: 0,
    pending: 0,
    reports: 0
  })
  const [pendingJobs, setPendingJobs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [liveJobs, setLiveJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('pending')

  const isAuth = typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true'

  useEffect(() => {
    if (!isAuth) {
      navigate({ to: '/admin/login' })
      return
    }

    const loadData = async () => {
      const fetchSafe = async (url: string) => {
        try {
          const r = await fetch(url)
          return r.ok ? r.json() : {}
        } catch { return {} }
      }

      const [adminStats, jobsData] = await Promise.all([
        fetchSafe('/api/admin/stats'),
        fetchSafe('/api/jobs'),
      ])

      const allJobs: any[] = jobsData.jobs || []

      setStats({
        listings: adminStats.liveListings || 0,
        revenue: '$0',
        candidates: adminStats.candidates || 0,
        pending: 0,
        reports: 0,
      })
      setLiveJobs(allJobs)
    }

    loadData()
  }, [isAuth, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate({ to: '/admin/login' })
  }

  const handleRemoveJob = async (id: string) => {
    if (!confirm('Remove this listing?')) return
    const adminPassword = prompt('Admin password:')
    if (!adminPassword) return
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      })
      if (res.ok) {
        setLiveJobs(prev => prev.filter(j => j.id !== id))
        setStats(prev => ({ ...prev, listings: prev.listings - 1 }))
      } else {
        alert('Failed to remove listing.')
      }
    } catch {
      alert('Failed to remove listing.')
    }
  }

  if (!isAuth) return null

  return (
    <Container className="pt-20 pb-12 md:py-24 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none flex items-center gap-6">
            <ShieldCheck className="text-primary" size={64} /> Platform Console
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl leading-relaxed">System overview, listing moderation, and platform performance monitoring.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut size={16} /> Logout
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-bold gap-2"
            onClick={() => setSettingsOpen(o => !o)}
          >
            <Settings size={16} /> System Settings
          </Button>
        </div>
      </div>

      {settingsOpen && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">System Settings</h2>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex justify-between">
              <span>Platform</span><span className="text-white">SalesRoles.co</span>
            </div>
            <div className="flex justify-between">
              <span>Contact</span><span className="text-white">info@salesroles.co</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Listing</span><span className="text-white">$99 / 30 days</span>
            </div>
            <div className="flex justify-between">
              <span>Featured Listing</span><span className="text-white">$249 / 30 days</span>
            </div>
            <div className="flex justify-between">
              <span>Annual Unlimited</span><span className="text-white">$999 / year</span>
            </div>
          </div>
        </div>
      )}

      <div className="h-px bg-border" />

      <StatGroup className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <Stat label="Live Listings" value={stats.listings.toString()} icon={<Briefcase size={20} className="text-primary" />} />
        <Stat label="Total Revenue" value={stats.revenue} icon={<DollarSign size={20} className="text-primary" />} />
        <Stat label="Candidates" value={stats.candidates.toLocaleString()} icon={<Users size={20} className="text-primary" />} />
        <Stat label="Pending Review" value={stats.pending.toString()} icon={<AlertTriangle size={20} className="text-primary" />} />
      </StatGroup>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-card/50 border border-white/5 p-1 rounded-2xl w-full justify-start overflow-x-auto">
        {[
          { key: 'pending', label: `Pending Approval (${stats.pending})` },
          { key: 'jobs', label: `All Live Jobs (${stats.listings})` },
          { key: 'candidates', label: 'Candidates' },
          { key: 'reports', label: `Reports (${stats.reports})`, danger: true },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 rounded-xl font-black text-[10px] whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : tab.danger
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-8">
          {pendingJobs.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No listings pending approval.</p>
            </Card>
          ) : (
            pendingJobs.map((job: any) => (
              <Card key={job.id} className="p-10 border border-white/5 bg-card/30 space-y-10 rounded-[32px] hover:border-primary/20 transition-all duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground border border-white/5 shadow-xl overflow-hidden">
                      <CompanyLogo domain={getDomain(job.company_website, job.company_name || 'company')} name={job.company_name || 'Company'} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight">{job.title}</h3>
                      <p className="text-sm text-muted-foreground font-bold opacity-60">{job.location}</p>
                      <div className="flex gap-4 pt-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{job.featured ? 'Featured ($249)' : 'Standard ($99)'}</Badge>
                        <span className="text-xs font-bold text-foreground">OTE: {job.ote}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" className="bg-primary text-primary-foreground font-bold gap-2">
                      <Check size={16} /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive font-bold gap-2 hover:bg-destructive/10">
                      <X size={16} /> Reject
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-3 text-xs font-bold"><Check size={14} className="text-primary" /> Transparent Compensation</div>
                  <div className="flex items-center gap-3 text-xs font-bold"><Check size={14} className="text-primary" /> No Prohibited Content</div>
                  <div className="flex items-center gap-3 text-xs font-bold"><Check size={14} className="text-primary" /> Verified Company</div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No open reports.</p>
            </Card>
          ) : (
            reports.map((report: any) => (
              <Card key={report.id} className="p-6 border border-destructive/20 bg-destructive/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="text-destructive" />
                  <div>
                    <h4 className="font-bold">{report.reason} Reported</h4>
                    <p className="text-xs text-muted-foreground">Listing ID: {report.jobId} • {report.reporterEmail || 'Anonymous'}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/20 font-bold text-xs">Investigate</Button>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {liveJobs.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No live listings found.</p>
            </Card>
          ) : (
            liveJobs.map((job: any) => (
              <Card key={job.id} className="p-6 border border-white/5 bg-card/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                    <CompanyLogo domain={getDomain(job.company_website, job.company_name || 'company')} name={job.company_name || 'Company'} size={32} />
                  </div>
                  <div>
                    <p className="font-black text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company_name} &bull; {job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {job.featured && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Featured</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive font-bold gap-2 hover:bg-destructive/10 text-xs"
                    onClick={() => handleRemoveJob(job.id)}
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'candidates' && (
        <Card className="p-16 text-center border-dashed border-white/10">
          <p className="text-muted-foreground font-medium">Candidate management coming soon.</p>
        </Card>
      )}
    </Container>
  )
}
