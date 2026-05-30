import React, { useEffect } from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function CookiePolicyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Cookie <span className="text-primary">Policy</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground">Last updated: May 2026</p>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">1. Introduction</h2>
          <p>This Cookie Policy explains how SalesRoles.co ("we", "us", or "our") uses cookies and similar technologies when you visit our website at salesroles.co. It describes what these technologies are, why we use them, and your rights to control their use.</p>
          <p>We use cookies to make the Service work correctly, to remember your preferences, and to understand how visitors use our platform so we can continue to improve it. This policy should be read alongside our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">2. What Are Cookies</h2>
          <p>Cookies are small text files placed on your device (computer, tablet, or phone) when you visit a website. They are widely used to make websites work efficiently and to provide information to the website owner.</p>
          <p>In addition to cookies, we may also use similar technologies including:</p>
          <ul>
            <li><strong>Local storage:</strong> A mechanism that allows websites to store data persistently in your browser, beyond the duration of a single session. We use local storage to remember your authentication state and preferences.</li>
            <li><strong>Session storage:</strong> Similar to local storage but data is cleared when you close your browser tab. We use session storage for temporary state within a single browsing session.</li>
          </ul>
          <p>Cookies and similar technologies can be either "session" (deleted when you close your browser) or "persistent" (remaining on your device for a set period or until you delete them).</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">3. Essential Cookies</h2>
          <p>Essential cookies are strictly necessary for the website to function. They cannot be disabled without breaking core functionality. We do not require your consent to use these cookies.</p>
          <p>We use essential cookies for the following purposes:</p>
          <ul>
            <li><strong>Authentication and session management:</strong> When you log in to your account, a session token is stored in your browser to keep you authenticated as you navigate the site. Without this cookie, you would be logged out every time you navigate to a new page.</li>
            <li><strong>Security tokens:</strong> We use cookies to protect against cross-site request forgery (CSRF) and other security threats. These tokens verify that requests made to our servers originate from our own website.</li>
            <li><strong>Cookie consent preference storage:</strong> When you make a choice about which cookies to accept via our consent banner, we store that preference in your browser so we do not ask you again on future visits.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">4. Functional Cookies</h2>
          <p>Functional cookies improve your experience on the website but are not strictly necessary for it to operate. We will only use functional cookies with your consent.</p>
          <p>We use functional cookies for the following purposes:</p>
          <ul>
            <li><strong>Saved job preferences:</strong> Remembering jobs you have saved or bookmarked so they persist across sessions without requiring you to log in.</li>
            <li><strong>Filter and search settings:</strong> Storing your most recently used search filters (such as location, role type, or salary range) so they are pre-populated on your next visit.</li>
            <li><strong>Language and region preferences:</strong> If you have selected a preferred currency or region, we store that preference to ensure your subsequent visits reflect your selection.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">5. Analytics Cookies</h2>
          <p>Analytics cookies help us understand how visitors use SalesRoles.co. This information enables us to improve the platform and ensure we are providing the most relevant experience to our users. We will only use analytics cookies with your consent.</p>
          <p>Analytics cookies collect information about:</p>
          <ul>
            <li><strong>Page views and navigation patterns:</strong> Which pages are visited most frequently and how users move through the site.</li>
            <li><strong>Job search behaviour:</strong> Which search queries are used, which filters are applied, and which job listings receive the most engagement.</li>
            <li><strong>Feature usage:</strong> Which features of the platform are used and which are rarely interacted with, to help prioritise improvements.</li>
          </ul>
          <p>All analytics data is aggregated and is not used to personally identify individual visitors. We do not share analytics data with third parties for their own purposes.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">6. Third-Party Cookies</h2>
          <p>Some cookies on our website are set by third-party services that we use to operate the platform:</p>
          <ul>
            <li><strong>Stripe (payment processing):</strong> When you make a payment on SalesRoles.co, Stripe may set cookies to support secure payment processing and fraud prevention. These cookies are governed by Stripe's own privacy and cookie policies.</li>
            <li><strong>Analytics tools:</strong> We may use third-party analytics services in the future. Any such tools will be listed here and will only operate with your consent.</li>
          </ul>
          <p>We do not permit third-party advertising cookies on SalesRoles.co. We do not use retargeting, behavioural advertising, or any technology that tracks you across other websites for advertising purposes.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">7. How to Control Cookies</h2>
          <p>You can control and manage cookies in several ways:</p>
          <ul>
            <li><strong>Browser settings:</strong> Most browsers allow you to view, delete, and block cookies through their settings. Instructions vary by browser — look for "Privacy", "Security", or "Cookies" in your browser's settings or preferences menu. Common browsers include Chrome, Firefox, Safari, and Edge.</li>
            <li><strong>Our consent banner:</strong> You can update your cookie preferences at any time using the cookie settings link in the footer of our website.</li>
          </ul>
          <p>Please note that disabling essential cookies will significantly impair the functionality of the Service. In particular, disabling session and authentication cookies will prevent you from logging in and maintaining an active session on the platform.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">8. Cookie Consent</h2>
          <p>When you first visit SalesRoles.co, a cookie consent banner will appear asking you to accept or decline non-essential cookies (functional and analytics cookies). Essential cookies are set automatically as they are necessary for the site to operate.</p>
          <p>You can change your cookie preferences at any time by clicking "Cookie Settings" in the footer of our website. Your updated preferences will take effect immediately. Withdrawing consent will cause any non-essential cookies currently active in your browser to be cleared.</p>
          <p>Consent is stored as a cookie preference in your browser. If you clear your browser cookies, you will be asked for your consent again on your next visit.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">9. Updates to This Policy</h2>
          <p>We will update this Cookie Policy when we introduce new cookies or change how we use existing ones. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review this page periodically to stay informed about our cookie practices.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">10. Contact</h2>
          <p>If you have any questions about our use of cookies or this Cookie Policy, please contact us at <a href="mailto:info@salesroles.co" className="text-primary hover:underline">info@salesroles.co</a>.</p>
        </section>
      </Card>
    </Container>
  )
}
