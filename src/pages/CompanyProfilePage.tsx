import React, { useEffect, useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Button, Container, Card, Badge, StatGroup, Stat, Toaster, toast, Skeleton } from '@blinkdotnew/ui'
import { MapPin, Globe, Briefcase, Users, Building2, ExternalLink, Check, Copy } from 'lucide-react'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../lib/blink'

export function CompanyProfilePage() {
  const { id } = useParams({ from: '/company/$id' })
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowed, setIsFollowed] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [badgeCopied, setBadgeCopied] = useState(false)

  const getFallbackLogo = (name: string) => {
    const letter = name.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${letter}&background=0D0D0D&color=10B981&size=128&font-size=0.5&bold=true`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allPartnerJobs, dbCompanies, dbJobs] = await Promise.all([
          fetchPartnerJobs(),
          blink.db.companies.list({ where: { name: id } }), // This might need better matching
          blink.db.jobs.list({ where: { status: 'live' } })
        ]);

        const mappedDbJobs: Job[] = dbJobs.map((job: any) => ({
          ...job,
          company: job.companyName || job.company,
          is_partner: false
        }));

        const allJobs = [...mappedDbJobs, ...allPartnerJobs];
        const companyJobs = allJobs.filter(j => j.company.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase());
        
        setJobs(companyJobs);

        let companyInfo = dbCompanies.find((c: any) => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase());
        
        if (!companyInfo && companyJobs.length > 0) {
          companyInfo = {
            name: companyJobs[0].company,
            website: null,
            employees: null,
            description: companyJobs[0].company_description || `Leading the way in sales efficiency and compensation transparency. ${companyJobs[0].company} is building the future of revenue operations and looking for top-tier talent to join our mission-driven team.`,
            hires: null,
            timeToHire: null
          };
        } else if (!companyInfo) {
          companyInfo = {
            name: id.charAt(0).toUpperCase() + id.slice(1),
            website: null,
            employees: null,
            description: 'Company profile is being updated.',
            hires: null,
            timeToHire: null
          };
        }

        setCompanyData(companyInfo);

        if (user) {
          const followed = await blink.db.table('followed_companies').list({
            where: { candidateId: user.id, companyId: id }
          });
          setIsFollowed(followed.length > 0);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading company data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user])

  const getWebsiteUrl = (url: string) =>
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`

  const copyBadge = async () => {
    const code = `<script src="https://salesroles.co/badge.js?company=${id}"></script>`
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setBadgeCopied(true)
    setTimeout(() => setBadgeCopied(false), 2000)
    toast.success('Badge code copied', { description: 'Paste this into your website to show you are hiring.' })
  }

  const handleFollow = async () => {
    if (!user) {
      toast('Login required', { 
        description: 'Please sign in to follow companies and get alerts.',
        action: { label: 'Register', onClick: () => window.location.href = '/register' }
      })
      return
    }

    try {
      if (isFollowed) {
        await blink.db.table('followed_companies').deleteMany({
          where: { candidateId: user.id, companyId: id }
        });
        setIsFollowed(false);
        toast.success('Unfollowed', { description: `You will no longer receive alerts for ${companyData.name}` });
      } else {
        await blink.db.table('followed_companies').create({
          candidateId: user.id,
          companyId: id
        });
        setIsFollowed(true);
        toast.success('Following company', { description: `We'll alert you when ${companyData.name} posts a new role.` });
      }
    } catch (error) {
      console.error('Error following/unfollowing company:', error);
      toast.error('Operation failed', { description: 'Please try again later.' });
    }
  }

  if (isLoading || !companyData) {
    return (
      <Container className="py-24">
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-3 gap-12 mt-12">
          <Skeleton className="md:col-span-2 h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Container>
    )
  }

  return (
    <div className="pt-20 pb-12 md:py-24 space-y-16 page-transition">
      <Container>
        <div className="flex flex-col md:flex-row gap-12 items-start animate-fade-in">
          <div className="w-32 h-32 rounded-[32px] bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-2xl overflow-hidden relative group">
             <img 
               src={`https://logo.clearbit.com/${id}.com`} 
               alt={companyData.name} 
               className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
               onError={(e) => {
                 e.currentTarget.src = getFallbackLogo(companyData.name);
               }}
             />
            <Building2 size={64} className="absolute z-[-1]" />
          </div>
          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">{companyData.name}</h1>
                <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px]">Verified Team</Badge>
              </div>
              <div className="flex flex-wrap gap-8 text-muted-foreground font-bold text-xs">
                <span className="flex items-center gap-2.5"><MapPin size={18} className="text-primary" /> Remote First</span>
                {companyData.website && (
                  <a href={getWebsiteUrl(companyData.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-primary transition-colors">
                    <Globe size={18} className="text-primary" /> {id}.com
                  </a>
                )}
                {companyData.employees && (
                  <span className="flex items-center gap-2.5"><Users size={18} className="text-primary" /> {companyData.employees} Team</span>
                )}
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
              {companyData.description}
            </p>
            <div className="flex gap-4">
              <Button onClick={handleFollow} className={`${isFollowed ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'} font-black px-10 h-14 cta-glow text-xs`}>
                {isFollowed ? 'Following' : 'Follow Company'}
              </Button>
              {companyData.website && (
                <a href={getWebsiteUrl(companyData.website)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="font-black px-10 h-14 border-white/10 gap-2.5 text-xs hover:bg-white/5 transition-all">
                    <ExternalLink size={16} /> Website
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </Container>

      <Container>
        <div className="h-px bg-white/5" />
      </Container>

      <Container className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          <h2 className="text-3xl font-black tracking-tighter">Open Opportunities</h2>
          <div className="grid gap-6">
            {isLoading ? (
              [1, 2].map(i => <Card key={i} className="h-40 animate-pulse bg-secondary/20" />)
            ) : jobs.length > 0 ? (
              jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="job-card-hover p-8 border border-white/5 group flex flex-col md:flex-row justify-between gap-6 rounded-[32px]">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap gap-6 text-muted-foreground font-bold text-sm">
                        <span>{job.location}</span>
                        <span className="text-primary">{job.ote} Ote</span>
                      </div>
                    </div>
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="outline" className="font-bold tracking-widest border-white/10 group-hover:border-primary/50">Details</Button>
                    </Link>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="p-12 text-center border-dashed border-white/10">
                <p className="text-muted-foreground">No active listings at the moment.</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tighter">Company Info</h2>
          <Card className="p-8 border border-white/5 bg-card/30 space-y-8 rounded-[32px]">
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Active Roles</p>
              <p className="text-4xl font-black text-primary">{jobs.length}</p>
            </div>
            {companyData.employees && (
              <>
                <div className="h-px bg-white/5" />
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">Team Size</p>
                  <p className="text-4xl font-black text-foreground">{companyData.employees}</p>
                </div>
              </>
            )}
            <div className="h-px bg-white/5" />
            <div className="space-y-6">
              <p className="text-[10px] font-black text-muted-foreground underline underline-offset-8 decoration-primary/30">We're Hiring</p>
              <div className="p-8 bg-primary/10 rounded-3xl border border-primary/20 text-center space-y-4 group/badge">
                <p className="text-xs font-black text-primary">Employer Badge</p>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Display our premium "We are hiring" badge on your careers page.</p>
                <Button onClick={copyBadge} variant="outline" size="sm" className="w-full bg-card border-white/5 font-black text-[9px] h-10 gap-2 group-hover/badge:border-primary/50 transition-all">
                  <Copy size={14} /> {badgeCopied ? 'Copied!' : 'Copy Embed Code'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Container>
      <Toaster />
    </div>
  )
}
