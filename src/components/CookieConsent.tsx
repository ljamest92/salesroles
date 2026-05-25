import React, { useEffect, useState } from 'react'
import { Button, Card } from '@blinkdotnew/ui'
import { Cookie, X } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-8 z-[100] animate-slide-up md:max-w-md">
      <Card className="p-6 bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Cookie size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="font-black tracking-tight text-lg leading-none">Cookie Policy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.{' '}<a href="/cookies" className="underline hover:text-primary transition-colors">Learn more</a>
            </p>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3">
          <Button onClick={accept} className="flex-1 bg-primary text-primary-foreground font-black tracking-widest text-xs h-12 cta-glow">
            Accept
          </Button>
          <Button variant="outline" onClick={() => setIsVisible(false)} className="flex-1 font-bold tracking-widest text-xs h-12 border-white/10">
            Decline
          </Button>
        </div>
      </Card>
    </div>
  )
}