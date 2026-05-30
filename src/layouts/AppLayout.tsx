import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@blinkdotnew/ui'
import { useAuth } from '../hooks/useAuth'
import { Briefcase, User, LogOut, Menu, X, ArrowRight } from 'lucide-react'
import { CookieConsent } from '../components/CookieConsent'
import { motion, AnimatePresence } from 'framer-motion'

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const goToCompanyDashboard = () => {
    if (user) {
      navigate({ to: '/dashboard', search: { mode: 'company' } as any })
    } else {
      navigate({ to: '/login', search: { redirect: '/dashboard?mode=company' } as any })
    }
  }

  const goToCandidateDashboard = () => {
    if (user) {
      navigate({ to: '/dashboard', search: { mode: 'candidate' } as any })
    } else {
      navigate({ to: '/login', search: { redirect: '/dashboard?mode=candidate' } as any })
    }
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ backgroundColor: 'rgba(10, 15, 30, 0.97)' }}>
        <Navbar className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between bg-transparent border-none">
          <NavbarBrand>
            <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-0 group">
              <span className="text-primary transition-all duration-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.55)] group-hover:drop-shadow-none">SalesRoles.co</span>
            </Link>
          </NavbarBrand>

          <NavbarContent className="hidden md:flex items-center gap-10">
            <NavbarItem>
              <Link to="/jobs" className="text-sm font-bold tracking-tight hover:text-primary transition-colors">Find Jobs</Link>
            </NavbarItem>
            {(user as any)?.role === 'company' && (
              <NavbarItem>
                <Link to="/companies/candidates" className="text-sm font-bold tracking-tight hover:text-primary transition-colors">Find Candidates</Link>
              </NavbarItem>
            )}
            <NavbarItem>
              <Link to="/pricing" className="text-sm font-bold tracking-tight hover:text-primary transition-colors">Pricing</Link>
            </NavbarItem>
            <NavbarItem>
              <Link to="/blog" className="text-sm font-bold tracking-tight hover:text-primary transition-colors">Blog</Link>
            </NavbarItem>
            <NavbarItem>
              <Link to="/post-job" className="text-sm font-bold tracking-tight hover:text-primary transition-colors">For Companies</Link>
            </NavbarItem>
          </NavbarContent>

          <NavbarContent className="flex items-center gap-4">
            {/* Desktop auth buttons */}
            {user ? (
              <>
                <Link to="/dashboard" search={{ mode: (user as any).role === 'company' ? 'company' : 'candidate' } as any} className="hidden md:block">
                  <Button variant="ghost" size="sm" className="gap-2 font-black tracking-widest text-[10px] h-10 px-4 border border-white/5 hover:bg-white/5">
                    <User size={14} className="text-primary" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex h-10 w-10 p-0 border border-white/5 hover:bg-destructive/10 hover:text-destructive transition-all">
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="font-bold tracking-widest text-[10px]">Log In</Button>
                </Link>
                <Link to="/post-job" className="hidden md:block">
                  <Button size="sm" className="bg-primary text-primary-foreground font-black tracking-widest text-[10px] h-11 px-6 cta-glow">Post a Job</Button>
                </Link>
              </>
            )}

            {/* Mobile hamburger button */}
            <button
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </NavbarContent>
        </Navbar>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-white/10"
              style={{ backgroundColor: 'rgba(10, 15, 30, 0.99)' }}
            >
              <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                <Link to="/jobs" className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                  Find Jobs
                </Link>
                <Link to="/pricing" className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                  Pricing
                </Link>
                <Link to="/blog" className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                  Blog
                </Link>
                <Link to="/post-job" className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                  For Companies
                </Link>
                {(user as any)?.role === 'company' && (
                  <Link to="/companies/candidates" className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                    Find Candidates
                  </Link>
                )}

                <div className="my-2 border-t border-white/10" />

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      search={{ mode: (user as any).role === 'company' ? 'company' : 'candidate' } as any}
                      className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors flex items-center gap-3"
                    >
                      <User size={15} className="text-primary" /> Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false) }}
                      className="px-4 py-3 text-sm font-bold rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-3 text-left w-full"
                    >
                      <LogOut size={15} /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block px-4 py-3 text-sm font-bold rounded-lg hover:bg-white/5 hover:text-primary transition-colors">
                      Log In
                    </a>
                    <div className="px-2 pt-2 pb-1">
                      <Link to="/post-job">
                        <Button size="sm" className="bg-primary text-primary-foreground font-black tracking-widest text-[10px] h-11 px-6 cta-glow w-full">
                          Post a Job
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <CookieConsent />
      <footer className="footer-weight bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="space-y-8 col-span-1 md:col-span-1">
              <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-0 group">
                <span className="text-primary transition-all duration-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.55)] group-hover:drop-shadow-none">SalesRoles.co</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                The only job board built exclusively for sales professionals where every listing shows salary upfront. No hidden comp. No surprises.
              </p>
            </div>
            <div>
              <h4 className="font-black mb-8 text-[11px] tracking-[0.2em] text-foreground/30">For Candidates</h4>
              <ul className="space-y-4 text-[13px] font-bold text-muted-foreground">
                <li><Link to="/jobs" className="hover:text-primary transition-colors flex items-center gap-2 group">Find Sales Jobs <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
                <li><Link to="/remote-sales-jobs" className="hover:text-primary transition-colors">Remote Sales Jobs</Link></li>
                <li><Link to="/dashboard" search={{ mode: 'candidate' } as any} className="hover:text-primary transition-colors">Candidate Dashboard</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Career Advice</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-8 text-[11px] tracking-[0.2em] text-foreground/30">For Companies</h4>
              <ul className="space-y-4 text-[13px] font-bold text-muted-foreground">
                <li><Link to="/post-job" className="hover:text-primary transition-colors">Post a Job</Link></li>
                <li><Link to="/companies/candidates" className="hover:text-primary transition-colors">Find Candidates</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
                <li><Link to="/dashboard" search={{ mode: 'company' } as any} className="hover:text-primary transition-colors">Company Dashboard</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">Employer FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-8 text-[11px] tracking-[0.2em] text-foreground/30">Company</h4>
              <ul className="space-y-4 text-[13px] font-bold text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="/salary-insights" className="hover:text-primary transition-colors">Salary Insights</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors text-[11px] opacity-60">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors text-[11px] opacity-60">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-primary transition-colors text-[11px] opacity-60">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-black tracking-[0.15em] text-muted-foreground/40">
                © {new Date().getFullYear()} SalesRoles.co. Built for Sales Professionals.
              </p>
              <p className="text-[10px] text-muted-foreground/25">
                <a href="https://www.logo.dev" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/50 text-xs transition-colors">Logos provided by Logo.dev</a>
              </p>
            </div>
            <div className="flex gap-8">
               <button onClick={goToCompanyDashboard} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Company dashboard"><Briefcase size={16} /></button>
               <button onClick={goToCandidateDashboard} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Candidate dashboard"><User size={16} /></button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
