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
import { Briefcase, Eye, MousePointer2, Settings, User, CheckCircle2, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Separator = UISeparator as any;
const Tabs = UITabs as any;
const TabsList = UITabsList as any;
const TabsTrigger = UITabsTrigger as any;
const TabsContent = UITabsContent as any;

interface DashboardStats {
  liveJobs: number
  totalViews: number
  applyClicks: number
  avgCtr: number
}

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [role, setRole] = useState<'candidate' | 'company'>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'candidate' ? 'candidate' : 'company'
  })
  const [stats, setStats] = useState<DashboardStats>({ liveJobs: 0, totalViews: 0, applyClicks: 0, avgCtr: 0 })

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
          <Button variant="outline" size="sm" onClick={() => setRole(role === 'candidate' ? 'company' : 'candidate')}>
            Switch to {role === 'candidate' ? 'Company' : 'Candidate'}
          </Button>
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
            <TabsList className="bg-card border border-border p-1 rounded-xl">
              <TabsTrigger value="jobs" className="px-8 font-bold tracking-tight">Active Listings</TabsTrigger>
              <TabsTrigger value="expired" className="px-8 font-bold tracking-tight">Expired / Drafts</TabsTrigger>
              <TabsTrigger value="billing" className="px-8 font-bold tracking-tight">Billing & Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="mt-8 space-y-4">
              <EmptyState
                icon={<Briefcase size={40} />}
                title="No Active Listings"
                description="You haven't posted any job listings yet. Start hiring the top 1% of sales talent today."
                action={{
                  label: "Post Your First Job",
                  onClick: () => { window.location.href = '/post-job' }
                }}
                className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
              />
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
                  <Link to="/dashboard/profile" className="text-sm font-bold text-primary hover:underline">Edit Profile</Link>
                </div>
              </div>
            </Card>

            <div className="md:col-span-2 space-y-8">
              <h3 className="text-2xl font-black tracking-tighter">Saved Opportunities</h3>
              <div className="grid gap-4">
                <EmptyState
                  icon={<Briefcase size={40} />}
                  title="No Saved Opportunities Yet"
                  description="Browse jobs to save roles you like."
                  action={{
                    label: "Browse Jobs",
                    onClick: () => { window.location.href = '/jobs' }
                  }}
                  className="p-16 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
