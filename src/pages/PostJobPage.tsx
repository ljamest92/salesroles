import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Container,
  Card,
  Badge,
  Select,
  SelectTrigger as UISelectTrigger,
  SelectValue,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  Separator as UISeparator
} from '@blinkdotnew/ui'
import { CheckCircle2, DollarSign, Rocket, Zap, ShieldCheck, AlertTriangle } from 'lucide-react'

const SelectTrigger = UISelectTrigger as any
const SelectContent = UISelectContent as any
const SelectItem = UISelectItem as any
const Separator = UISeparator as any

interface FormData {
  title: string
  company_name: string
  company_website: string
  sector: string
  location: string
  work_type: string
  seniority: string
  description: string
  base_salary: string
  ote: string
  commission_structure: string
  screening_questions: string[]
}

const isTestMode = import.meta.env.DEV

export function PostJobPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState<'standard' | 'featured'>('standard')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    title: '',
    company_name: '',
    company_website: '',
    sector: '',
    location: '',
    work_type: '',
    seniority: '',
    description: '',
    base_salary: '',
    ote: '',
    commission_structure: '',
    screening_questions: [''],
  })

  const addQuestion = () => {
    if (formData.screening_questions.length < 5) {
      setFormData(prev => ({ ...prev, screening_questions: [...prev.screening_questions, ''] }))
    }
  }

  const updateQuestion = (index: number, value: string) => {
    const updated = [...formData.screening_questions]
    updated[index] = value
    setFormData(prev => ({ ...prev, screening_questions: updated }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({ ...prev, screening_questions: prev.screening_questions.filter((_, i) => i !== index) }))
  }

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const setSelect = (field: keyof FormData) => (val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!formData.title.trim()) e.title = 'Job title is required'
    if (!formData.company_name.trim()) e.company_name = 'Company name is required'
    if (!formData.company_website.trim()) e.company_website = 'Company website is required'
    if (!formData.sector) e.sector = 'Sector is required'
    if (!formData.location.trim()) e.location = 'Location is required'
    if (!formData.work_type) e.work_type = 'Work type is required'
    if (!formData.seniority) e.seniority = 'Seniority is required'
    if (!formData.description.trim()) e.description = 'Job description is required'
    if (!formData.base_salary.trim()) e.base_salary = 'Base salary is required'
    if (!formData.ote.trim()) e.ote = 'OTE is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) setStep(2)
    else {
      const first = document.querySelector('[data-error="true"]')
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleProceedToPayment = async () => {
    const token = localStorage.getItem('salesroles_token')
    if (!token) { setStep(3); return }
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      const userData = await res.json()
      if (userData.is_pro) {
        await handleTestSubmit()
        return
      }
    } catch {}
    setStep(3)
  }

  const handleCheckout = async () => {
    setIsSubmitting(true)
    setPaymentError('')
    try {
      const token = localStorage.getItem('salesroles_token')
      if (!token) {
        setPaymentError('Please sign in to post a job.')
        return
      }
      // Save job as draft so the webhook can link payment to this job
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, status: 'draft' }),
      })
      const jobData = await jobRes.json()
      if (!jobRes.ok || !jobData.id) {
        setPaymentError(jobData.error || 'Could not save job. Please try again.')
        return
      }
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, jobId: jobData.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPaymentError(data.error || 'Payment is not available right now. Please contact info@salesroles.co to post your job.')
      }
    } catch {
      setPaymentError('Payment is not available right now. Please contact info@salesroles.co to post your job.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestSubmit = async () => {
    setIsSubmitting(true)
    setPaymentError('')
    try {
      const token = localStorage.getItem('salesroles_token')
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        navigate({ to: '/post-job/success' } as any)
      } else {
        setPaymentError(data.error || 'Submission failed. Please try again.')
      }
    } catch {
      setPaymentError('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const Err = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="validation-error flex items-center gap-1 text-xs text-destructive mt-1" data-error="true">
        <AlertTriangle size={12} /> {errors[field]}
      </p>
    ) : null

  return (
    <Container className="pt-12 pb-12 md:pt-16 md:pb-20 max-w-4xl space-y-20 page-transition">
      <div className="text-center space-y-6">
        <Badge variant="outline" className="px-6 py-2 text-primary border-primary/20 bg-primary/5 tracking-tight text-[10px] font-black">Hire Quality</Badge>
        <h1 className="text-4xl md:text-[84px] font-black tracking-tighter leading-[0.95]">Hire The Best <span className="text-primary underline underline-offset-[16px] decoration-primary/20">Sales Talent.</span></h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-80">SalesRoles.co is the #1 destination for transparent sales hiring.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between items-center px-4 md:px-20 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
        {[1, 2, 3].map(i => (
          <div key={i} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= i ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
            {step > i ? <CheckCircle2 size={20} /> : i}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-8 md:p-12 border border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl space-y-10 animate-fade-in rounded-[40px]">
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tighter">Job Details</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={set('title')}
                  placeholder="e.g. Senior Account Executive"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium ${errors.title ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="title" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Company Name *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={set('company_name')}
                  placeholder="e.g. HubSpot"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium ${errors.company_name ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="company_name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Company Website *</label>
                <input
                  type="text"
                  value={formData.company_website}
                  onChange={set('company_website')}
                  placeholder="e.g. hubspot.com"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium ${errors.company_website ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="company_website" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Sector *</label>
                <Select value={formData.sector} onValueChange={setSelect('sector')}>
                  <SelectTrigger className={`w-full bg-secondary py-6 ${errors.sector ? 'border-destructive/50' : 'border-border'}`}>
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {['SaaS','FinTech','HealthTech','AdTech','Hardware','Cybersecurity','MarTech','E-commerce','Logistics','PropTech','EdTech','InsurTech','Recruitment','Consulting','Telecommunications','Financial Services','Retail','Manufacturing','Media','Professional Services'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Err field="sector" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={set('location')}
                  placeholder="e.g. Remote or Boston, MA"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium ${errors.location ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="location" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Work Type *</label>
                <Select value={formData.work_type} onValueChange={setSelect('work_type')}>
                  <SelectTrigger className={`w-full bg-secondary py-6 ${errors.work_type ? 'border-destructive/50' : 'border-border'}`}>
                    <SelectValue placeholder="Select Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
                <Err field="work_type" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Seniority *</label>
                <Select value={formData.seniority} onValueChange={setSelect('seniority')}>
                  <SelectTrigger className={`w-full bg-secondary py-6 ${errors.seniority ? 'border-destructive/50' : 'border-border'}`}>
                    <SelectValue placeholder="Select Seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="VP / Executive">VP / Executive</SelectItem>
                  </SelectContent>
                </Select>
                <Err field="seniority" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Job Description *</label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={set('description')}
                placeholder="Full job description, responsibilities, requirements..."
                className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 resize-none transition-all font-medium ${errors.description ? 'border-destructive/50' : 'border-white/5'}`}
              />
              <Err field="description" />
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <DollarSign className="text-primary" size={28} /> Mandatory Compensation
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Base Salary Range *</label>
                <input
                  type="text"
                  value={formData.base_salary}
                  onChange={set('base_salary')}
                  placeholder="e.g. $100k - $120k"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium ${errors.base_salary ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="base_salary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">OTE Range *</label>
                <input
                  type="text"
                  value={formData.ote}
                  onChange={set('ote')}
                  placeholder="e.g. $200k - $240k"
                  className={`w-full bg-secondary border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-primary text-primary font-black text-lg ${errors.ote ? 'border-destructive/50' : 'border-white/5'}`}
                />
                <Err field="ote" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Commission Structure &amp; Quota</label>
                <textarea
                  rows={3}
                  value={formData.commission_structure}
                  onChange={set('commission_structure')}
                  placeholder="Describe the commission structure, accelerators, and annual quota..."
                  className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 resize-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tighter">Screening Questions <span className="text-muted-foreground font-medium text-base">(optional)</span></h2>
              <p className="text-sm text-muted-foreground">Candidates will answer these when they apply. Max 5 questions.</p>
            </div>
            <div className="space-y-4">
              {formData.screening_questions.map((q, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    type="text"
                    value={q}
                    onChange={e => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}, e.g. What is your current quota?`}
                    className="flex-1 bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                  {formData.screening_questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="px-3 py-2 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/10 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                disabled={formData.screening_questions.length >= 5}
                className="text-sm font-bold text-primary border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add Question
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-black px-16 h-16 text-lg tracking-tighter cta-glow" onClick={handleNextStep}>
              Next Step →
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-12 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">Choose Your Listing Plan</h2>
            <p className="text-muted-foreground text-lg">Featured listings get 10x more views and higher quality candidates.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className={`p-10 border-2 transition-all cursor-pointer relative group rounded-[40px] ${plan === 'standard' ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/10'}`}
              onClick={() => setPlan('standard')}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black">Standard</h3>
                  <div className="text-right">
                    <span className="text-4xl font-black">$99</span>
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest">One-Time</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Active for 30 days</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Company logo included</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Syndicated to Indeed &amp; Google</li>
                </ul>
              </div>
            </Card>

            <Card
              className={`p-10 border-2 transition-all cursor-pointer relative overflow-hidden group rounded-[40px] ${plan === 'featured' ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/10'}`}
              onClick={() => setPlan('featured')}
            >
              <Badge className="absolute top-6 right-[-40px] rotate-45 bg-primary text-primary-foreground px-12 py-1 font-black text-[10px] tracking-widest">Best Value</Badge>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black text-primary">Featured</h3>
                  <div className="text-right">
                    <span className="text-4xl font-black text-primary">$249</span>
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest">One-Time</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 font-bold text-primary"><Rocket size={16} /> Pinned to top for 30 days</li>
                  <li className="flex items-center gap-2 font-bold text-primary"><Rocket size={16} /> Highlighted in search results</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Everything in Standard</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Featured in weekly newsletter</li>
                </ul>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-card border-border border-l-4 border-l-primary flex gap-6 items-center">
            <ShieldCheck className="text-primary shrink-0" size={32} />
            <div className="space-y-1">
              <p className="font-bold text-sm">Full Refund Guarantee</p>
              <p className="text-xs text-muted-foreground text-balance">If your listing is rejected by our admin team for any reason, you will receive a 100% refund immediately. Once approved, listings are non-refundable.</p>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" className="font-bold" onClick={() => setStep(1)}>Back</Button>
            <Button size="lg" className="bg-primary text-primary-foreground font-black px-12" onClick={handleProceedToPayment}>Continue to Checkout</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="p-12 text-center space-y-8 animate-fade-in border-dashed border-2 border-primary/20 bg-primary/5 rounded-[48px]">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Zap size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-primary">Ready to Go Live</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-balance font-medium text-lg">Click the button below to complete your payment securely via Stripe. Your listing will be reviewed by our team within 2 hours.</p>
          </div>

          <div className="max-w-xs mx-auto p-6 bg-card rounded-xl border border-border text-left space-y-4">
            <div className="flex justify-between font-bold">
              <span>{plan === 'featured' ? 'Featured Listing' : 'Standard Listing'}</span>
              <span>${plan === 'featured' ? '249' : '99'}</span>
            </div>
            <Separator className="bg-border" />
            <div className="flex justify-between font-black text-xl text-primary tracking-tight">
              <span>Total</span>
              <span>${plan === 'featured' ? '249' : '99'}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button
              size="lg"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className="bg-primary text-primary-foreground font-black px-20 py-8 text-xl tracking-tighter shadow-[0_0_40px_rgba(34,197,94,0.3)] disabled:opacity-60"
            >
              {isSubmitting ? 'Redirecting...' : 'Complete Payment'}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2 font-bold tracking-widest">
              <ShieldCheck size={14} /> Secure 256-Bit SSL Encrypted Payment
            </p>
            {paymentError && (
              <p className="text-red-400 text-sm text-center mt-3">{paymentError}</p>
            )}
            {isTestMode && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <p className="text-xs text-muted-foreground font-bold tracking-widest text-center">TEST MODE</p>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleTestSubmit}
                  className="w-full border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 font-bold"
                >
                  Submit Without Payment (Test Mode)
                </Button>
              </div>
            )}
          </div>

          <Button variant="link" className="text-muted-foreground text-sm" onClick={() => setStep(2)}>Change plan</Button>
        </Card>
      )}
    </Container>
  )
}
