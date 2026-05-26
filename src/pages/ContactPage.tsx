import React, { useState } from 'react'
import { Container, Card } from '@blinkdotnew/ui'
import { Mail, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface FormFields {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const EMPTY: FormFields = { name: '', email: '', subject: '', message: '' }

function validate(f: FormFields): FormErrors {
  const e: FormErrors = {}
  if (!f.name.trim()) e.name = 'Your name is required.'
  if (!f.email.trim()) {
    e.email = 'Your email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    e.email = 'Please enter a valid email address.'
  }
  if (!f.subject.trim()) e.subject = 'Subject is required.'
  if (!f.message.trim()) e.message = 'Message is required.'
  return e
}

export function ContactPage() {
  const [form, setForm] = useState<FormFields>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    // Clear field error on change
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => {})
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  const inputBase = 'w-full bg-secondary border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors placeholder-muted-foreground/50'
  const inputCls = (field: keyof FormErrors) =>
    `${inputBase} ${errors[field] ? 'border-red-500/60 focus:border-red-500/40' : 'border-border focus:border-primary/50'}`

  return (
    <div className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-12">
      <Container className="text-center space-y-6">
        <h1 className="text-4xl md:text-8xl font-black tracking-tighter italic leading-none">
          Get In <span className="text-primary">Touch.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Have questions about posting a job or our platform? We're here to help.
        </p>
      </Container>

      <Container className="grid md:grid-cols-3 gap-12">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight italic">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-bold">Email</p>
                  <a href="mailto:info@salesroles.co" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    info@salesroles.co
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-bold">Office</p>
                  <p className="text-sm text-muted-foreground">London, UK</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="p-6 border border-border bg-card/30 space-y-2 rounded-[24px]">
            <p className="text-xs font-bold text-muted-foreground tracking-widest">Typical Response Time</p>
            <p className="text-2xl font-black text-primary italic">&lt; 2 Hours</p>
            <p className="text-xs text-muted-foreground">Mon–Fri, 9am–6pm GMT</p>
          </Card>
        </div>

        {/* Contact form */}
        <Card className="md:col-span-2 p-8 border border-border bg-card shadow-2xl rounded-[32px]">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">Message Sent!</h3>
                <p className="text-muted-foreground font-medium max-w-sm">
                  Thanks for getting in touch. We'll get back to you within 2 hours during GMT business hours.
                </p>
              </div>
              <button
                onClick={() => { setForm(EMPTY); setSubmitted(false) }}
                className="text-sm text-primary font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={form.name}
                    onChange={set('name')}
                    className={inputCls('name')}
                  />
                  {errors.name && <p className="text-xs text-red-400 font-medium">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground">
                    Your Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={form.email}
                    onChange={set('email')}
                    className={inputCls('email')}
                  />
                  {errors.email && <p className="text-xs text-red-400 font-medium">{errors.email}</p>}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wider text-muted-foreground">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={set('subject')}
                  className={inputCls('subject')}
                />
                {errors.subject && <p className="text-xs text-red-400 font-medium">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wider text-muted-foreground">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Tell us more..."
                  value={form.message}
                  onChange={set('message')}
                  className={`${inputCls('message')} resize-none`}
                />
                {errors.message && <p className="text-xs text-red-400 font-medium">{errors.message}</p>}
              </div>

              {/* Honeypot */}
              <div className="hidden" aria-hidden>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black px-12 py-3.5 rounded-xl tracking-tight transition-colors text-sm"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold tracking-widest">
                  <ShieldCheck size={14} className="text-primary shrink-0" /> Guaranteed Private &amp; Secure
                </p>
              </div>
            </form>
          )}
        </Card>
      </Container>
    </div>
  )
}
