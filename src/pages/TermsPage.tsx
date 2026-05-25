import React from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function TermsPage() {
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Terms of <span className="text-primary">Service</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: May 24, 2026</p>
        <h2 className="text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing SalesRoles.co, you agree to be bound by these terms. If you do not agree, please do not use the site.</p>
        <h2 className="text-foreground">2. Job Postings</h2>
        <p>All job postings must include mandatory compensation transparency, including base salary and OTE range. Listings without these details will be rejected.</p>
        <h2 className="text-foreground">3. Payments & Refunds</h2>
        <p>Standard and Featured listings are paid in advance. If a listing is rejected by our admin team, a full refund is issued. Once approved and live, listings are non-refundable.</p>
        <h2 className="text-foreground">4. Prohibited Content</h2>
        <p>We prohibit discriminatory language, misleading OTE claims, and commission-only roles without a base salary.</p>
      </Card>
    </Container>
  )
}