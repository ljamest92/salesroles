import React, { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { Container, Card, Badge, Skeleton } from '@blinkdotnew/ui'
import { MapPin, Briefcase, Share2, ShieldAlert, CheckCircle, ArrowLeft, Building2, Check, ChevronRight, Bookmark, BookmarkCheck, BookmarkX, XCircle, Loader2 } from 'lucide-react'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { formatSalary, getCurrency } from '../utils/formatSalary'
import { getDomain } from '../utils/getDomain'
import { useAuth } from '../hooks/useAuth'

function sanitizeDescription(html: string): string {
  return html.replace(/\s*style="[^"]*"/gi, '')
}

const LOGO_BLOCKLIST = new Set(['adzuna.com', 'remotive.com', 'linkedin.com', 'indeed.com'])

function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

export function JobDetailPage() {
  const { slug } = useParams({ from: '/jobs/$slug' })
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Save state
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Apply modal
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState('')

  // Report modal
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const loadJob = async () => {
      try {
        const pJobs = await fetchPartnerJobs()

        let dbJob: Job | null = null
        try {
          const res = await fetch(`/api/jobs/${slug}`)
          if (res.ok) {
            const data = await res.json()
            if (data.job) {
              dbJob = {
                ...data.job,
                company: data.job.companyName || data.job.company,
                is_partner: ['adzuna', 'remotive'].includes(data.job.source || '')
              }
            }
          }
        } catch {}

        const foundJob = dbJob || pJobs.find(j => j.id === slug) || null
        setJob(foundJob)

        const pool = dbJob ? [dbJob, ...pJobs] : pJobs
        const related = pool.filter(j => j.id !== slug).slice(0, 3)
        setRelatedJobs(related)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading job:', error)
        setIsLoading(false)
      }
    }
    loadJob()
  }, [slug])

  // Record view once — ref guard prevents React StrictMode double-fire
  const viewRecorded = useRef(false)
  useEffect(() => {
    if (!slug) return
    if (viewRecorded.current) return
    viewRecorded.current = true
    fetch(`/api/jobs/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  // Check saved status on load
  useEffect(() => {
    const token = localStorage.getItem('salesroles_token')
    if (!token || !slug) return
    fetch(`/api/jobs/${slug}/saved-status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.saved) setIsSaved(true) })
      .catch(() => {})
  }, [slug])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setIsSubscribed(true)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
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

  const handleSaveJob = async () => {
    if (!user) {
      showToast('Sign in to save this job', 'error')
      return
    }
    setIsSaving(true)
    try {
      const token = localStorage.getItem('salesroles_token')
      const res = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: slug }),
      })
      if (res.ok) {
        setIsSaved(true)
        showToast('Opportunity saved to your dashboard')
      } else {
        showToast('Could not save. Are you logged in?', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnsaveJob = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('salesroles_token')
      const res = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: slug }),
      })
      if (res.ok) {
        setIsSaved(false)
        showToast('Removed from saved jobs')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyClick = () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) {
      navigate({ to: '/register', search: { role: 'candidate', redirect: window.location.pathname } as any })
      return
    }
    setApplyModalOpen(true)
  }

  const handleApply = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { navigate({ to: '/register' }); return }
    setApplyError('')
    try {
      const fd = new FormData()
      fd.append('jobId', job?.id || '')
      fd.append('coverLetter', coverLetter)
      fd.append('answers', JSON.stringify(answers))
      if (cvFile) fd.append('cv', cvFile)

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (data.ok) {
        setApplied(true)
        setApplyModalOpen(false)
        showToast('Application submitted successfully')
      } else {
        setApplyError(data.error || 'Application failed. Please try again.')
      }
    } catch {
      setApplyError('Application failed. Please try again.')
    }
  }

  const handleReport = async () => {
    if (!reportReason) return
    setReportSubmitting(true)
    try {
      const token = localStorage.getItem('salesroles_token')
      await fetch(`/api/jobs/${slug}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: reportReason, details: reportDetails })
      })
      setReportOpen(false)
      setReportReason('')
      setReportDetails('')
      showToast('Report submitted. Thank you for helping keep the board clean.')
    } catch {
      showToast('Could not submit report. Please try again.', 'error')
    } finally {
      setReportSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12">
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
          <button className="border border-white/20 text-white/70 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Back to Jobs</button>
        </Link>
      </Container>
    )
  }

  const applyUrl = job.application_url
  const isExternal = !!(job.via_partner || job.is_partner)
  const externalApplyUrl = (job as any).url || job.application_url || ''

  const companyDomain = (() => {
    const canonical = getDomain(job.company_website || job.domain, job.company)
    if (canonical) return canonical
    const raw = getDomainFromUrl((job as any).redirect_url || (job as any).company_url || '')
    return raw && !LOGO_BLOCKLIST.has(raw) ? raw : ''
  })()

  const jobMetaTitle = `${job.title} at ${job.company} | SalesRoles.co`
  const jobMetaDescription = `${job.title} at ${job.company} — ${job.location}. Salary shown upfront. No hidden comp. Apply on SalesRoles.co.`

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12 animate-fade-in overflow-x-hidden">
      <Helmet>
        <title>{jobMetaTitle}</title>
        <meta name="description" content={jobMetaDescription} />
        <meta property="og:title" content={jobMetaTitle} />
        <meta property="og:description" content={jobMetaDescription} />
        <meta property="og:url" content={`https://salesroles.co/jobs/${job.id}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://salesroles.co/logo.svg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={jobMetaTitle} />
        <meta name="twitter:description" content={jobMetaDescription} />
        <meta name="twitter:image" content="https://salesroles.co/logo.svg" />
      </Helmet>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
        <ChevronRight size={14} />
        <Link to="/jobs" className="hover:text-primary transition-colors font-medium">Jobs</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-bold truncate max-w-[200px]">{job.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Main Content */}
        <div className="flex-1 space-y-12 min-w-0">
          <div className="space-y-4">
            {/* Row 1: Logo + company meta */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-2xl overflow-hidden relative">
                <CompanyLogo domain={companyDomain} name={job.company} uploadedLogoUrl={(job as any).company_logo_url} />
              </div>
              <div className="flex flex-wrap gap-3 md:gap-6 text-muted-foreground font-bold text-sm items-center">
                <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-foreground hover:text-primary transition-colors">{job.company}</Link>
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-400" /> {job.location}</span>
                {job.sector && job.sector !== 'null' && (
                  <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-emerald-400" /> {job.sector}</span>
                )}
              </div>
            </div>

            {/* Row 2: Title + share/report */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-5xl font-black tracking-tighter leading-[0.9]">{job.title}</h1>
                {job.featured && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black px-3 py-1 text-[10px]">Featured</Badge>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleShare} className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <button onClick={() => setReportOpen(true)} className="flex items-center gap-2 border border-red-500/30 text-red-400/70 hover:text-red-400 hover:border-red-500/50 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">
                  <ShieldAlert className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {(job.via_partner || job.is_partner) && !job.base_salary && !job.ote ? (
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-1 col-span-2">
                <p className="text-xs font-bold text-muted-foreground">Compensation</p>
                <span className="text-white/40 text-sm">Salary not disclosed</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Posted</p>
                <p className="text-xl md:text-2xl font-black">{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Type</p>
                <p className="text-xl md:text-2xl font-black">{job.job_type}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Base Salary</p>
                <p className="text-xl md:text-2xl font-black">{formatSalary(job.base_salary)}</p>
              </div>
              <div className="space-y-1 text-emerald-400">
                <p className="text-xs font-bold text-muted-foreground">OTE Range</p>
                <p className="text-xl md:text-2xl font-black">{formatSalary(job.ote)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Posted</p>
                <p className="text-xl md:text-2xl font-black">{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Currency</p>
                <p className="text-xl md:text-2xl font-black">{getCurrency(job.base_salary || job.salary || job.salary_min || '', job.location || job.country || '')}</p>
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-black tracking-tighter mb-6">Job Description</h2>
            <div
              className="text-muted-foreground leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: (job as any).source === 'remotive' ? sanitizeDescription(job.description) : job.description }}
            />
          </div>

          {!((job.via_partner || job.is_partner) && !job.base_salary && !job.ote) && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tighter">Compensation & Benefits</h2>
              <Card className="p-8 border-emerald-500/20 bg-emerald-500/5 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground">Compensation Details</h4>
                  {/* Partner job salary display only - do not apply to company-posted jobs */}
                  {(job.via_partner || job.is_partner) && (!job.base_salary || job.base_salary === job.ote) ? (
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Salary Range</span>
                        <span className="font-bold">{formatSalary(job.base_salary || job.ote)}</span>
                      </li>
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Commission Structure</span>
                        <span className="font-bold">{job.commission_structure}</span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Base Salary</span>
                        <span className="font-bold">{formatSalary(job.base_salary)}</span>
                      </li>
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">On-Target Earnings (OTE)</span>
                        <span className="font-bold text-emerald-400">{formatSalary(job.ote)}</span>
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
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-96 space-y-8">
          <Card className="p-8 border border-white/5 bg-card/50 backdrop-blur-xl lg:sticky lg:top-32 space-y-6 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all duration-700" />

            <div className="relative z-10 space-y-3">
              {/* Apply Now */}
              {isExternal ? (
                externalApplyUrl ? (
                  <a
                    href={externalApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full font-semibold py-3.5 rounded-xl transition-colors text-white text-sm bg-emerald-500 hover:bg-emerald-400 block text-center"
                  >
                    Apply on {job.company}'s site →
                  </a>
                ) : (
                  <span className="w-full text-center text-sm text-white/40 py-3.5 block">Apply via the company website</span>
                )
              ) : (
                <button
                  onClick={() => applied ? undefined : handleApplyClick()}
                  disabled={applied}
                  className={`w-full font-semibold py-3.5 rounded-xl transition-colors text-white text-sm ${applied ? 'bg-emerald-600 opacity-70 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer'}`}
                >
                  {applied ? '✓ Applied' : 'Apply Now'}
                </button>
              )}

              {/* Save — 3 states */}
              {isSaving ? (
                <button disabled className="w-full flex items-center justify-center gap-2 border border-white/20 text-white/30 py-3 rounded-xl text-sm font-medium cursor-not-allowed">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </button>
              ) : isSaved ? (
                <button
                  onClick={handleUnsaveJob}
                  className="w-full flex items-center justify-center gap-2 border border-emerald-500/40 text-emerald-400 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:border-red-500/30 hover:text-red-400 group/save"
                >
                  <BookmarkCheck className="w-4 h-4 group-hover/save:hidden" />
                  <BookmarkX className="w-4 h-4 hidden group-hover/save:block" />
                  <span className="group-hover/save:hidden">Saved</span>
                  <span className="hidden group-hover/save:block">Remove</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveJob}
                  className="w-full flex items-center justify-center gap-2 border border-white/20 hover:border-emerald-500/40 text-white/70 hover:text-white py-3 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <Bookmark className="w-4 h-4" />
                  Save This Opportunity
                </button>
              )}
            </div>

            <div className="h-px bg-white/5" />

            <div className="relative z-10 space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground/50">Company Profile</h4>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-white/5 shadow-lg overflow-hidden">
                  <CompanyLogo domain={companyDomain} name={job.company} uploadedLogoUrl={(job as any).company_logo_url} />
                </div>
                <div>
                  <p className="font-bold text-lg">{job.company}</p>
                  {job.sector && job.sector !== 'null' && (
                    <p className="text-[10px] text-muted-foreground font-bold">{job.sector}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.company_description || (job.sector && job.sector !== 'null' ? `${job.company} is a leading company in the ${job.sector} sector, looking for top-tier talent to join their mission-driven team.` : `${job.company} is looking for top-tier sales talent to join their team.`)}</p>
              <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`}>
                <button className="text-emerald-400 font-bold text-xs group/link flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  View Full Profile <span className="inline-block transition-transform group-hover/link:translate-x-1 ml-1">→</span>
                </button>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-muted-foreground/50">Stay Updated</h4>
                <p className="text-xs text-muted-foreground font-medium">Get alerted to roles like this directly in your inbox.</p>
              </div>

              {isSubscribed ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <Check size={16} />
                  </div>
                  <p className="text-xs font-bold text-emerald-400">Subscription Active. We'll alert you Monday morning.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs h-12 rounded-xl transition-colors">
                    Alert Me
                  </button>
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
                    <CompanyLogo domain={relJob.domain} name={relJob.company} uploadedLogoUrl={relJob.company_logo_url} />
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
                  <span className="text-emerald-400 text-sm font-bold">View →</span>
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

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-1">Report this listing</h3>
            <p className="text-white/40 text-sm mb-4">Help us keep SalesRoles.co accurate and trustworthy.</p>

            <div className="space-y-3 mb-4">
              {[
                'Salary information is missing or fake',
                'Job is no longer available',
                'Duplicate listing',
                'Misleading or inaccurate description',
                'Spam or inappropriate content',
                'Other',
              ].map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="report_reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={e => setReportReason(e.target.value)}
                    className="accent-emerald-500"
                  />
                  <span className="text-white/70 text-sm group-hover:text-white transition-colors">{reason}</span>
                </label>
              ))}
            </div>

            {reportReason === 'Other' && (
              <textarea
                placeholder="Tell us more..."
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50 resize-none h-20 mb-3"
              />
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setReportOpen(false); setReportReason(''); setReportDetails('') }}
                className="flex-1 border border-white/10 text-white/50 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-6 w-full max-w-lg my-auto">
            <h2 className="text-white font-bold text-xl mb-1">Apply for {job?.title}</h2>
            <p className="text-white/50 text-sm mb-6">{job?.company}</p>

            <div className="mb-4">
              <label className="text-white/60 text-sm block mb-2">Your CV / Resume</label>
              {cvFile ? (
                <div className="flex items-center justify-between bg-white/5 border border-emerald-500/30 rounded-lg px-4 py-3">
                  <span className="text-white text-sm truncate">{cvFile.name}</span>
                  <button onClick={() => setCvFile(null)} className="text-white/40 hover:text-white text-xs ml-3 shrink-0">Change</button>
                </div>
              ) : (
                <label className="block border border-dashed border-white/20 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                  <p className="text-white/40 text-sm">Drop your CV here or click to upload</p>
                  <p className="text-white/20 text-xs mt-1">PDF, DOC, DOCX accepted</p>
                </label>
              )}
            </div>

            <div className="mb-4">
              <label className="text-white/60 text-sm block mb-2">Cover Letter (optional)</label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Tell them why you are a great fit..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none h-28 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {job?.screening_questions && (() => {
              try {
                const qs: string[] = JSON.parse(job.screening_questions as any)
                return qs.filter(Boolean).map((q, i) => (
                  <div key={i} className="mb-4">
                    <label className="text-white/60 text-sm block mb-2">{q}</label>
                    <textarea
                      value={answers[i] || ''}
                      onChange={e => {
                        const updated = [...answers]
                        updated[i] = e.target.value
                        setAnswers(updated)
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none h-20 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))
              } catch { return null }
            })()}

            {applyError && <p className="text-red-400 text-sm mb-3">{applyError}</p>}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleApply}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Submit Application
              </button>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="px-4 border border-white/20 text-white/60 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <XCircle className="w-4 h-4 flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}
    </Container>
  )
}
