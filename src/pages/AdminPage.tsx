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
  const [users, setUsers] = useState<any[]>([])
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [userSubTab, setUserSubTab] = useState<'candidates' | 'companies'>('candidates')
  const [blinded, setBlinded] = useState(false)

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

      const [adminStats, jobsData, pendingData, usersData] = await Promise.all([
        fetchSafe('/api/admin/stats'),
        fetchSafe('/api/jobs'),
        fetchSafe('/api/admin/pending-jobs'),
        fetchSafe('/api/admin/candidates'),
      ])

      const allJobs: any[] = jobsData.jobs || []
      const pendingList: any[] = Array.isArray(pendingData) ? pendingData : []
      const userList: any[] = Array.isArray(usersData) ? usersData : []

      setStats({
        listings: adminStats.liveListings || 0,
        revenue: '$0',
        candidates: adminStats.candidates || 0,
        pending: pendingList.length,
        reports: 0,
      })
      setLiveJobs(allJobs)
      setPendingJobs(pendingList)
      setUsers(userList)
    }

    loadData()
  }, [isAuth, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate({ to: '/admin/login' })
  }

  const fetchPendingJobs = async () => {
    try {
      const r = await fetch('/api/admin/pending-jobs')
      const data = r.ok ? await r.json() : []
      const list = Array.isArray(data) ? data : []
      setPendingJobs(list)
      setStats(prev => ({ ...prev, pending: list.length }))
    } catch {}
  }

  const fetchUsers = async () => {
    try {
      const r = await fetch('/api/admin/candidates')
      const data = r.ok ? await r.json() : []
      setUsers(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchSubscribers = async () => {
    try {
      const r = await fetch('/api/admin/subscribers')
      const data = r.ok ? await r.json() : []
      setSubscribers(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchLiveJobs = async () => {
    try {
      const r = await fetch('/api/jobs')
      const data = r.ok ? await r.json() : {}
      setLiveJobs(data.jobs || [])
    } catch {}
  }

  const fetchReports = async () => {
    try {
      const r = await fetch('/api/admin/reports')
      const data = r.ok ? await r.json() : []
      setReports(Array.isArray(data) ? data : [])
    } catch {}
  }

  const updateReportStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch {}
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'pending') fetchPendingJobs()
    if (tab === 'users') fetchUsers()
    if (tab === 'subscribers') fetchSubscribers()
    if (tab === 'jobs') fetchLiveJobs()
    if (tab === 'reports') fetchReports()
  }

  const downloadCSV = (type: 'candidates' | 'companies', isBlinded: boolean) => {
    const data = type === 'candidates'
      ? users.filter(u => u.role === 'candidate')
      : users.filter(u => u.role === 'company')
    const headers = type === 'candidates'
      ? ['Name', 'Email', 'Joined']
      : ['Name', 'Email', 'Company', 'Joined']
    const rows = data.map((u, i) => {
      if (type === 'candidates') {
        return [
          isBlinded ? `Candidate ${i + 1}` : u.name,
          isBlinded ? `candidate${i + 1}@hidden.com` : u.email,
          new Date(u.created_at).toLocaleDateString('en-GB'),
        ]
      }
      return [
        isBlinded ? `Company ${i + 1}` : u.name,
        isBlinded ? `company${i + 1}@hidden.com` : u.email,
        isBlinded ? 'Hidden' : (u.company_name || ''),
        new Date(u.created_at).toLocaleDateString('en-GB'),
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-${isBlinded ? 'blinded-' : ''}${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSubscribersCSV = () => {
    const headers = ['Email', 'Subscribed Date']
    const rows = subscribers.map(s => [s.email, new Date(s.created_at).toLocaleDateString('en-GB')])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleApproveJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setPendingJobs(prev => prev.filter(j => j.id !== id))
        setStats(prev => ({ ...prev, pending: prev.pending - 1, listings: prev.listings + 1 }))
      }
    } catch {}
  }

  const handleRejectJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setPendingJobs(prev => prev.filter(j => j.id !== id))
        setStats(prev => ({ ...prev, pending: prev.pending - 1 }))
      }
    } catch {}
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
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12 animate-fade-in">
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
          { key: 'pending', label: `Pending Approval (${pendingJobs.length})` },
          { key: 'jobs', label: `All Live Jobs (${stats.listings})` },
          { key: 'users', label: `Users (${users.length})` },
          { key: 'subscribers', label: `Subscribers (${subscribers.length})` },
          { key: 'reports', label: `Reports (${reports.length})`, danger: true },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
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
                      <p className="text-sm font-bold text-muted-foreground">{job.company_name}</p>
                      <p className="text-sm text-muted-foreground opacity-60">{job.location}</p>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{job.featured ? 'Featured ($249)' : 'Standard ($99)'}</Badge>
                        <span className="text-xs font-bold text-foreground">OTE: {job.ote}</span>
                        <span className="text-xs text-muted-foreground">Submitted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" className="bg-primary text-primary-foreground font-bold gap-2" onClick={() => handleApproveJob(job.id)}>
                      <Check size={16} /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive font-bold gap-2 hover:bg-destructive/10" onClick={() => handleRejectJob(job.id)}>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Reported Listings</h2>
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
              {reports.filter(r => r.status === 'pending').length} pending
            </span>
          </div>
          {reports.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No reports yet.</p>
            </Card>
          ) : (
            reports.map((report: any) => (
              <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        report.status === 'pending'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : report.status === 'reviewed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/10 text-white/40 border-white/10'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-white/30 text-xs">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white font-medium text-sm">{report.job_title || 'Unknown job'}</p>
                    <p className="text-white/50 text-xs">{report.company_name}</p>
                    <p className="text-white/70 text-sm mt-2">
                      <span className="text-white/40">Reason: </span>{report.reason}
                    </p>
                    {report.details && (
                      <p className="text-white/50 text-xs mt-1">{report.details}</p>
                    )}
                    {report.reporter_email && (
                      <p className="text-white/30 text-xs mt-1">Reported by: {report.reporter_email}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={`/jobs/${report.job_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs border border-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-center"
                    >
                      View Job
                    </a>
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewed')}
                          className="text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          className="text-xs border border-white/10 text-white/30 hover:text-white/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
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

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            {(['candidates', 'companies'] as const).map(t => (
              <button
                key={t}
                onClick={() => setUserSubTab(t)}
                className={`px-5 py-2 rounded-xl font-black text-[11px] capitalize transition-all ${userSubTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              >
                {t} ({users.filter(u => t === 'candidates' ? u.role === 'candidate' : u.role === 'company').length})
              </button>
            ))}
          </div>

          {/* Blinded view toggle + downloads */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setBlinded(b => !b)}
                className={`w-10 h-6 rounded-full transition-colors relative ${blinded ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${blinded ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Blinded View (for client presentations)</span>
            </label>
            <button
              onClick={() => downloadCSV('candidates', blinded)}
              className="text-xs font-bold border border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Download Candidates CSV
            </button>
            <button
              onClick={() => downloadCSV('companies', blinded)}
              className="text-xs font-bold border border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Download Companies CSV
            </button>
          </div>

          {/* Table */}
          {(() => {
            const filtered = users.filter(u => userSubTab === 'candidates' ? u.role === 'candidate' : u.role === 'company')
            if (filtered.length === 0) {
              return (
                <Card className="p-16 text-center border-dashed border-white/10">
                  <p className="text-muted-foreground font-medium">No {userSubTab} registered yet.</p>
                </Card>
              )
            }
            return (
              <Card className="p-6 border border-white/5 bg-card/30 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Name</th>
                      <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Email</th>
                      {userSubTab === 'companies' && <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Company</th>}
                      <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((u: any, i: number) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-bold">{blinded ? (userSubTab === 'candidates' ? `Candidate ${i + 1}` : `Company ${i + 1}`) : u.name}</td>
                        <td className="py-4 text-muted-foreground">{blinded ? (userSubTab === 'candidates' ? `candidate${i + 1}@hidden.com` : `company${i + 1}@hidden.com`) : u.email}</td>
                        {userSubTab === 'companies' && <td className="py-4 text-muted-foreground">{blinded ? 'Hidden' : (u.company_name || '—')}</td>}
                        <td className="py-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          })()}
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={downloadSubscribersCSV}
              className="text-xs font-bold border border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Download CSV
            </button>
          </div>
          {subscribers.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No subscribers yet.</p>
            </Card>
          ) : (
            <Card className="p-6 border border-white/5 bg-card/30 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Email</th>
                    <th className="pb-4 font-black text-muted-foreground text-[10px] tracking-widest">Subscribed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscribers.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 font-medium">{s.email}</td>
                      <td className="py-4 text-muted-foreground">{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </Container>
  )
}
