import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Container, Card } from '@blinkdotnew/ui'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle2, Camera } from 'lucide-react'

const TOKEN_KEY = 'salesroles_token'

const TARGET_ROLES = ['SDR', 'BDR', 'Account Executive', 'Senior Account Executive', 'Enterprise Account Executive', 'Account Manager', 'Sales Manager', 'VP of Sales', 'Sales Director', 'BDM']
const AVAILABILITY_OPTIONS = ['Actively looking', 'Open to opportunities']
const INDUSTRY_OPTIONS = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'HR Tech', 'MarTech', 'Cybersecurity', 'Enterprise Software', 'E-commerce', 'Logistics', 'Real Estate Tech', 'InsurTech']
const DEAL_SIZE_OPTIONS = ['<$10K', '$10K–$50K', '$50K–$100K', '$100K–$500K', '$500K–$1M', '$1M+']
const METHODOLOGY_OPTIONS = ['MEDDIC', 'SPIN Selling', 'Challenger Sale', 'Solution Selling', 'Command of the Message', 'Sandler', 'Value-Based Selling', 'SPIN', 'Gap Selling']

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-[#0f1629] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none"

function TagSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${value.includes(o) ? 'bg-primary/20 text-primary border-primary/40' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function SkillsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); setInput('') }
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type a skill and press Enter"
          className={inputCls + ' flex-1'}
        />
        <button type="button" onClick={add} className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map(s => (
          <span key={s} className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
            {s}
            <button type="button" onClick={() => onChange(value.filter(x => x !== s))} className="text-primary/60 hover:text-primary leading-none">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ProfileEditPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Identity
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Sales career
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [currentOte, setCurrentOte] = useState('')
  const [targetSalary, setTargetSalary] = useState('')
  const [availability, setAvailability] = useState('')
  const [industries, setIndustries] = useState<string[]>([])
  const [dealSizes, setDealSizes] = useState<string[]>([])
  const [salesMethodology, setSalesMethodology] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])

  // Bio
  const [bio, setBio] = useState('')
  const [achievements, setAchievements] = useState('')

  // CV + visibility
  const [cvFilename, setCvFilename] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Legacy fields (kept for backwards compat with existing backend)
  const [yearsInSales, setYearsInSales] = useState('')
  const [totalRevenue, setTotalRevenue] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!user) return
    setName(user.displayName || '')
    const token = localStorage.getItem(TOKEN_KEY)
    fetch('/api/candidate/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setHeadline(data.headline || '')
        setLocation(data.location || '')
        setPhone(data.phone || '')
        setLinkedinUrl(data.linkedin_url || '')
        try { setTargetRoles(JSON.parse(data.target_role || '[]')) } catch { setTargetRoles(data.target_role ? [data.target_role] : []) }
        setYearsExperience(data.years_experience != null ? String(data.years_experience) : '')
        setCurrentRole(data.current_role || '')
        setCurrentOte(data.current_ote || '')
        setTargetSalary(data.target_salary || '')
        setAvailability(data.availability || '')
        setBio(data.bio || '')
        setAchievements(data.achievements || '')
        setIsPublic(!!data.is_public)
        setYearsInSales(data.years_in_sales != null ? String(data.years_in_sales) : '')
        setTotalRevenue(data.total_revenue || '')
        if (data.cv_filename) setCvFilename(data.cv_filename)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        try { setSkills(JSON.parse(data.skills || '[]')) } catch {}
        try { setIndustries(JSON.parse(data.industries || '[]')) } catch {}
        try { setDealSizes(JSON.parse(data.deal_sizes || '[]')) } catch {}
        try { setSalesMethodology(JSON.parse(data.sales_methodology || '[]')) } catch {}
      })
      .catch(() => {})
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem(TOKEN_KEY)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await fetch('/api/candidate/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (data.ok && data.avatar_url) setAvatarUrl(data.avatar_url)
    } catch {}
  }

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem(TOKEN_KEY)
    const fd = new FormData()
    fd.append('cv', file)
    const res = await fetch('/api/candidate/upload-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    const data = await res.json()
    if (data.ok) setCvFilename(data.filename)
  }

  const handleDeleteCV = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    await fetch('/api/candidate/delete-cv', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setCvFilename('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          headline, location, phone, linkedin_url: linkedinUrl,
          target_role: JSON.stringify(targetRoles), years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          current_role: currentRole, current_ote: currentOte, target_salary: targetSalary, availability,
          industries, deal_sizes: dealSizes, sales_methodology: salesMethodology, skills,
          bio, achievements, is_public: isPublic,
          years_in_sales: yearsInSales ? parseInt(yearsInSales) : null,
          total_revenue: totalRevenue,
          current_roles: [], looking_for: [], work_history: [],
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || 'Save failed')
      }
    } catch {
      setError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return null
  if (!user) { navigate({ to: '/register' }); return null }

  return (
    <Container className="py-12 md:py-20 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Edit Profile</h1>
        <p className="text-muted-foreground font-medium">Keep your profile sharp. Companies search here.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Photo + Identity */}
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[28px] space-y-6">
          <h2 className="text-sm font-black tracking-widest text-muted-foreground">PHOTO + IDENTITY</h2>

          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {avatarUrl ? (
                <img src={`/uploads/avatars/${avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">{(name || '?')[0]?.toUpperCase()}</span>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full">
                <Camera size={20} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">{name}</p>
              <label className="cursor-pointer text-xs text-primary font-bold hover:underline">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls} />
            </Field>
            <Field label="Location">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" className={inputCls} />
            </Field>
            <Field label="Professional Headline">
              <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior AE | SaaS | £85K OTE" className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" className={inputCls} />
            </Field>
            <Field label="LinkedIn URL">
              <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" className={inputCls} />
            </Field>
          </div>
        </Card>

        {/* Section 2: Sales Career */}
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[28px] space-y-6">
          <h2 className="text-sm font-black tracking-widest text-muted-foreground">SALES CAREER</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Current Role">
              <input value={currentRole} onChange={e => setCurrentRole(e.target.value)} placeholder="e.g. Account Executive" className={inputCls} />
            </Field>
            <Field label="Years of Sales Experience">
              <input type="number" min="0" max="40" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="e.g. 5" className={inputCls} />
            </Field>
            <Field label="Current OTE">
              <input value={currentOte} onChange={e => setCurrentOte(e.target.value)} placeholder="e.g. £75,000" className={inputCls} />
            </Field>
            <Field label="Target OTE / Salary">
              <input value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="e.g. £100,000" className={inputCls} />
            </Field>
            <Field label="Availability">
              <select value={availability} onChange={e => setAvailability(e.target.value)} className={inputCls}>
                <option value="">Select availability</option>
                {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="mt-2 space-y-1">
                <p className="text-white/30 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Actively Looking: you appear first in search and get a green Active badge
                </p>
                <p className="text-white/30 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                  Open to Opportunities: you appear in search as open but not urgently looking
                </p>
              </div>
            </Field>
          </div>

          <Field label="Experience">
            <TagSelect options={TARGET_ROLES} value={targetRoles} onChange={setTargetRoles} />
          </Field>

          <Field label="Industries">
            <TagSelect options={INDUSTRY_OPTIONS} value={industries} onChange={setIndustries} />
          </Field>

          <Field label="Deal Sizes">
            <TagSelect options={DEAL_SIZE_OPTIONS} value={dealSizes} onChange={setDealSizes} />
          </Field>

          <Field label="Sales Methodology">
            <TagSelect options={METHODOLOGY_OPTIONS} value={salesMethodology} onChange={setSalesMethodology} />
          </Field>

          <Field label="Key Skills">
            <SkillsInput value={skills} onChange={setSkills} />
          </Field>
        </Card>

        {/* Section 3: Bio + Achievements */}
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[28px] space-y-6">
          <h2 className="text-sm font-black tracking-widest text-muted-foreground">BIO + ACHIEVEMENTS</h2>

          <Field label="Professional Bio">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
              placeholder="Describe your sales background, approach, and what makes you stand out..."
              className={inputCls + ' resize-none'}
            />
          </Field>

          <Field label="Key Achievements">
            <textarea
              value={achievements}
              onChange={e => setAchievements(e.target.value)}
              rows={4}
              placeholder="e.g. Closed $2.4M ARR in FY2023 · 147% of quota · #1 AE globally..."
              className={inputCls + ' resize-none'}
            />
          </Field>
        </Card>

        {/* Section 4: CV */}
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[28px] space-y-4">
          <h2 className="text-sm font-black tracking-widest text-muted-foreground">CV / RESUME</h2>

          {cvFilename ? (
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
              <div>
                <p className="text-sm font-bold">{cvFilename}</p>
                <p className="text-xs text-muted-foreground">CV on file</p>
              </div>
              <div className="flex gap-3">
                <label className="cursor-pointer text-primary text-xs font-bold hover:underline">
                  Replace
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} />
                </label>
                <button type="button" onClick={handleDeleteCV} className="text-red-400 text-xs font-bold hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-primary/30 hover:bg-primary/5 transition-all">
              <p className="text-sm font-bold mb-1">Upload your CV</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX — max 10MB</p>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} />
            </label>
          )}
        </Card>

        {/* Section 5: Visibility */}
        <Card className="p-6 md:p-8 border border-white/5 bg-card/30 rounded-[28px]">
          <label className="flex items-center justify-between cursor-pointer gap-4">
            <div>
              <h2 className="text-sm font-black tracking-widest text-muted-foreground">PROFILE VISIBILITY</h2>
              <p className="text-xs text-muted-foreground mt-1">Make your profile visible to hiring companies</p>
            </div>
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </Card>

        {/* Error */}
        {error && <p className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 bg-primary text-primary-foreground font-black tracking-widest text-xs rounded-2xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : saved ? <><CheckCircle2 size={16} /> Saved!</> : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/dashboard', search: { mode: 'candidate' } as any })}
            className="px-6 py-4 border border-white/10 text-muted-foreground font-bold text-xs rounded-2xl hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Container>
  )
}
