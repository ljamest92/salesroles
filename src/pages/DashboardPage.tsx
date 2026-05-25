import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
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
import { Briefcase, Eye, MousePointer2, Settings, User, Plus, Clock, CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Separator = UISeparator as any;
const Tabs = UITabs as any;
const TabsList = UITabsList as any;
const TabsTrigger = UITabsTrigger as any;
const TabsContent = UITabsContent as any;

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'candidate' | 'company'>('company') // Demo toggle
  const [hasJobs, setHasJobs] = useState(true) // Demo toggle for empty states
  const [hasSavedJobs, setHasSavedJobs] = useState(true) // Demo toggle

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/register' })
    }
  }, [user, isLoading, navigate])

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

  if (!user) return null

  return (
    <Container className="py-12 md:py-24 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Dashboard</h1>
          <p className="text-muted-foreground font-medium text-lg">Welcome back, {user?.displayName || 'Sales Professional'}.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="sm" onClick={() => { setRole(role === 'candidate' ? 'company' : 'candidate'); setHasJobs(true); setHasSavedJobs(true); }}>
            Switch to {role === 'candidate' ? 'Company' : 'Candidate'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => role === 'company' ? setHasJobs(!hasJobs) : setHasSavedJobs(!hasSavedJobs)}>
            Toggle Empty State
          </Button>
          {role === 'company' ? (
            <Link to="/post-job">
              <Button size="sm" className="bg-primary text-primary-foreground font-bold">Post New Job</Button>
            </Link>
          ) : (
            <Button size="sm" className="bg-primary text-primary-foreground font-bold">Upload CV</Button>
          )}
        </div>
      </div>

      <Separator className="bg-border" />

      {role === 'company' ? (
        <div className="space-y-12">
          <StatGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Live Jobs" value={hasJobs ? "3" : "0"} icon={<Briefcase size={20} className="text-primary" />} />
            <Stat label="Total Views" value={hasJobs ? "2.4k" : "0"} icon={<Eye size={20} className="text-primary" />} />
            <Stat label="Apply Clicks" value={hasJobs ? "184" : "0"} icon={<MousePointer2 size={20} className="text-primary" />} />
            <Stat label="Avg. Ctr" value={hasJobs ? "7.6%" : "0%"} icon={<CheckCircle2 size={20} className="text-primary" />} />
          </StatGroup>

          <Tabs defaultValue="jobs">
            <TabsList className="bg-card border border-border p-1 rounded-xl">
              <TabsTrigger value="jobs" className="px-8 font-bold tracking-tight">Active Listings</TabsTrigger>
              <TabsTrigger value="expired" className="px-8 font-bold tracking-tight">Expired / Drafts</TabsTrigger>
              <TabsTrigger value="billing" className="px-8 font-bold tracking-tight">Billing & Invoices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="mt-8 space-y-4">
              {!hasJobs ? (
                <EmptyState
                  icon={<Briefcase size={40} />}
                  title="No Active Listings"
                  description="You haven't posted any job listings yet. Start hiring the top 1% of sales talent today."
                  action={{
                    label: "Post Your First Job",
                    onClick: () => {} // Link to post job
                  }}
                  className="p-20 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                />
              ) : (
                [1, 2].map(i => (
                  <Card key={i} className="p-6 border border-border bg-card/30 flex flex-col md:flex-row justify-between gap-6 rounded-[24px]">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/50">
                        <Building2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg">Senior Account Executive</h4>
                        <p className="text-xs text-muted-foreground font-bold tracking-wider">Posted 12 Days Ago • Expires In 18 Days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-bold">Views</p>
                        <p className="font-black text-xl">842</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-bold">Applies</p>
                        <p className="font-black text-xl text-primary">64</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-primary">Upgrade</Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="billing" className="mt-8">
              <Card className="border border-border overflow-hidden rounded-[24px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 font-bold tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Job Title</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2].map(i => (
                      <tr key={i} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">May 12, 2024</td>
                        <td className="px-6 py-4 font-medium">Senior Account Executive</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Featured</Badge>
                        </td>
                        <td className="px-6 py-4 font-bold">$249.00</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="link" size="sm" className="text-primary font-bold">PDF</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-border bg-card/30 space-y-4 col-span-1 rounded-[32px]">
              <div className="space-y-2">
                <h3 className="font-bold tracking-widest text-xs text-muted-foreground">Profile Strength</h3>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '85%' }} />
                </div>
                <p className="text-xs font-bold text-right text-primary">85% Complete</p>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-primary" />
                  <span className="text-sm font-medium">Alex Rivera</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-primary" />
                  <span className="text-sm font-medium">Enterprise Ae @ Vercel</span>
                </div>
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-primary" />
                  <Link to="/settings" className="text-sm font-bold text-primary hover:underline">Edit Profile</Link>
                </div>
              </div>
            </Card>

            <div className="md:col-span-2 space-y-8">
              <h3 className="text-2xl font-black tracking-tighter">Saved Opportunities</h3>
              <div className="grid gap-4">
                {!hasSavedJobs ? (
                  <EmptyState
                    icon={<Briefcase size={40} />}
                    title="No Saved Jobs"
                    description="You haven't saved any job listings yet. Explore roles with transparent compensation."
                    action={{
                      label: "Explore Jobs",
                      onClick: () => {} // Link to jobs
                    }}
                    className="p-16 border border-dashed border-white/10 bg-card/20 rounded-[40px]"
                  />
                ) : (
                  [1, 2, 3].map(i => (
                    <Card key={i} className="job-card-hover p-6 border border-border bg-card/30 flex justify-between items-center group rounded-[24px]">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/50">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold group-hover:text-primary transition-colors">Strategic Sales Manager</h4>
                          <p className="text-xs text-muted-foreground font-bold tracking-wider">Salesforce • $250k Ote</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/jobs/job-slug">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10">Apply Now</Button>
                      </div>
                    </Card>
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
