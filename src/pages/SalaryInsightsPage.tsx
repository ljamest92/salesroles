import React from 'react'
import { Container, Card, StatGroup, Stat, Badge } from '@blinkdotnew/ui'
import { TrendingUp, DollarSign, Globe, Briefcase } from 'lucide-react'

export function SalaryInsightsPage() {
  return (
    <div className="pt-20 pb-12 md:py-24 space-y-24 animate-fade-in">
      <Container className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Market Data</Badge>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none">
            Salary <span className="text-primary">Insights.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Real-time data benchmarked directly from thousands of live sales listings.
          </p>
        </div>
      </Container>

      <Container>
        <StatGroup className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Stat label="Average Base" value="$105k" icon={<DollarSign className="text-primary" />} />
          <Stat label="Average OTE" value="$185k" icon={<TrendingUp className="text-primary" />} />
          <Stat label="Highest OTE" value="$450k+" icon={<Globe className="text-primary" />} />
        </StatGroup>
      </Container>

      <Container className="grid md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <h2 className="text-4xl font-black tracking-tighter underline underline-offset-[12px] decoration-primary/30 decoration-4">By Role Type</h2>
          <div className="space-y-4">
            {[
              { role: "Account Executive", base: "$90k - $140k", ote: "$180k - $280k" },
              { role: "SDR / BDR", base: "$50k - $70k", ote: "$75k - $100k" },
              { role: "Sales Manager", base: "$130k - $180k", ote: "$250k - $350k" },
              { role: "Director of Sales", base: "$180k+", ote: "$350k+" }
            ].map((item, i) => (
              <Card key={i} className="job-card-hover p-8 border border-white/5 bg-card/30 flex justify-between items-center group overflow-hidden relative rounded-[24px]">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <div className="font-bold text-lg">{item.role}</div>
                <div className="text-right">
                  <div className="text-primary font-black text-2xl tracking-tighter">{item.ote} OTE</div>
                  <div className="text-[10px] text-muted-foreground font-black tracking-widest pt-1">Base: {item.base}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-black tracking-tighter underline underline-offset-[12px] decoration-primary/30 decoration-4">By Sector</h2>
          <div className="space-y-4">
            {[
              { sector: "B2B SaaS", growth: "+12%", avgOte: "$195k" },
              { sector: "FinTech", growth: "+8%", avgOte: "$210k" },
              { sector: "HealthTech", growth: "+15%", avgOte: "$185k" },
              { sector: "AdTech", growth: "+5%", avgOte: "$165k" }
            ].map((item, i) => (
              <Card key={i} className="job-card-hover p-8 border border-white/5 bg-card/30 flex justify-between items-center group overflow-hidden relative rounded-[24px]">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <div className="flex items-center gap-3">
                  <div className="font-bold text-lg">{item.sector}</div>
                  <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px]">{item.growth}</Badge>
                </div>
                <div className="font-black text-xl">{item.avgOte}</div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}