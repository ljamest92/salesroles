import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Container, Card, Badge, Separator as UISeparator } from '@blinkdotnew/ui'
import { Check, Rocket, Zap } from 'lucide-react'

const Separator = UISeparator as any;

export function PricingPage() {
  return (
    <div className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-24">
      <Container className="text-center space-y-6">
        <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none max-w-4xl mx-auto">
          Hire the Top <span className="text-primary">1% of Sales</span> Talent.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Straightforward pricing for high-quality sales hiring. No hidden fees, no subscriptions required for single postings.
        </p>
      </Container>

      <Container className="grid md:grid-cols-3 gap-8 items-start">
        <Card className="p-8 border border-border space-y-8 bg-card/30 rounded-[32px]">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Standard</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black">$99</span>
              <span className="text-muted-foreground font-bold">/30 days</span>
            </div>
            <p className="text-sm text-muted-foreground">Perfect for single role hiring.</p>
          </div>
          <Separator className="bg-border" />
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Live for 30 days</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Company logo branding</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Syndicated to Google Jobs</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Social media promotion</li>
          </ul>
          <Link to="/post-job" className="mt-6 block">
            <Button variant="outline" className="w-full font-bold tracking-tight">Post Standard Job</Button>
          </Link>
        </Card>

        <Card className="p-8 border-2 border-primary space-y-8 relative shadow-[0_0_50px_rgba(34,197,94,0.15)] bg-primary/5 rounded-[32px]">
          <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground font-black px-4 py-1 tracking-widest text-[10px]">Most Popular</Badge>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-primary">Featured</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-primary">$249</span>
              <span className="text-muted-foreground font-bold">/30 days</span>
            </div>
            <p className="text-sm text-muted-foreground">Get 10x more visibility and applicants.</p>
          </div>
          <Separator className="bg-border" />
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-center gap-3 font-bold text-foreground"><Rocket size={18} className="text-primary shrink-0" /> Pinned to top of home & search</li>
            <li className="flex items-center gap-3 font-bold text-foreground"><Rocket size={18} className="text-primary shrink-0" /> Featured in weekly newsletter</li>
            <li className="flex items-center gap-3 font-bold text-foreground"><Rocket size={18} className="text-primary shrink-0" /> Highlighted visual design</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Everything in Standard</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Priority Review (Within 1hr)</li>
          </ul>
          <Link to="/post-job" className="mt-6 block">
            <Button className="w-full bg-primary text-primary-foreground font-black tracking-tight py-6">Post Featured Job</Button>
          </Link>
        </Card>

        <Card className="p-8 border border-border space-y-8 bg-card/30 rounded-[32px]">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Unlimited</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black">$999</span>
              <span className="text-muted-foreground font-bold">/year</span>
            </div>
            <p className="text-sm text-muted-foreground">For scaling sales teams.</p>
          </div>
          <Separator className="bg-border" />
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Unlimited standard listings</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Company profile verified badge</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Browse 5,000+ candidate profiles</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-primary shrink-0" /> Dedicated Account Manager</li>
          </ul>
          <a
            href="mailto:info@salesroles.co?subject=SalesRoles.co%20Unlimited%20Plan%20Enquiry&body=Hi%2C%20I%27m%20interested%20in%20the%20Unlimited%20plan%20for%20SalesRoles.co.%20Please%20send%20me%20more%20information."
            className="w-full block text-center border border-white/20 text-white py-3 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-colors font-semibold cursor-pointer"
          >
            Contact Sales
          </a>
        </Card>
      </Container>

      <Container className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg font-medium">Everything you need to know about hiring on SalesRoles.co</p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl mx-auto">
          {[
            { q: "How does the listing approval process work?", a: "After payment, your listing is reviewed by our team within 24 hours to ensure it meets our compensation transparency standards. You will receive an email confirmation when it goes live." },
            { q: "What happens if my listing is rejected?", a: "If your listing does not meet our standards (e.g. no base salary disclosed), it will be rejected and you will receive a full refund immediately along with an explanation." },
            { q: "Can I edit my job post after it's live?", a: "Yes. Log into your company dashboard, find the listing, and click Edit. You can update the job title, description, and compensation details at any time." },
            { q: "What is the difference between Standard and Featured?", a: "Standard listings appear in the main feed. Featured listings are pinned to the top of home and search results for 30 days, giving significantly more visibility." },
            { q: "How does the annual subscription work?", a: "The Unlimited plan at $999 per year gives you unlimited standard listings for 12 months. You can post as many roles as you need without paying per listing." },
            { q: "What is your refund policy?", a: "Listings rejected by our admin team receive a full immediate refund. Approved listings that have gone live are non-refundable." }
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <h4 className="font-bold text-xl text-foreground flex items-start gap-3">
                <span className="text-primary font-black text-2xl leading-none">Q.</span>
                {item.q}
              </h4>
              <p className="text-muted-foreground text-[15px] leading-relaxed font-medium pl-10">{item.a}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}