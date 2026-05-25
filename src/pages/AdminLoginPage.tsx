import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button, Card, Container, Input } from '@blinkdotnew/ui'
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('admin_auth', 'true')
        navigate({ to: '/admin' })
      } else {
        setError('Invalid admin credentials')
      }
    } catch {
      // Fallback for dev when backend is not running
      setError('Could not reach server')
    }
  }

  return (
    <Container className="min-h-[80vh] flex items-center justify-center py-24 page-transition">
      <Card className="w-full max-w-md p-10 border border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl space-y-10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-xl">
            <ShieldCheck size={40} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter">Admin Access</h1>
            <p className="text-muted-foreground text-sm font-medium">Secure authentication required.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="password" 
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
              />
            </div>
            {error && (
              <p className="validation-error">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-black tracking-widest h-14 cta-glow text-xs">
            Unlock Console
          </Button>
        </form>
        
        <div className="pt-4 text-center">
          <Link to="/" className="text-[10px] font-black tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">Return to Home</Link>
        </div>
      </Card>
    </Container>
  )
}