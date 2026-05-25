import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Container, Card } from '@blinkdotnew/ui'
import { useAuth } from '../hooks/useAuth'

const STORAGE_KEY = 'salesroles_user'
const TOKEN_KEY = 'salesroles_token'

export function ProfileEditPage() {
  const { user, isLoading } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !name.trim()) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const u = JSON.parse(stored)
        u.displayName = name.trim()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      }
      setSaved(true)
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return null

  if (!user) {
    window.location.href = '/register'
    return null
  }

  return (
    <Container className="py-24 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md p-12 border border-white/5 bg-card/50 backdrop-blur-xl space-y-8 rounded-[40px]">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">Edit Profile</h2>
          <p className="text-muted-foreground font-medium text-sm">{user.email}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-muted-foreground">FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          {saved && <p className="text-sm text-emerald-500 font-bold">Profile updated.</p>}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 bg-primary text-primary-foreground font-black h-12 text-xs tracking-widest"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" className="font-black h-12 border-white/10 text-xs tracking-widest">
              Back
            </Button>
          </Link>
        </div>
      </Card>
    </Container>
  )
}
