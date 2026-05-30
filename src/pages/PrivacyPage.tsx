import React, { useEffect } from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Privacy <span className="text-primary">Policy</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground">Last updated: May 2026</p>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">1. Introduction</h2>
          <p>SalesRoles.co ("we", "us", or "our") operates the job board platform at salesroles.co. This Privacy Policy explains how we collect, use, store, and share information about you when you use our website and services (the "Service").</p>
          <p>By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">2. Information We Collect</h2>
          <p>We collect information in the following categories:</p>
          <ul>
            <li><strong>Account registration data:</strong> When you create an account, we collect your name, email address, and a hashed password.</li>
            <li><strong>Candidate profile data:</strong> If you register as a candidate, we may collect your CV or resume, work history, skills, target role, target salary, years of experience, availability status, and location.</li>
            <li><strong>Job posting data:</strong> If you register as an employer or recruiter, we collect company details, job descriptions, and compensation information associated with listings you submit.</li>
            <li><strong>Usage data:</strong> We automatically collect information about how you use the Service, including pages visited, search queries entered, job listings clicked, and browser and device information.</li>
            <li><strong>Cookies and tracking data:</strong> We use cookies and similar technologies to operate the Service and understand how it is used. See Section 5 for more detail.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Match candidates to relevant job listings and notify them of new roles</li>
            <li>Send job alerts, newsletters, and product updates (you may opt out at any time)</li>
            <li>Process payments and manage billing</li>
            <li>Communicate with you about your account, listings, or applications</li>
            <li>Detect and prevent fraud, abuse, and violations of our Terms of Service</li>
            <li>Analyse usage patterns to improve the Service</li>
            <li>Comply with our legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">4. How We Share Your Information</h2>
          <p>We do not sell your personal data to third parties.</p>
          <p>We may share your information with the following categories of third parties, only as necessary to operate the Service:</p>
          <ul>
            <li><strong>Payment processors:</strong> We use Stripe to process payments. Stripe handles your payment card data in accordance with its own privacy policy and PCI-DSS compliance obligations. We do not store your full card details.</li>
            <li><strong>Email service providers:</strong> We use third-party email infrastructure to deliver transactional emails and job alerts. These providers process your email address on our behalf.</li>
            <li><strong>Hosting and infrastructure providers:</strong> Our platform is hosted on third-party cloud infrastructure. These providers may process your data as part of hosting and operating the Service.</li>
          </ul>
          <p>We may also disclose your information if required to do so by law or in response to a valid legal request from a court or regulatory authority.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">5. Cookies</h2>
          <p>We use cookies and similar tracking technologies to operate and improve the Service:</p>
          <ul>
            <li><strong>Essential cookies:</strong> Required for authentication, session management, and core functionality. These cannot be disabled without impairing the Service.</li>
            <li><strong>Analytics cookies:</strong> Optional cookies that help us understand how users interact with the Service. You may decline these via our cookie consent banner.</li>
          </ul>
          <p>For full details on the cookies we use and how to manage them, please see our <a href="https://salesroles.co/cookies" className="text-primary hover:underline">Cookie Policy</a>.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">6. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. If you request deletion of your account, we will permanently delete your personal data within 30 days of receiving that request, except where we are required by law to retain certain information for longer.</p>
          <p>Anonymised or aggregated data that cannot be used to identify you may be retained indefinitely for analytical purposes.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">7. Your Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> The right to request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> The right to request that we correct inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> The right to request that we delete your personal data (the "right to be forgotten").</li>
            <li><strong>Data portability:</strong> The right to receive your personal data in a structured, machine-readable format.</li>
            <li><strong>Opt out of marketing:</strong> You may unsubscribe from marketing emails at any time by clicking the unsubscribe link in any email or by contacting us directly.</li>
          </ul>
          <p>If you are located in the European Union or the United Kingdom, the above rights are provided under the General Data Protection Regulation (GDPR) and the UK GDPR respectively. Users in other regions may have similar rights under applicable local law.</p>
          <p>To exercise any of these rights, please contact us at <a href="mailto:info@salesroles.co" className="text-primary hover:underline">info@salesroles.co</a>.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">8. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal data, including encryption in transit (TLS) and at rest, access controls, and regular security reviews.</p>
          <p>However, no method of transmission over the internet or method of electronic storage is completely secure. While we strive to protect your personal data, we cannot guarantee its absolute security. If you become aware of any security vulnerability relating to the Service, please notify us at info@salesroles.co.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">9. Third-Party Links</h2>
          <p>The Service may contain links to third-party websites, including employer websites and external job application portals. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any external sites you visit.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">10. Children</h2>
          <p>The Service is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from anyone under 18. If we become aware that we have collected data from a minor, we will delete it promptly. If you believe we have inadvertently collected such data, please contact us at info@salesroles.co.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify registered users by email and update the "Last updated" date at the top of this page. We encourage you to review this policy periodically.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">12. Contact</h2>
          <p>If you have any questions, concerns, or requests relating to this Privacy Policy or our data practices, please contact us at <a href="mailto:info@salesroles.co" className="text-primary hover:underline">info@salesroles.co</a>.</p>
        </section>
      </Card>
    </Container>
  )
}
