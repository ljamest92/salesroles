import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Container,
  Card,
  Badge,
  StatGroup,
  Stat,
} from '@blinkdotnew/ui'
import { ShieldCheck, ShieldAlert, Users, Briefcase, DollarSign, Eye, Search, Check, X, AlertTriangle, Building2, LogOut } from 'lucide-react'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'

export function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    listings: 0,
    revenue: '$0',
    candidates: 0,
    pending: 0,
    reports: 0
  })
  const [pendingJobs, setPendingJobs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
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

      const [jobsData, candidatesData, paymentsData, reportsData, pendingData] = await Promise.all([
        fetchSafe('/api/jobs?status=live'),
        fetchSafe('/api/candidates'),
        fetchSafe('/api/payments'),
        fetchSafe('/api/reports?status=open'),
        fetchSafe('/api/jobs?status=pending')
      ])

      const allJobs = jobsData.jobs || []
      const allCandidates = candidatesData.candidates || []
      const allPayments = paymentsData.payments || []
      const allReports = reportsData.reports || []
      const pendingList = pendingData.jobs || []

      const totalRevenue = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

      setStats({
        listings: allJobs.length,
        revenue: `$${totalRevenue.toLocaleString()}`,
        candidates: allCandidates.length,
        pending: pendingList.length,
        reports: allReports.length
      })
      setPendingJobs(pendingList)
      setReports(allReports)
    }

    loadData()
  }, [isAuth, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate({ to: '/admin/login' })
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
          <Button size="sm" className="bg-primary text-primary-foreground font-bold">System Settings</Button>
        </div>
      </div>

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
          { key: 'jobs', label: 'All Live Jobs' },
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
                      <CompanyLogo domain={getDomain(job.company_website, job.companyName || 'company')} name={job.companyName || 'Company'} />
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
        <Card className="p-16 text-center border-dashed border-white/10">
          <p className="text-muted-foreground font-medium">Live job management coming soon.</p>
        </Card>
      )}

      {activeTab === 'candidates' && (
        <Card className="p-16 text-center border-dashed border-white/10">
          <p className="text-muted-foreground font-medium">Candidate management coming soon.</p>
        </Card>
      )}
    </Container>
  )
}
