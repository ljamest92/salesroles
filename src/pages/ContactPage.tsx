import React from 'react'
import { Button, Container, Card, Badge, Input, Textarea, Separator } from '@blinkdotnew/ui'
import { Mail, MessageSquare, ShieldCheck, MapPin } from 'lucide-react'

export function ContactPage() {
  return (
    <div className="py-12 md:py-24 space-y-12">
      <Container className="text-center space-y-6">
        <h1 className="text-4xl md:text-8xl font-black tracking-tighter italic leading-none">
          Get In <span className="text-primary">Touch.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Have questions about posting a job or our platform? We're here to help.
        </p>
      </Container>

      <Container className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight italic">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-bold">Email</p>
                  <p className="text-sm text-muted-foreground">support@salesroles.co</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-bold">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available Mon-Fri, 9am-6pm EST</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-bold">Office</p>
                  <p className="text-sm text-muted-foreground">SalesRoles HQ, London, UK</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="p-6 border border-border bg-card/30 space-y-4 rounded-[24px]">
            <p className="text-xs font-bold text-muted-foreground tracking-widest">Typical Response Time</p>
            <p className="text-2xl font-black text-primary italic">&lt; 2 Hours</p>
          </Card>
        </div>

        <Card className="md:col-span-2 p-8 border border-border bg-card shadow-2xl rounded-[32px]">
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground">Your Name</label>
                <input type="text" placeholder="Alex Rivera" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground">Your Email</label>
                <input type="email" placeholder="alex@example.com" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Subject</label>
              <input type="text" placeholder="How can we help?" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider text-muted-foreground">Message</label>
              <textarea rows={6} placeholder="Tell us more..." className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 resize-none" />
            </div>
            {/* Honeypot */}
            <div className="hidden">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <Button size="lg" className="w-full md:w-auto bg-primary text-primary-foreground font-black px-12 tracking-tight">Send Message</Button>
            <p className="text-[10px] text-muted-foreground text-center md:text-left flex items-center gap-2 font-bold tracking-widest">
              <ShieldCheck size={14} className="text-primary" /> Guaranteed Private & Secure Communication
            </p>
          </form>
        </Card>
      </Container>
    </div>
  )
}