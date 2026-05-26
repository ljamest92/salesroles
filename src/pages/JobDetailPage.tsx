import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { Button, Container, Card, Badge, toast, Skeleton } from '@blinkdotnew/ui'
import { MapPin, Briefcase, Share2, ShieldAlert, CheckCircle, ArrowLeft, Building2, Check, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react'
import { ReportModal } from '../components/ReportModal'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { formatSalary } from '../utils/formatSalary'
import { getDomain } from '../utils/getDomain'
import { useAuth } from '../hooks/useAuth'

export function JobDetailPage() {
  const { slug } = useParams({ from: '/jobs/$slug' })
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState('')

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
                is_partner: false
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

  const handleSave = async () => {
    if (!user) {
      setSaveMessage('sign-in')
      return
    }
    try {
      const token = localStorage.getItem('salesroles_token')
      const res = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: slug }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsSaved(data.saved)
      }
    } catch {
      setSaveMessage('error')
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
      } else {
        setApplyError(data.error || 'Application failed. Please try again.')
      }
    } catch {
      setApplyError('Application failed. Please try again.')
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
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </Container>
    )
  }

  const applyUrl = job.application_url

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12 animate-fade-in overflow-x-hidden">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
        <ChevronRight size={14} />
        <Link to="/jobs" className="hover:text-primary transition-colors font-medium">Jobs</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-bold truncate max-w-[200px]">{job.title}</span>
      </nav>

      {/* FIX 9: On mobile sidebar moves below job header — flex-col reverses naturally */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Main Content */}
        <div className="flex-1 space-y-12 min-w-0">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex gap-4 md:gap-6 min-w-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-2xl overflow-hidden relative">
                  <CompanyLogo domain={getDomain(job.company_website || job.domain, job.company)} name={job.company} />
                </div>
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-6xl font-black tracking-tighter leading-[0.9]">{job.title}</h1>
                    {job.featured && <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px]">Featured</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-4 md:gap-6 text-muted-foreground font-bold text-sm">
                    <Link to={`/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`} className="text-foreground hover:text-primary transition-colors">{job.company}</Link>
                    <span className="flex items-center gap-2"><MapPin size={18} className="text-primary" /> {job.location}</span>
                    <span className="flex items-center gap-2"><Briefcase size={18} className="text-primary" /> {job.sector}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto relative z-10 shrink-0">
                <Button onClick={handleShare} variant="outline" className="flex-1 md:flex-none gap-2.5 font-bold text-xs h-12 border-white/10 hover:bg-white/5 transition-all">
                  <Share2 size={16} /> {copied ? 'Copied!' : 'Share'}
                </Button>
                <Button onClick={() => setIsReportModalOpen(true)} variant="outline" className="flex-1 md:flex-none gap-2.5 font-bold text-xs h-12 text-destructive border-destructive/20 hover:bg-destructive/10">
                  <ShieldAlert size={16} /> Report
                </Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* FIX 9: Comp stats stack 2x2 on mobile */}
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
                <div className="space-y-1 text-primary">
                  <p className="text-xs font-bold text-muted-foreground">OTE Range</p>
                  <p className="text-xl md:text-2xl font-black">{formatSalary(job.ote)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Posted</p>
                  <p className="text-xl md:text-2xl font-black">{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Currency</p>
                  <p className="text-xl md:text-2xl font-black">{job.currency}</p>
                </div>
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-black tracking-tighter mb-6">Job Description</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: job.description }} />
          </div>

          {!((job.via_partner || job.is_partner) && !job.base_salary && !job.ote) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter">Compensation & Benefits</h2>
            <Card className="p-8 border-primary/20 bg-primary/5 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground">Compensation Details</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Base Salary</span>
                      <span className="font-bold">{formatSalary(job.base_salary)}</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">On-Target Earnings (OTE)</span>
                      <span className="font-bold text-primary">{formatSalary(job.ote)}</span>
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
          )}
        </div>

        {/* Sidebar — shows below content on mobile, sticky on desktop */}
        <aside className="lg:w-96 space-y-8">
          <Card className="p-8 border border-white/5 bg-card/50 backdrop-blur-xl lg:sticky lg:top-32 space-y-10 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700" />

            {/* Apply button */}
            <div className="relative z-10 space-y-4">
              <button
                onClick={() => applied ? undefined : handleApplyClick()}
                disabled={applied}
                className={`w-full font-semibold py-3 rounded-lg transition-colors text-white ${applied ? 'bg-emerald-600 opacity-70 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer'}`}
              >
                {applied ? 'Applied ✓' : 'Apply Now'}
              </button>

              <Button
                variant="ghost"
                onClick={handleSave}
                className={`w-full gap-2 font-bold py-4 text-xs transition-colors ${isSaved ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-primary'}`}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {isSaved ? 'Saved' : 'Save This Opportunity'}
              </Button>

              {saveMessage === 'sign-in' && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link to="/register" className="text-primary font-bold hover:underline">Sign in</Link> to save this job
                </p>
              )}
              {saveMessage === 'error' && (
                <p className="text-xs text-center text-destructive">Could not save job. Try again.</p>
              )}
            </div>

            <div className="h-px bg-white/5" />

            <div className="relative z-10 space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground/50">Company Profile</h4>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-white/5 shadow-lg overflow-hidden">
                  <CompanyLogo domain={getDomain(job.company_website || job.domain, job.company)} name={job.company} />
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
                    <CompanyLogo domain={relJob.domain} name={relJob.company} />
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

      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-6 w-full max-w-lg my-auto">
            <h2 className="text-white font-bold text-xl mb-1">Apply for {job?.title}</h2>
            <p className="text-white/50 text-sm mb-6">{job?.company}</p>

            {/* CV Upload */}
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

            {/* Cover Letter */}
            <div className="mb-4">
              <label className="text-white/60 text-sm block mb-2">Cover Letter (optional)</label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Tell them why you are a great fit..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none h-28 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Screening Questions */}
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
    </Container>
  )
}
