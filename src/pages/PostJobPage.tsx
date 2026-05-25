import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { 
  Button, 
  Container, 
  Card, 
  Badge, 
  Input, 
  Textarea, 
  Select, 
  SelectTrigger as UISelectTrigger, 
  SelectValue, 
  SelectContent as UISelectContent, 
  SelectItem as UISelectItem, 
  Separator as UISeparator 
} from '@blinkdotnew/ui'
import { CheckCircle2, DollarSign, Rocket, Zap, ShieldCheck, AlertTriangle } from 'lucide-react'

const SelectTrigger = UISelectTrigger as any;
const SelectContent = UISelectContent as any;
const SelectItem = UISelectItem as any;
const Separator = UISeparator as any;

export function PostJobPage() {
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState<'standard' | 'featured'>('standard')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    // Simulate validation
    setStep(2)
  }

  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
      <p className="validation-error">
        <AlertTriangle size={12} className="text-primary" /> {message}
      </p>
    )
  }

  return (
    <Container className="pt-20 pb-12 md:py-32 max-w-4xl space-y-20 page-transition">
      <div className="text-center space-y-6">
        <Badge variant="outline" className="px-6 py-2 text-primary border-primary/20 bg-primary/5 tracking-tight text-[10px] font-black">Hire Quality</Badge>
        <h1 className="text-4xl md:text-[84px] font-black tracking-tighter leading-[0.95]">Hire The Best <span className="text-primary underline underline-offset-[16px] decoration-primary/20">Sales Talent.</span></h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-80">SalesRoles.co is the #1 destination for transparent sales hiring.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between items-center px-4 md:px-20 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
        {[1, 2, 3].map(i => (
          <div key={i} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= i ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
            {step > i ? <CheckCircle2 size={20} /> : i}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-8 md:p-12 border border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl space-y-10 animate-fade-in rounded-[40px]">
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tighter">Job Details</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Job Title</label>
                <input type="text" placeholder="e.g. Senior Account Executive" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Company Name</label>
                <input type="text" placeholder="e.g. HubSpot" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Company Website</label>
                <input type="text" placeholder="e.g. hubspot.com" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Sector</label>
                <Select>
                  <SelectTrigger className="w-full bg-secondary border-border py-6">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="fintech">FinTech</SelectItem>
                    <SelectItem value="healthtech">HealthTech</SelectItem>
                    <SelectItem value="adtech">AdTech</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="martech">MarTech</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="proptech">PropTech</SelectItem>
                    <SelectItem value="edtech">EdTech</SelectItem>
                    <SelectItem value="insurtech">InsurTech</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="financial-services">Financial Services</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="professional-services">Professional Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Location</label>
                <input type="text" placeholder="e.g. Remote or Boston, MA" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Job Description</label>
              <textarea rows={6} placeholder="Full job description, responsibilities, requirements..." className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 resize-none transition-all font-medium" />
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <DollarSign className="text-primary" size={28} /> Mandatory Compensation
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Base Salary Range</label>
                <input type="text" placeholder="e.g. $100k - $120k" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Ote Range</label>
                <input type="text" placeholder="e.g. $200k - $240k" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 transition-all font-primary text-primary font-black text-lg" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">Commission Structure & Quota</label>
                <textarea rows={3} placeholder="Describe the commission structure, accelerators, and annual quota..." className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 resize-none transition-all font-medium" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-black px-16 h-16 text-lg tracking-tighter cta-glow" onClick={validate}>Next Step →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-12 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">Choose Your Listing Plan</h2>
            <p className="text-muted-foreground text-lg">Featured listings get 10x more views and higher quality candidates.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card 
              className={`p-10 border-2 transition-all cursor-pointer relative group rounded-[40px] ${plan === 'standard' ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/10'}`}
              onClick={() => setPlan('standard')}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black">Standard</h3>
                  <div className="text-right">
                    <span className="text-4xl font-black">$99</span>
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest">One-Time</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Active for 30 days</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Company logo included</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Syndicated to Indeed & Google</li>
                </ul>
              </div>
            </Card>

            <Card 
              className={`p-10 border-2 transition-all cursor-pointer relative overflow-hidden group rounded-[40px] ${plan === 'featured' ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/10'}`}
              onClick={() => setPlan('featured')}
            >
              <Badge className="absolute top-6 right-[-40px] rotate-45 bg-primary text-primary-foreground px-12 py-1 font-black text-[10px] tracking-widest">Best Value</Badge>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black text-primary">Featured</h3>
                  <div className="text-right">
                    <span className="text-4xl font-black text-primary">$249</span>
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest">One-Time</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 font-bold text-primary"><Rocket size={16} /> Pinned to top for 30 days</li>
                  <li className="flex items-center gap-2 font-bold text-primary"><Rocket size={16} /> Highlighted in search results</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Everything in Standard</li>
                  <li className="flex items-center gap-2"><Zap size={16} className="text-primary" /> Featured in weekly newsletter</li>
                </ul>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-card border-border border-l-4 border-l-primary flex gap-6 items-center">
            <ShieldCheck className="text-primary shrink-0" size={32} />
            <div className="space-y-1">
              <p className="font-bold text-sm">Full Refund Guarantee</p>
              <p className="text-xs text-muted-foreground text-balance">If your listing is rejected by our admin team for any reason, you'll receive a 100% refund immediately. Once approved, listings are non-refundable.</p>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" className="font-bold" onClick={() => setStep(1)}>← Back</Button>
            <Button size="lg" className="bg-primary text-primary-foreground font-black px-12" onClick={() => setStep(3)}>Continue to Checkout →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="p-12 text-center space-y-8 animate-fade-in border-dashed border-2 border-primary/20 bg-primary/5 rounded-[48px]">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            < Zap size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-primary">Ready to Go Live</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-balance font-medium text-lg">Click the button below to complete your payment securely via Stripe. Your listing will be reviewed by our team within 2 hours.</p>
          </div>
          
          <div className="max-w-xs mx-auto p-6 bg-card rounded-xl border border-border text-left space-y-4">
            <div className="flex justify-between font-bold">
              <span>{plan === 'featured' ? 'Featured Listing' : 'Standard Listing'}</span>
              <span>${plan === 'featured' ? '249' : '99'}</span>
            </div>
            <Separator className="bg-border" />
            <div className="flex justify-between font-black text-xl text-primary tracking-tight">
              <span>Total</span>
              <span>${plan === 'featured' ? '249' : '99'}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-black px-20 py-8 text-xl tracking-tighter shadow-[0_0_40px_rgba(34,197,94,0.3)]">Complete Payment</Button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2 font-bold tracking-widest">
              <ShieldCheck size={14} /> Secure 256-Bit Ssl Encrypted Payment
            </p>
          </div>
          
          <Button variant="link" className="text-muted-foreground text-sm" onClick={() => setStep(2)}>Change plan</Button>
        </Card>
      )}
    </Container>
  )
}
