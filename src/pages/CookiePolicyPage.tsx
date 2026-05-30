import React, { useEffect } from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function CookiePolicyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Cookie <span className="text-primary">Policy</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: May 24, 2026</p>
        <h2 className="text-foreground">1. What are cookies?</h2>
        <p>Cookies are small text files stored on your device that help our website function better and remember your preferences.</p>
        <h2 className="text-foreground">2. Essential Cookies</h2>
        <p>We use essential cookies to manage your login session and security. These cannot be disabled.</p>
        <h2 className="text-foreground">3. Analytics Cookies</h2>
        <p>We use cookies to understand how visitors interact with our site, which helps us improve the platform.</p>
      </Card>
    </Container>
  )
}
