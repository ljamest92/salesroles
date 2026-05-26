import React from 'react'
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { PostJobPage } from './pages/PostJobPage'
import { PricingPage } from './pages/PricingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { BlogPage } from './pages/BlogPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { FAQPage } from './pages/FAQPage'
import { SEOLandingPage } from './pages/SEOLandingPage'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { CookiePolicyPage } from './pages/CookiePolicyPage'
import { SalaryInsightsPage } from './pages/SalaryInsightsPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { CompanyProfilePage } from './pages/CompanyProfilePage'
import { RegistrationPage } from './pages/RegistrationPage'
import { ProfileEditPage } from './pages/ProfileEditPage'
import { PostJobSuccessPage } from './pages/PostJobSuccessPage'
import { RemoteSalesJobsPage } from './pages/RemoteSalesJobsPage'
import { CandidateProfilePage } from './pages/CandidateProfilePage'
import { CandidateSearchPage } from './pages/CandidateSearchPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { CompanyApplicantPage } from './pages/CompanyApplicantPage'

const rootRoute = createRootRoute({
  component: () => <AppLayout />,
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const jobsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/jobs', component: JobsPage })
const jobDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/jobs/$slug', component: JobDetailPage })
const postJobRoute = createRoute({ getParentRoute: () => rootRoute, path: '/post-job', component: PostJobPage })
const pricingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pricing', component: PricingPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegistrationPage })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: RegistrationPage })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: DashboardPage })
const companyDashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/company/dashboard', component: DashboardPage })
const candidateDashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/candidate/dashboard', component: DashboardPage })
const profileEditRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard/profile', component: ProfileEditPage })
const postJobSuccessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/post-job/success', component: PostJobSuccessPage })
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminPage })
const adminLoginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin/login', component: AdminLoginPage })
const blogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/blog', component: BlogPage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage })
const faqRoute = createRoute({ getParentRoute: () => rootRoute, path: '/faq', component: FAQPage })
const companyProfileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/company/$id', component: CompanyProfilePage })
const termsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/terms', component: TermsPage })
const privacyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/privacy', component: PrivacyPage })
const cookiesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cookies', component: CookiePolicyPage })
const salaryInsightsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/salary-insights', component: SalaryInsightsPage })

const candidateProfileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile/$identifier', component: CandidateProfilePage })
const candidateSearchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/companies/candidates', component: CandidateSearchPage })
const authCallbackRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/callback', component: AuthCallbackPage })
const companyApplicantRoute = createRoute({ getParentRoute: () => rootRoute, path: '/candidates/$id', component: CompanyApplicantPage })

// SEO Routes
const remoteJobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/remote-sales-jobs',
  component: RemoteSalesJobsPage
})
const aeJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/account-executive-jobs', 
  component: () => <SEOLandingPage title="Account Executive Jobs" keyword="Account Executive" description="The ultimate list of AE roles at high-growth SaaS and tech companies." /> 
})
const sdrJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/sales-development-representative-jobs', 
  component: () => <SEOLandingPage title="SDR Jobs" keyword="SDR" description="Kickstart your sales career with verified Sales Development Representative roles." /> 
})
const bdJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/business-development-jobs', 
  component: () => <SEOLandingPage title="Business Development Jobs" keyword="Business Development" description="Strategic BD roles at market-leading organizations." /> 
})
const australiaJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/sales-jobs-australia', 
  component: () => <SEOLandingPage title="Sales Jobs in Australia" keyword="Australia" description="Browse premium sales opportunities across Sydney, Melbourne, and more." /> 
})
const ukJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/sales-jobs-uk', 
  component: () => <SEOLandingPage title="Sales Jobs in the UK" keyword="UK" description="Find top sales roles in London, Manchester, and throughout the United Kingdom." /> 
})
const usaJobsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/sales-jobs-usa', 
  component: () => <SEOLandingPage title="Sales Jobs in the USA" keyword="USA" description="The best sales careers in the United States, from NYC to Silicon Valley." /> 
})

const routeTree = rootRoute.addChildren([
  indexRoute, 
  jobsRoute, 
  jobDetailRoute, 
  postJobRoute, 
  pricingRoute, 
  registerRoute,
  loginRoute,
  dashboardRoute, 
  companyDashboardRoute,
  candidateDashboardRoute,
  profileEditRoute,
  postJobSuccessRoute,
  adminRoute, 
  adminLoginRoute,
  blogRoute, 
  aboutRoute, 
  contactRoute, 
  faqRoute,
  companyProfileRoute,
  termsRoute,
  privacyRoute,
  cookiesRoute,
  salaryInsightsRoute,
  candidateProfileRoute,
  candidateSearchRoute,
  authCallbackRoute,
  companyApplicantRoute,
  remoteJobsRoute,
  aeJobsRoute,
  sdrJobsRoute,
  bdJobsRoute,
  australiaJobsRoute,
  ukJobsRoute,
  usaJobsRoute
])

const router = createRouter({ routeTree } as any)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}