import React, { useState, useEffect } from 'react'
import { Container, Card, Badge } from '@blinkdotnew/ui'
import { Link } from '@tanstack/react-router'
import { MapPin, Building2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchPartnerJobs, type Job } from '../lib/jobs'
import { CompanyLogo } from '../components/CompanyLogo'
import { getDomain } from '../utils/getDomain'

interface SEOLandingPageProps {
  title: string
  description: string
  keyword: string
}

export function SEOLandingPage({ title, description, keyword }: SEOLandingPageProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    fetchPartnerJobs().then(allJobs => {
      const filtered = allJobs.filter(j =>
        j.title.toLowerCase().includes(keyword.toLowerCase()) ||
        j.location.toLowerCase().includes(keyword.toLowerCase()) ||
        j.sector.toLowerCase().includes(keyword.toLowerCase())
      )
      setJobs(filtered.length > 0 ? filtered : allJobs.slice(0, 5))
      setIsLoading(false)
    })
  }, [keyword])

  return (
    <div className="pt-20 pb-12 md:py-32 space-y-32 page-transition">
      <Container className="text-center space-y-10 animate-fade-in">
        <div className="space-y-6">
          <Badge variant="outline" className="px-6 py-2 text-primary border-primary/20 bg-primary/5 text-[10px] font-black">Curated Listings</Badge>
          <h1 className="text-4xl md:text-[92px] font-black tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            {title.split(keyword)[0]}<span className="text-primary underline underline-offset-[16px] decoration-primary/20">{keyword}</span>{title.split(keyword)[1]}
          </h1>
        </div>
        <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
          {description}
        </p>
      </Container>

      <Container className="space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <h2 className="text-4xl font-black tracking-tighter leading-none">Live {keyword} Roles</h2>
          <Link to="/jobs" className="flex items-center text-primary font-black text-[10px] hover:opacity-80 transition-opacity group">
            View All Roles <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="h-48 animate-pulse bg-secondary/20 rounded-[32px]" />)
          ) : (
            jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/jobs/${job.id}`}>
                  <Card className="job-card-hover p-10 border border-white/5 bg-card/30 flex flex-col md:flex-row justify-between gap-10 rounded-[32px] group cursor-pointer">
                    <div className="flex gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-white/5 shadow-xl transition-all group-hover:scale-105 duration-500 overflow-hidden">
                        <CompanyLogo domain={job.domain || getDomain(job.company_website || '')} name={job.company} uploadedLogoUrl={job.company_logo_url} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black px-2">Verified</Badge>
                        </div>
                        <div className="flex flex-wrap gap-6 text-muted-foreground font-bold text-[11px] pt-2">
                          <span className="text-foreground">{job.company}</span>
                          <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {job.location}</span>
                          <span className="text-primary">Transparent OTE</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-black mb-2 opacity-50">On-Target Earnings</p>
                        <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">{job.ote}</p>
                      </div>
                      <span className="inline-flex items-center justify-center font-black text-[9px] h-11 px-8 border border-white/10 group-hover:border-primary/50 transition-all rounded-md">Details</span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </Container>

      <Container>
        <Card className="p-12 border border-primary/20 bg-primary/5 space-y-8">
          <h2 className="text-4xl font-black tracking-tighter">Why find {keyword} jobs on SalesRoles.co?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t: "No Guesswork", d: "Every listing includes a confirmed base and OTE range." },
              { t: "Verified Teams", d: "We only list roles from companies with proven track records." },
              { t: "Sales Specific", d: "Our search filters are built specifically for sales cycles and quotas." }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <h4 className="text-xl font-bold text-primary underline underline-offset-4">{item.t}</h4>
                <p className="text-muted-foreground text-sm">{item.d}</p>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </div>
  )
}
