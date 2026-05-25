import React, { useState, useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Button, Container, Card, Badge, toast, Toaster, Skeleton } from '@blinkdotnew/ui'
import { MapPin, Briefcase, DollarSign, Calendar, Share2, ShieldAlert, CheckCircle, ArrowLeft, Building2, Check, ChevronRight } from 'lucide-react'
import { ReportModal } from '../components/ReportModal'
import { blink } from '../lib/blink'
import { fetchPartnerJobs, type Job } from '../lib/jobs'

export function JobDetailPage() {
  const { slug } = useParams({ from: '/jobs/$slug' })
  const [job, setJob] = useState<Job | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const getFallbackLogo = (name: string) => {
    const letter = name.charAt(0).toUpperCase()
    return `https://ui-avatars.com/api/?name=${letter}&background=0D0D0D&color=10B981&size=128&font-size=0.5&bold=true`
  }

  const getDomainFromCompany = (company: string) => {
    return company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  }

  useEffect(() => {
    const loadJob = async () => {
      try {
        const [pJobs, dbJobs] = await Promise.all([
          fetchPartnerJobs(),
          blink.db.jobs.list({ where: { id: slug } })
        ])

        let foundJob = dbJobs[0]

        if (!foundJob) {
          foundJob = pJobs.find(j => j.id === slug)
        } else {
          foundJob = {
            ...foundJob,
            company: (foundJob as any).companyName || foundJob.company,
            is_partner: false
          }
        }

        setJob(foundJob || null)

        // Related jobs: 3 different jobs, deduplicated by id, excluding current
        const allJobs = [...dbJobs.map((j: any) => ({ ...j, company: j.companyName || j.company })), ...pJobs]
        const seen = new Set<string>()
        const related = allJobs
          .filter(j => {
            if (j.id === slug || seen.has(j.id)) return false
            seen.add(j.id)
            return true
          })
          .slice(0, 3)
        setRelatedJobs(related)

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading job:', error)
        setIsLoading(false)
      }
    }

    loadJob()
  }, [slug])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setIsSubscribed(true)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // Fallback for non-HTTPS or restricted contexts
      const ta = document.createElement('textarea')
      ta.value = window.location.href
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <Container className="py-12 space-y-12">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <aside className="lg:w-96">
            <Skeleton className="h-[600px] w-full" />
          </aside>
        </div>
      </Container>
    )
  }

  if (!job) {
    return (
      <Container className="py-24 text-center space-y-8">
        <h1 className="text-4xl font-black">Job Not Found</h1>
        <p className="text-muted-foreground">The job you are looking for might have been removed or is no longer available.</p>
        <Link to="/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </Container>
    )
  }

  const applyUrl = job.application_url

  return (
    <Container className="py-12 space-y-12 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
        <ChevronRight size={14} />
        <Link to="/jobs" className="hover:text-primary transition-colors font-medium">Jobs</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-bold truncate max-w-[200px]">{job.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main Content */}
        <div className="flex-1 space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex gap-6">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-2xl overflow-hidden relative">
                  <img
                    src={job.logo_url || `https://logo.clearbit.com/${getDomainFromCompany(job.company)}`}
                    alt={job.company}
                    className="w-full h-full object-cover grayscale transition-all duration-700"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackLogo(job.company)
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-[0.9]">{job.title}</h1>
                    {job.featured && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px]">Featured</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-6 text-muted-foreground font-bold text-sm">
                    <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-foreground hover:text-primary transition-colors">{job.company}</Link>
                    <span className="flex items-center gap-2"><MapPin size={18} className="text-primary" /> {job.location}</span>
                    <span className="flex items-center gap-2"><Briefcase size={18} className="text-primary" /> {job.sector}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto relative z-10">
                <Button onClick={handleShare} variant="outline" className="flex-1 md:flex-none gap-2.5 font-bold text-xs h-12 border-white/10 hover:bg-white/5 transition-all">
                  <Share2 size={16} /> {copied ? 'Copied!' : 'Share'}
                </Button>
                <Button onClick={() => setIsReportModalOpen(true)} variant="outline" className="flex-1 md:flex-none gap-2.5 font-bold text-xs h-12 text-destructive border-destructive/20 hover:bg-destructive/10">
                  <ShieldAlert size={16} /> Report
                </Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Base Salary</p>
                <p className="text-2xl font-black">{job.base_salary}</p>
              </div>
              <div className="space-y-1 text-primary">
                <p className="text-xs font-bold text-muted-foreground">Ote Range</p>
                <p className="text-2xl font-black">{job.ote}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Posted</p>
                <p className="text-2xl font-black">{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Currency</p>
                <p className="text-2xl font-black">{job.currency}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-black tracking-tighter mb-6">Job Description</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: job.description }} />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter">Compensation & Benefits</h2>
            <Card className="p-8 border-primary/20 bg-primary/5 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground">Compensation Details</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Base Salary</span>
                      <span className="font-bold">{job.base_salary}</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">On-Target Earnings (OTE)</span>
                      <span className="font-bold text-primary">{job.ote}</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Commission Structure</span>
                      <span className="font-bold">{job.commission_structure}</span>
                    </li>
                    {job.quota && (
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Quota</span>
                        <span className="font-bold">{job.quota}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground">Perks & Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {(job.perks || ['Health Insurance', '401k Match', 'Unlimited PTO', 'Remote Stipend', 'Parental Leave']).map(perk => (
                      <Badge key={perk} variant="secondary" className="bg-secondary/50 text-foreground">{perk}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-96 space-y-8">
          <Card className="p-8 border border-white/5 bg-card/50 backdrop-blur-xl sticky top-32 space-y-10 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700" />

            <div className="relative z-10 space-y-4">
              {applyUrl ? (
                <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-primary text-primary-foreground font-black py-8 text-xl tracking-tighter cta-glow">Apply Now</Button>
                </a>
              ) : (
                <Button disabled className="w-full font-black py-8 text-xl tracking-tighter opacity-50 cursor-not-allowed">Application Link Not Available</Button>
              )}
              <Button variant="ghost" className="w-full gap-2 font-bold text-muted-foreground hover:text-primary py-4 text-xs">
                Save This Opportunity
              </Button>
            </div>

            <div className="h-px bg-white/5" />

            <div className="relative z-10 space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground/50">Company Profile</h4>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-white/5 shadow-lg overflow-hidden">
                  <img
                    src={job.logo_url || `https://logo.clearbit.com/${getDomainFromCompany(job.company)}`}
                    alt={job.company}
                    className="w-full h-full object-cover grayscale transition-all duration-700"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackLogo(job.company)
                    }}
                  />
                </div>
                <div>
                  <p className="font-bold text-lg">{job.company}</p>
                  <p className="text-[10px] text-muted-foreground font-bold">{job.sector}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.company_description || `${job.company} is a leading company in the ${job.sector} sector, looking for top-tier talent to join their mission-driven team.`}</p>
              <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`}>
                <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs group/link">
                  View Full Profile <span className="inline-block transition-transform group-hover/link:translate-x-1 ml-1">→</span>
                </Button>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-muted-foreground/50">Stay Updated</h4>
                <p className="text-xs text-muted-foreground font-medium">Get alerted to roles like this directly in your inbox.</p>
              </div>

              {isSubscribed ? (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <Check size={16} />
                  </div>
                  <p className="text-xs font-bold text-primary">Subscription Active. We'll alert you Monday morning.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                  <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-black text-xs h-14 cta-glow">Alert Me</Button>
                </form>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Related Jobs */}
      <section className="pt-24 space-y-12">
        <h2 className="text-3xl font-black tracking-tighter">Related Opportunities</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedJobs.length > 0 ? relatedJobs.map(relJob => (
            <Link key={relJob.id} to={`/jobs/${relJob.id}`}>
              <Card className="job-card-hover p-6 border border-border group space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground border border-border/50 overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${getDomainFromCompany(relJob.company)}`}
                      alt={relJob.company}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = getFallbackLogo(relJob.company) }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-1">{relJob.title}</h4>
                    <p className="text-xs text-muted-foreground">{relJob.company} • {relJob.location}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs font-bold block">OTE</span>
                    <span className="font-black">{relJob.ote}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary p-0 h-auto">View →</Button>
                </div>
              </Card>
            </Link>
          )) : [1,2,3].map(i => (
            <Card key={i} className="job-card-hover p-6 border border-border group space-y-4 opacity-40">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-20 bg-secondary rounded animate-pulse mt-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <ReportModal
        jobId={slug}
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
      />
      <Toaster />
    </Container>
  )
}
