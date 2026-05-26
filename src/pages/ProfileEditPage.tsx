import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button, Container, Card } from '@blinkdotnew/ui'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'salesroles_user'
const TOKEN_KEY = 'salesroles_token'

const ROLE_OPTIONS = ['Closer', 'Full Cycle Closer', 'SDR', 'BDR', 'Account Executive', 'Account Manager', 'Sales Manager', 'VP of Sales', 'Sales Director', 'CSM', 'RevOps']
const LOOKING_FOR_OPTIONS = ['Remote Role', 'Hybrid Role', 'On-site Role', 'SaaS', 'FinTech', 'HealthTech', 'Enterprise', 'SMB', 'Mid-Market', 'Startup', 'Series A–C', 'Public Company']

interface WorkEntry {
  title: string
  company: string
  start: string
  end: string
  industry: string
  description: string
  cash_collected: string
  avg_deal_size: string
  highlights: string
}

export function ProfileEditPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [yearsInSales, setYearsInSales] = useState('')
  const [totalRevenue, setTotalRevenue] = useState('')
  const [companiesClosed, setCompaniesClosed] = useState('')
  const [bio, setBio] = useState('')
  const [currentRoles, setCurrentRoles] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

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
        setYearsInSales(data.years_in_sales != null ? String(data.years_in_sales) : '')
        setTotalRevenue(data.total_revenue || '')
        setCompaniesClosed(data.companies_closed != null ? String(data.companies_closed) : '')
        setBio(data.bio || '')
        setIsPublic(!!data.is_public)
        try { setCurrentRoles(JSON.parse(data.current_roles || '[]')) } catch {}
        try { setLookingFor(JSON.parse(data.looking_for || '[]')) } catch {}
        try { setWorkHistory(JSON.parse(data.work_history || '[]')) } catch {}
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [user])

  const toggleTag = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const addWorkEntry = () => {
    setWorkHistory(prev => [...prev, { title: '', company: '', start: '', end: '', industry: '', description: '', cash_collected: '', avg_deal_size: '', highlights: '' }])
  }

  const updateWork = (i: number, field: keyof WorkEntry, val: string) => {
    setWorkHistory(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  const removeWork = (i: number) => {
    setWorkHistory(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      // Save name
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      })
      // Save candidate profile fields
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          headline,
          location,
          years_in_sales: yearsInSales ? parseInt(yearsInSales) : null,
          total_revenue: totalRevenue,
          companies_closed: companiesClosed ? parseInt(companiesClosed) : null,
          bio,
          current_roles: currentRoles,
          looking_for: lookingFor,
          work_history: workHistory,
          is_public: isPublic,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Update failed')
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const u = JSON.parse(stored)
        u.displayName = name.trim()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      }
      setSaved(true)
      setTimeout(() => navigate({ to: '/dashboard', search: { mode: 'candidate' } as any }), 1500)
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !loaded) return (
    <Container className="py-24 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </Container>
  )

  if (!user) {
    window.location.href = '/register'
    return null
  }

  const inputCls = "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
  const labelCls = "text-xs font-bold tracking-widest text-muted-foreground"

  return (
    <Container className="pt-12 pb-16 md:pt-16 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter">Edit Profile</h2>
        <p className="text-muted-foreground font-medium text-sm">{user.email}</p>
      </div>

      <Card className="p-8 border border-white/5 bg-card/50 space-y-6 rounded-[32px]">
        <h3 className="font-bold tracking-wider text-sm text-muted-foreground">Basic Info</h3>

        <div className="space-y-2">
          <label className={labelCls}>FULL NAME</label>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>HEADLINE</label>
          <input className={inputCls} placeholder="e.g. Senior AE | SaaS | $2M+ closed" value={headline} onChange={e => setHeadline(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>LOCATION</label>
          <input className={inputCls} placeholder="e.g. Austin, TX" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>BIO</label>
          <textarea className={`${inputCls} resize-none h-28`} placeholder="A short summary of your sales background..." value={bio} onChange={e => setBio(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={labelCls}>YEARS IN SALES</label>
            <input className={inputCls} type="number" min="0" value={yearsInSales} onChange={e => setYearsInSales(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>TOTAL REVENUE</label>
            <input className={inputCls} placeholder="e.g. $4.2M" value={totalRevenue} onChange={e => setTotalRevenue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>COMPANIES CLOSED FOR</label>
            <input className={inputCls} type="number" min="0" value={companiesClosed} onChange={e => setCompaniesClosed(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-8 border border-white/5 bg-card/50 space-y-4 rounded-[32px]">
        <h3 className="font-bold tracking-wider text-sm text-muted-foreground">Current Roles</h3>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map(r => (
            <button key={r} onClick={() => toggleTag(currentRoles, r, setCurrentRoles)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${currentRoles.includes(r) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/60'}`}>
              {r}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-8 border border-white/5 bg-card/50 space-y-4 rounded-[32px]">
        <h3 className="font-bold tracking-wider text-sm text-muted-foreground">Looking For</h3>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map(r => (
            <button key={r} onClick={() => toggleTag(lookingFor, r, setLookingFor)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${lookingFor.includes(r) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/60'}`}>
              {r}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-8 border border-white/5 bg-card/50 space-y-6 rounded-[32px]">
        <div className="flex items-center justify-between">
          <h3 className="font-bold tracking-wider text-sm text-muted-foreground">Work History</h3>
          <button onClick={addWorkEntry} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            <Plus size={14} /> Add Entry
          </button>
        </div>
        {workHistory.length === 0 && (
          <p className="text-white/30 text-sm text-center py-4">No work history added yet.</p>
        )}
        {workHistory.map((entry, i) => (
          <div key={i} className="border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white/40">Entry {i + 1}</span>
              <button onClick={() => removeWork(i)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>JOB TITLE</label>
                <input className={inputCls} value={entry.title} onChange={e => updateWork(i, 'title', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>COMPANY</label>
                <input className={inputCls} value={entry.company} onChange={e => updateWork(i, 'company', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>START</label>
                <input className={inputCls} placeholder="e.g. Jan 2022" value={entry.start} onChange={e => updateWork(i, 'start', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>END</label>
                <input className={inputCls} placeholder="e.g. Dec 2023 or Present" value={entry.end} onChange={e => updateWork(i, 'end', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>INDUSTRY</label>
                <input className={inputCls} placeholder="e.g. SaaS" value={entry.industry} onChange={e => updateWork(i, 'industry', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>AVG DEAL SIZE</label>
                <input className={inputCls} placeholder="e.g. $45K" value={entry.avg_deal_size} onChange={e => updateWork(i, 'avg_deal_size', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>CASH COLLECTED</label>
              <input className={inputCls} placeholder="e.g. $1.2M" value={entry.cash_collected} onChange={e => updateWork(i, 'cash_collected', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>DESCRIPTION</label>
              <textarea className={`${inputCls} resize-none h-20`} value={entry.description} onChange={e => updateWork(i, 'description', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>HIGHLIGHTS (one per line)</label>
              <textarea className={`${inputCls} resize-none h-20`} placeholder="250% to quota Q3 2023&#10;Closed 3 enterprise deals >$100K" value={entry.highlights} onChange={e => updateWork(i, 'highlights', e.target.value)} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-8 border border-white/5 bg-card/50 space-y-4 rounded-[32px]">
        <h3 className="font-bold tracking-wider text-sm text-muted-foreground">Visibility</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsPublic(v => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium">{isPublic ? 'Profile is public — companies can find you' : 'Profile is private'}</span>
        </label>
      </Card>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      {saved && <p className="text-sm text-emerald-500 font-bold">Profile saved. Redirecting...</p>}

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-black h-12 text-xs tracking-widest">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
        <Link to="/dashboard" search={{ mode: 'candidate' } as any}>
          <Button variant="outline" className="font-black h-12 border-white/10 text-xs tracking-widest">Back</Button>
        </Link>
      </div>
    </Container>
  )
}
