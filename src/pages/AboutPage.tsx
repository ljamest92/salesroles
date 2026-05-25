import React from 'react'
import { Container, Card, Badge, Separator as UISeparator } from '@blinkdotnew/ui'

const Separator = UISeparator as any;

export function AboutPage() {
  return (
    <div className="pt-20 pb-12 md:py-24 space-y-24">
      <Container className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Our Mission</Badge>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter italic leading-none max-w-5xl mx-auto">
            Fixing Sales <span className="text-primary">Hiring</span> for Good.
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
          SalesRoles.co was founded on a simple principle: <span className="text-foreground font-bold">Transparency is the ultimate sales efficiency.</span> We believe sales professionals deserve to know exactly what they can earn before they spend hours interviewing.
        </p>
      </Container>

      <Container className="grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h2 className="text-4xl font-black tracking-tighter italic">Why We Exist</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>For too long, the sales hiring process has been shrouded in mystery. "Competitive OTE" and "Generous Commission" are phrases that mean nothing without hard numbers. This lack of transparency wastes time for both candidates and companies.</p>
            <p>By making compensation transparency mandatory, we attract the top 1% of sales talent who know their worth and only want to talk to companies that are confident enough to be open about their pay structures.</p>
          </div>
        </div>
        <Card className="p-8 border border-border bg-card/30 space-y-8 rounded-[32px]">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2 text-center border-b border-border pb-8">
              <p className="text-5xl font-black text-primary italic">100%</p>
              <p className="text-xs font-bold tracking-widest text-muted-foreground">Comp Transparency</p>
            </div>
            <div className="space-y-2 text-center border-b border-border pb-8">
              <p className="text-5xl font-black text-primary italic">$185k</p>
              <p className="text-xs font-bold tracking-widest text-muted-foreground">Average OTE on Platform</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-5xl font-black text-primary italic">500+</p>
              <p className="text-xs font-bold tracking-widest text-muted-foreground">Global Sales Teams</p>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  )
}