import React, { useEffect } from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Privacy <span className="text-primary">Policy</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: May 24, 2026</p>
        <h2 className="text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide directly, such as when you create a profile, post a job, or contact us. This includes names, emails, and CV data.</p>
        <h2 className="text-foreground">2. Data Usage</h2>
        <p>Your data is used to provide our services, notify candidates of views, and send job alerts. We do not sell your data to third parties.</p>
        <h2 className="text-foreground">3. Right to Erasure</h2>
        <p>You have the right to permanently delete your account and all associated data at any time via your dashboard settings.</p>
        <h2 className="text-foreground">4. GDPR Compliance</h2>
        <p>We are fully GDPR compliant and process all data according to European data protection standards.</p>
      </Card>
    </Container>
  )
}
