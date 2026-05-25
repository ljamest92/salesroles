import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Container, Card, Badge } from '@blinkdotnew/ui'
import { CheckCircle2 } from 'lucide-react'

export function PostJobSuccessPage() {
  return (
    <Container className="min-h-[70vh] flex items-center justify-center py-24">
      <Card className="w-full max-w-lg p-12 border border-white/5 bg-card/50 backdrop-blur-xl text-center space-y-8 rounded-[40px]">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-3">
          <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Submission Received</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">You're All Set!</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Your job listing has been submitted successfully. Our team will review it within 24 hours and email you once it's live.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Link to="/jobs">
            <Button className="w-full bg-primary text-primary-foreground font-black h-14 cta-glow text-xs tracking-widest">
              Browse Live Jobs
            </Button>
          </Link>
          <Link to="/dashboard" search={{ mode: 'company' } as any}>
            <Button variant="outline" className="w-full font-bold h-12 border-white/10 text-xs tracking-widest">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </Container>
  )
}
