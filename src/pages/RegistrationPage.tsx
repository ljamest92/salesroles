import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button, Card, Container, Badge } from '@blinkdotnew/ui'
import { User, Building2, Mail, Lock, CheckCircle2, ArrowRight, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function RegistrationPage() {
  const [role, setRole] = useState<'candidate' | 'company' | null>(null)
  const [isLogin, setIsLogin] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register, loginWithCredentials } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (isLogin) {
        const u = await loginWithCredentials(email, password)
        navigate({ to: '/dashboard', search: { mode: u.role === 'company' ? 'company' : 'candidate' } as any })
      } else {
        const u = await register(name, email, password, role || 'candidate')
        navigate({ to: '/dashboard', search: { mode: u.role === 'company' ? 'company' : 'candidate' } as any })
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!role && !isLogin) {
    return (
      <Container className="min-h-[80vh] flex flex-col items-center justify-center py-24 space-y-12 page-transition">
        <div className="text-center space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Join SalesRoles.co</Badge>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none">Choose Your Path</h1>
          <p className="text-xl text-muted-foreground font-medium max-w-xl mx-auto">Access the world's most transparent sales network. Are you hiring or looking?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Card
            onClick={() => setRole('candidate')}
            className="p-12 border-2 border-white/5 bg-card/30 hover:border-primary/50 transition-all cursor-pointer group text-center space-y-6 rounded-[40px] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <User size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter">I'm a Candidate</h3>
              <p className="text-muted-foreground font-medium">Find your next role with full OTE transparency.</p>
            </div>
            <Button variant="ghost" className="text-primary font-black tracking-widest text-xs gap-2 group-hover:gap-3 transition-all">
              Get Started <ArrowRight size={14} />
            </Button>
          </Card>

          <Card
            onClick={() => setRole('company')}
            className="p-12 border-2 border-white/5 bg-card/30 hover:border-primary/50 transition-all cursor-pointer group text-center space-y-6 rounded-[40px] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <Building2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter">I'm Hiring</h3>
              <p className="text-muted-foreground font-medium">Post your first listing and reach the top 1%.</p>
            </div>
            <Button variant="ghost" className="text-primary font-black tracking-widest text-xs gap-2 group-hover:gap-3 transition-all">
              Post a Job <ArrowRight size={14} />
            </Button>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground font-medium">
          Already have an account?{' '}
          <button onClick={() => setIsLogin(true)} className="text-primary font-bold hover:underline">Sign In</button>
        </p>
      </Container>
    )
  }

  return (
    <Container className="min-h-[80vh] flex items-center justify-center py-24 page-transition">
      <Card className="w-full max-w-lg p-12 border border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl space-y-10 relative overflow-hidden rounded-[40px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

        <button
          onClick={() => { setRole(null); setIsLogin(false); setError('') }}
          className="text-[10px] font-black tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <ArrowRight size={12} className="rotate-180" /> {isLogin ? 'Back' : 'Change Path'}
        </button>

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">
            {isLogin ? 'Welcome Back.' : role === 'company' ? 'Build Your Team.' : 'Fuel Your Career.'}
          </h2>
          <p className="text-muted-foreground font-medium">
            {isLogin ? 'Sign in to your account.' : 'Create your professional account in seconds.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-14 font-bold tracking-widest text-[10px] gap-3 border-white/10 hover:bg-white/5">
            <LogIn size={16} /> Google
          </Button>
          <Button variant="outline" className="h-14 font-bold tracking-widest text-[10px] gap-3 border-white/10 hover:bg-white/5">
            <LogIn size={16} /> GitHub
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px bg-white/5 flex-1" />
          <span className="text-[10px] font-black tracking-widest text-muted-foreground/30">Or with email</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {!isLogin && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" required className="mt-1 rounded border-white/10 bg-secondary text-primary focus:ring-primary" />
              <span className="text-[11px] text-muted-foreground leading-relaxed font-medium group-hover:text-foreground transition-colors">
                I am over 18 years old and I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground font-black tracking-widest h-16 cta-glow text-xs">
            {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center pt-2">
          {isLogin ? (
            <p className="text-xs text-muted-foreground font-medium">
              Don't have an account?{' '}
              <button onClick={() => { setIsLogin(false); setError('') }} className="text-primary font-bold hover:underline">Register</button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">
              Already have an account?{' '}
              <button onClick={() => { setIsLogin(true); setError('') }} className="text-primary font-bold hover:underline">Sign In</button>
            </p>
          )}
        </div>
      </Card>
    </Container>
  )
}
