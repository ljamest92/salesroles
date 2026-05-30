import React, { useEffect } from 'react'
import { Container, Card } from '@blinkdotnew/ui'

export function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <Container className="pt-20 pb-12 md:py-24 max-w-4xl space-y-12">
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Terms of <span className="text-primary">Service</span></h1>
      <Card className="p-8 border border-border bg-card/30 prose prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground">Last updated: May 2026</p>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using SalesRoles.co (the "Service"), you agree to be bound by these Terms of Service ("Terms"). These Terms apply to all visitors, registered users, job seekers, and employers who access the Service. If you do not agree to these Terms, you must not use the Service.</p>
          <p>We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">2. Description of Service</h2>
          <p>SalesRoles.co is a job board platform specialising in sales roles. The Service allows employers and recruiters to post job listings and allows sales professionals to search for and apply to those listings. A core feature of the Service is compensation transparency: all listings must display salary and compensation information upfront.</p>
          <p>We do not act as an employment agency and are not responsible for hiring decisions made by employers or the outcome of any application made by a candidate.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">3. User Accounts and Registration</h2>
          <p>To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date.</p>
          <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us immediately at info@salesroles.co if you become aware of any unauthorised use of your account.</p>
          <p>You must be at least 18 years of age to create an account. By registering, you confirm that you meet this requirement.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">4. Job Postings and Compensation Transparency Policy</h2>
          <p>All job listings posted on SalesRoles.co must include the following compensation information:</p>
          <ul>
            <li>A salary or base salary range</li>
            <li>On-target earnings (OTE) where variable compensation applies</li>
            <li>A description of the commission or bonus structure</li>
          </ul>
          <p>Listings that do not include this information will be rejected before going live. Our moderation team reviews all submissions and may request additional information before approving a listing.</p>
          <p>Employers are responsible for ensuring that the compensation information provided is accurate, realistic, and not misleading. Listings that display compensation figures that do not reflect the genuine compensation on offer — including inflated OTE projections that the majority of employees do not achieve — may be removed at our discretion.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">5. Payments and Refunds</h2>
          <p>Job listings are available at the following rates:</p>
          <ul>
            <li><strong>Standard Listing:</strong> $99 for 30 days</li>
            <li><strong>Featured Listing:</strong> $249 for 30 days</li>
          </ul>
          <p>All payments are processed securely via Stripe. By submitting payment, you authorise us to charge the applicable fee to your chosen payment method.</p>
          <p><strong>Refund policy:</strong> If your listing is reviewed and rejected by our moderation team before it goes live, you will receive a full refund. Once a listing has been approved and made live on the platform, no refund will be issued, regardless of whether the role is filled, the listing is withdrawn, or the listing expires before the 30-day period ends.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">6. Prohibited Content</h2>
          <p>You must not post or submit any content on the Service that:</p>
          <ul>
            <li>Contains discriminatory language based on age, gender, race, ethnicity, religion, sexual orientation, disability, or any other protected characteristic</li>
            <li>Makes misleading or fraudulent compensation claims, including OTE figures that do not reflect genuine earning potential for the stated role</li>
            <li>Describes commission-only roles without disclosing that no base salary is offered</li>
            <li>Is duplicative, repetitive, or submitted in a manner consistent with spam</li>
            <li>Violates any applicable employment law or regulation in the relevant jurisdiction</li>
            <li>Is false, inaccurate, or intentionally misleading</li>
            <li>Infringes the intellectual property rights of any third party</li>
          </ul>
          <p>We reserve the right to remove any listing or content that we determine, in our sole discretion, violates these rules or is otherwise inappropriate for the platform.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">7. Intellectual Property</h2>
          <p>All content on SalesRoles.co that is not submitted by users — including the website design, logo, text, graphics, and software — is owned by or licensed to SalesRoles.co and is protected by applicable intellectual property laws.</p>
          <p>By submitting a job listing or any other content to the Service, you grant SalesRoles.co a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute that content in connection with operating and promoting the Service.</p>
          <p>You retain ownership of content you submit. You represent that you have the right to submit that content and that it does not infringe the rights of any third party.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">8. Disclaimers and Limitation of Liability</h2>
          <p>The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
          <p>SalesRoles.co is not responsible for the accuracy of job listings, the conduct of employers or candidates, or the outcome of any hiring process facilitated through the platform.</p>
          <p>To the fullest extent permitted by applicable law, SalesRoles.co and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service, even if we have been advised of the possibility of such damages.</p>
          <p>Our total liability to you for any claim arising out of or related to the Service shall not exceed the amount paid by you to SalesRoles.co in the twelve months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">9. Privacy</h2>
          <p>Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">10. Termination</h2>
          <p>We may suspend or terminate your access to the Service at any time, with or without notice, if we believe you have violated these Terms or if we determine that your use of the Service is harmful to other users, third parties, or the integrity of the platform.</p>
          <p>You may terminate your account at any time by contacting us at info@salesroles.co or through your account settings. Termination does not entitle you to a refund for any paid listings.</p>
          <p>Provisions of these Terms that by their nature should survive termination — including intellectual property, disclaimers, and limitation of liability — shall survive.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">11. Changes to Terms</h2>
          <p>We may modify these Terms at any time. When we make material changes, we will update the "Last updated" date at the top of this page and, where appropriate, notify registered users by email. Your continued use of the Service after any changes take effect constitutes your acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">12. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which SalesRoles.co operates, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of that jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-bold mb-3">13. Contact</h2>
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:info@salesroles.co" className="text-primary hover:underline">info@salesroles.co</a>.</p>
        </section>
      </Card>
    </Container>
  )
}
