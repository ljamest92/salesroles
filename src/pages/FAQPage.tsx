import React, { useState } from 'react'
import {
  Container,
  Card,
  Badge,
  Tabs as UITabs,
  TabsContent as UITabsContent
} from '@blinkdotnew/ui'

const Tabs = UITabs as any;
const TabsContent = UITabsContent as any;

export function FAQPage() {
  const [activeTab, setActiveTab] = useState('candidates')

  const tabLabels: Record<string, string> = {
    candidates: 'For Candidates',
    companies: 'For Companies',
    about: 'About Us',
  }

  const faqs: Record<string, { q: string; a: string }[]> = {
    candidates: [
      { q: "Is it free to find and apply for jobs on SalesRoles.co?", a: "Yes, SalesRoles.co is completely free for candidates. You can browse all listings, create a profile, save jobs, and apply at no cost." },
      { q: "How do job alerts work?", a: "Sign up for job alerts and we will email you every Monday morning with new roles matching your preferences including role type, location, and salary range." },
      { q: "What does Transparent OTE mean?", a: "Every listing on SalesRoles.co must display the full compensation package including base salary, OTE, and commission structure. Transparent OTE means you see the full picture before you apply." },
      { q: "How do I save jobs?", a: "Create a free candidate account and click Save Job on any listing. All saved jobs appear in your candidate dashboard." },
      { q: "How do I create a candidate profile?", a: "Register with your email or sign up with Google or LinkedIn. Complete your profile including your current role, experience, location, and salary expectations. Set your visibility to allow companies to find you." },
      { q: "Can companies contact me directly?", a: "If your profile is set to visible, companies browsing candidate profiles can view your details. You will receive an email notification when a company views your profile." },
      { q: "How do I report a listing?", a: "Click the Report button on any job listing and select the reason. Our team reviews all reports within 24 hours." }
    ],
    companies: [
      { q: "How does the listing approval process work?", a: "After payment your listing is reviewed by our team within 24 hours to ensure it meets our compensation transparency standards. You will receive an email confirmation when it goes live." },
      { q: "What happens if my listing is rejected?", a: "If your listing does not meet our standards your listing will be rejected and you will receive a full refund immediately and an explanation of why it was rejected." },
      { q: "Can I edit my listing after it goes live?", a: "Yes. Log into your company dashboard, find the listing, and click Edit. You can update the job title, description, and compensation details at any time." },
      { q: "What is the difference between Standard and Featured?", a: "Standard listings appear in the main job feed ordered by date. Featured listings are pinned to the top of the feed and search results for 30 days giving significantly more visibility." },
      { q: "How does the annual subscription work?", a: "The Unlimited plan at $999 per year gives you unlimited standard listings for 12 months. You can post as many roles as you need without paying per listing." },
      { q: "What is your refund policy?", a: "Listings rejected by our admin team receive a full immediate refund. Approved listings that have gone live are non-refundable." },
      { q: "How do I access my company dashboard?", a: "Log in with your company email and password at salesroles.co and click Company Dashboard in the navigation." },
      { q: "Can I browse candidate profiles?", a: "Yes. Company accounts can browse all candidate profiles that have been set to visible by the candidate." }
    ],
    about: [
      { q: "Why is compensation transparency mandatory?", a: "We built SalesRoles.co because sales professionals waste too much time applying to roles with no salary information and getting lowballed at offer stage. Mandatory transparency means candidates know the deal before they apply and companies attract serious pre-qualified applicants." },
      { q: "What regions do you cover?", a: "SalesRoles.co lists sales roles globally with a strong focus on Australia, the United Kingdom, and the United States." },
      { q: "How do you verify companies?", a: "Companies that complete our verification process receive a Verified Team badge on their profile and listings." },
      { q: "Who runs SalesRoles.co?", a: "SalesRoles.co is an independent platform built exclusively for sales professionals. We are not affiliated with any recruiter or staffing agency." }
    ]
  }

  return (
    <div className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-24 animate-fade-in">
      <Container className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Help Center</Badge>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none">
            Frequently Asked <span className="text-primary">Questions.</span>
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Everything you need to know about the world's most transparent sales job board.
        </p>
      </Container>

      <Container className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-12">
            <div className="bg-card border border-border p-1 rounded-xl flex flex-col sm:flex-row sm:justify-center w-full gap-0.5">
              {Object.keys(faqs).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  {...(tab === 'companies' ? { style: { border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent', WebkitAppearance: 'none', appearance: 'none' } } : {})}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 font-bold tracking-tight text-sm rounded-lg transition-colors${tab === 'companies' ? ' border-0 outline-none shadow-none ring-0 bg-transparent' : ''} ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(faqs).map(([category, items]) => (
            <TabsContent key={category} value={category} className="space-y-6 animate-fade-in">
              {items.map((item, i) => (
                <Card key={i} className="p-8 border border-border bg-card/30 space-y-4">
                  <h3 className="text-xl font-bold text-foreground">"{item.q}"</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </div>
  )
}
