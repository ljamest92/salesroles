import React, { useEffect } from 'react'
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useLocation } from '@tanstack/react-router'
import { AppLayout } from './layouts/AppLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { HomePage } from './pages/HomePage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { PostJobPage } from './pages/PostJobPage'
import { PricingPage } from './pages/PricingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
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

function ScrollToTop() {
  const pathname = useLocation({ select: (l) => l.pathname })
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  ),
})

// Pathless layout route for all public/marketing pages (navbar + footer)
const marketingLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'marketing',
  component: AppLayout,
})

// Pathless layout route for all dashboard/admin pages (no navbar, no footer)
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboard',
  component: DashboardLayout,
})

// --- Marketing routes ---
const indexRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/', component: HomePage })
const jobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/jobs',
  component: JobsPage,
  scrollRestoration: false,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || undefined,
  }),
})
const jobDetailRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/jobs/$slug', component: JobDetailPage })
const postJobRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/post-job', component: PostJobPage })
const pricingRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/pricing', component: PricingPage })
const registerRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/register', component: RegistrationPage })
const loginRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/login', component: RegistrationPage })
const postJobSuccessRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/post-job/success', component: PostJobSuccessPage })
const blogRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/blog', component: BlogPage })
const blogPostRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/blog/$slug', component: BlogPostPage })
const aboutRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/about', component: AboutPage })
const contactRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/contact', component: ContactPage })
const faqRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/faq', component: FAQPage })
const companyProfileRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/company/$id', component: CompanyProfilePage })
const termsRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/terms', component: TermsPage })
const privacyRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/privacy', component: PrivacyPage })
const cookiesRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/cookies', component: CookiePolicyPage })
const salaryInsightsRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/salary-insights', component: SalaryInsightsPage })
const candidateProfileRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/profile/$identifier', component: CandidateProfilePage })
const candidateSearchRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/companies/candidates', component: CandidateSearchPage })
const authCallbackRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/auth/callback', component: AuthCallbackPage })
const companyApplicantRoute = createRoute({ getParentRoute: () => marketingLayoutRoute, path: '/candidates/$id', component: CompanyApplicantPage })

// SEO routes
const remoteJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/remote-sales-jobs',
  component: RemoteSalesJobsPage,
})
const aeJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/account-executive-jobs',
  component: () => <SEOLandingPage title="Account Executive Jobs" keyword="Account Executive" description="The ultimate list of AE roles at high-growth SaaS and tech companies." />,
})
const sdrJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/sales-development-representative-jobs',
  component: () => <SEOLandingPage title="SDR Jobs" keyword="SDR" description="Kickstart your sales career with verified Sales Development Representative roles." />,
})
const bdJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/business-development-jobs',
  component: () => <SEOLandingPage title="Business Development Jobs" keyword="Business Development" description="Strategic BD roles at market-leading organizations." />,
})
const australiaJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/sales-jobs-australia',
  component: () => <SEOLandingPage title="Sales Jobs in Australia" keyword="Australia" description="Browse premium sales opportunities across Sydney, Melbourne, and more." />,
})
const ukJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/sales-jobs-uk',
  component: () => <SEOLandingPage title="Sales Jobs in the UK" keyword="UK" description="Find top sales roles in London, Manchester, and throughout the United Kingdom." />,
})
const usaJobsRoute = createRoute({
  getParentRoute: () => marketingLayoutRoute,
  path: '/sales-jobs-usa',
  component: () => <SEOLandingPage title="Sales Jobs in the USA" keyword="USA" description="The best sales careers in the United States, from NYC to Silicon Valley." />,
})

// --- Dashboard routes ---
const dashboardRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/dashboard', component: DashboardPage })
const companyDashboardRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/company/dashboard', component: DashboardPage })
const candidateDashboardRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/candidate/dashboard', component: DashboardPage })
const profileEditRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/dashboard/profile', component: ProfileEditPage })
const adminRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/admin', component: AdminPage })
const adminLoginRoute = createRoute({ getParentRoute: () => dashboardLayoutRoute, path: '/admin/login', component: AdminLoginPage })

const routeTree = rootRoute.addChildren([
  marketingLayoutRoute.addChildren([
    indexRoute,
    jobsRoute,
    jobDetailRoute,
    postJobRoute,
    pricingRoute,
    registerRoute,
    loginRoute,
    postJobSuccessRoute,
    blogRoute,
    blogPostRoute,
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
    usaJobsRoute,
  ]),
  dashboardLayoutRoute.addChildren([
    dashboardRoute,
    companyDashboardRoute,
    candidateDashboardRoute,
    profileEditRoute,
    adminRoute,
    adminLoginRoute,
  ]),
])

const router = createRouter({ routeTree, scrollRestoration: false } as any)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
