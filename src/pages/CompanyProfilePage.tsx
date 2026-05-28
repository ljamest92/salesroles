import React, { useEffect, useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Button, Container, Card, Badge, StatGroup, Stat, toast, Skeleton } from '@blinkdotnew/ui'
import { MapPin, Globe, Briefcase, Users, Building2, ExternalLink, Check } from 'lucide-react'
import { fetchPartnerJobs, type Job, SEED_COMPANY_DOMAINS } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const FOLLOWS_KEY = 'salesroles_followed_companies'

function getFollowed(): string[] {
  try { return JSON.parse(localStorage.getItem(FOLLOWS_KEY) || '[]') } catch { return [] }
}
function saveFollowed(list: string[]) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(list))
}

export function CompanyProfilePage() {
  const { id } = useParams({ from: '/company/$id' })
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowed, setIsFollowed] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)

  // Resolve the correct domain for Apistemic — seed map first, then generic fallback
  const companyDomain = SEED_COMPANY_DOMAINS[id.toLowerCase()] || `${id}.com`

  useEffect(() => {
    const loadData = async () => {
      try {
        const allPartnerJobs = await fetchPartnerJobs()

        // Try to load DB jobs; fail silently
        let dbJobs: Job[] = []
        try {
          const res = await fetch('/api/jobs?status=live')
          if (res.ok) {
            const data = await res.json()
            dbJobs = (data.jobs || []).map((j: any) => ({
              ...j,
              company: j.companyName || j.company,
              is_partner: false
            }))
          }
        } catch {}

        const allJobs = [...dbJobs, ...allPartnerJobs]
        const companyJobs = allJobs.filter(
          j => j.company.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase()
        )
        const uniqueJobs = companyJobs.filter((job, index, self) =>
          index === self.findIndex(j =>
            j.id === job.id ||
            (j.url && job.url && j.url === job.url) ||
            j.title === job.title
          )
        )
        setJobs(uniqueJobs)

        // Try DB for a company record; use seed job data as fallback
        let companyInfo: any = null
        try {
          const res = await fetch(`/api/companies?slug=${id}`)
          if (res.ok) {
            const data = await res.json()
            companyInfo = data.company || null
          }
        } catch {}

        if (!companyInfo && companyJobs.length > 0) {
          companyInfo = {
            name: companyJobs[0].company,
            website: companyJobs[0].domain ? `https://${companyJobs[0].domain}` : null,
            employees: null,
            description: companyJobs[0].company_description || `${companyJobs[0].company} is building the future of their industry and looking for top-tier sales talent.`,
            hires: null,
            timeToHire: null
          }
        } else if (!companyInfo) {
          companyInfo = {
            name: id.charAt(0).toUpperCase() + id.slice(1),
            website: null,
            employees: null,
            description: 'Company profile is being updated.',
            hires: null,
            timeToHire: null
          }
        }

        setCompanyData(companyInfo)
        setIsFollowed(getFollowed().includes(id))
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading company data:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const getWebsiteUrl = (url: string) =>
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`

  const handleFollow = () => {
    if (!user) {
      toast('Login required', {
        description: 'Please sign in to follow companies and get alerts.',
        action: { label: 'Register', onClick: () => window.location.href = '/register' }
      })
      return
    }

    const followed = getFollowed()
    if (isFollowed) {
      saveFollowed(followed.filter(i => i !== id))
      setIsFollowed(false)
      toast.success('Unfollowed', { description: `You will no longer receive alerts for ${companyData.name}` })
    } else {
      saveFollowed([...followed, id])
      setIsFollowed(true)
      toast.success('Following company', { description: `We'll alert you when ${companyData.name} posts a new role.` })
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

  const uploadedLogoUrl = jobs.find(j => j.company_logo_url)?.company_logo_url

  return (
    <div className="pt-20 pb-12 md:py-24 space-y-16 page-transition">
      <Container>
        <div className="flex flex-col md:flex-row gap-12 items-start animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-2xl overflow-hidden">
            <CompanyLogo domain={companyDomain} name={companyData.name} uploadedLogoUrl={uploadedLogoUrl} size="lg" />
          </div>
          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">{companyData.name}</h1>
                <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px]">Verified Team</Badge>
              </div>
              <div className="flex flex-wrap gap-8 text-muted-foreground font-bold text-xs">
                {companyData.location && (
                  <span className="flex items-center gap-2.5"><MapPin size={18} className="text-primary" /> {companyData.location}</span>
                )}
                {companyData.website && (
                  <a href={getWebsiteUrl(companyData.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-primary transition-colors">
                    <Globe size={18} className="text-primary" /> {companyDomain}
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
            <div className="flex gap-3">
              <button
                onClick={handleFollow}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isFollowed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isFollowed ? 'Following' : 'Follow Company'}
              </button>
              {companyData.website && (
                <a href={getWebsiteUrl(companyData.website)} target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-2.5 rounded-lg text-sm font-medium border border-white/20 hover:border-white/40 text-white transition-colors flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </button>
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
          </Card>
        </div>
      </Container>
    </div>
  )
}
