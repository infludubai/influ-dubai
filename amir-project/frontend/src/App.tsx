import { lazy, Suspense, useEffect, Component } from 'react'
import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { publicApi } from '@/api/public'
import PageLoader from '@/components/shared/PageLoader'
import PublicLayout from '@/components/layout/PublicLayout'
import PreviewLayout from '@/components/layout/PreviewLayout'
import ChatWidget from '@/components/chat/ChatWidget'
import PublicIntegrations from '@/components/integrations/PublicIntegrations'
import { useAuthStore } from '@/store/authStore'
import { ScrollToTop, BackToTopButton } from '@/components/shared/ScrollToTop'
import ProtectedRoute from '@/router/ProtectedRoute'
import AdminRoute from '@/router/AdminRoute'
import GuestRoute from '@/router/GuestRoute'

import Home from '@/pages/public/Home'
import Services from '@/pages/public/Services'
import Portfolio from '@/pages/public/Portfolio'
import Pricing from '@/pages/public/Pricing'
import About from '@/pages/public/About'
import Blog from '@/pages/public/Blog'
import Contact from '@/pages/public/Contact'
import PrivacyPolicy from '@/pages/public/PrivacyPolicy'
import Terms from '@/pages/public/Terms'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import GoogleCallback from '@/pages/auth/GoogleCallback'
import GithubCallback from '@/pages/auth/GithubCallback'
import Onboarding from '@/pages/auth/Onboarding'

const BlogPost          = lazy(() => import('@/pages/public/BlogPost'))
const CustomBuilderPage = lazy(() => import('@/pages/public/CustomBuilderPage'))
const BuilderPreview    = lazy(() => import('@/pages/public/BuilderPreview'))
const Checkout       = lazy(() => import('@/pages/checkout/Checkout'))
const Dashboard      = lazy(() => import('@/pages/client/Dashboard'))
const Orders         = lazy(() => import('@/pages/client/Orders'))
const OrderDetail    = lazy(() => import('@/pages/client/OrderDetail'))
const Invoices       = lazy(() => import('@/pages/client/Invoices'))
const Quotes         = lazy(() => import('@/pages/client/Quotes'))
const Messages       = lazy(() => import('@/pages/client/Messages'))
const Profile        = lazy(() => import('@/pages/client/Profile'))
const Progress       = lazy(() => import('@/pages/client/Progress'))
const AdminDash      = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminOrders    = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('@/pages/admin/AdminOrderDetail'))
const AdminPackages  = lazy(() => import('@/pages/admin/AdminPackages'))
const AdminAddons    = lazy(() => import('@/pages/admin/AdminAddons'))
const AdminPayments  = lazy(() => import('@/pages/admin/AdminPayments'))
const AdminInvoices  = lazy(() => import('@/pages/admin/AdminInvoices'))
const AdminPortfolio = lazy(() => import('@/pages/admin/AdminPortfolio'))
const AdminBlog      = lazy(() => import('@/pages/admin/AdminBlog'))
const AdminSettings  = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminIntegrations = lazy(() => import('@/pages/admin/AdminIntegrations'))
const AdminQuotes    = lazy(() => import('@/pages/admin/AdminQuotes'))
const AdminUsers     = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminBuilder   = lazy(() => import('@/pages/admin/AdminBuilder'))
const AdminPaymentMethods = lazy(() => import('@/pages/admin/AdminPaymentMethods'))
const AdminHeader    = lazy(() => import('@/pages/admin/AdminHeader'))
const AdminFooter    = lazy(() => import('@/pages/admin/AdminFooter'))
const AdminChats     = lazy(() => import('@/pages/admin/AdminChats'))

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: Error) { console.error("[ErrorBoundary]", err) }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fb] p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-slate-950 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-6">An unexpected error occurred. Please reload the page.</p>
        <button
          onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    )
    return this.props.children
  }
}

const W = ({ c }: { c: ReactNode }) => <Suspense fallback={<PageLoader />}>{c}</Suspense>

export default function App() {
  const { theme } = useThemeStore()
  const { user } = useAuthStore()

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    publicApi.settings().then((r) => {
      const s = r.data?.data || {}
      if (s.site_name) document.title = s.site_name
      if (s.favicon_url) {
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = s.favicon_url
      }
    }).catch(() => {})
  }, [])

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <PublicIntegrations />
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '10px', fontSize: '14px', fontWeight: 500 },
        success: { iconTheme: { primary: '#0c90e7', secondary: '#fff' } },
      }} />
      <Routes>
        {/* Public — everyone can view */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<W c={<BlogPost />} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/p/:slug" element={<W c={<CustomBuilderPage />} />} />
        </Route>

        {/* Builder preview — real pages inside builder iframe */}
        <Route element={<PreviewLayout />}>
          <Route path="/preview/:slug" element={<W c={<BuilderPreview />} />} />
        </Route>

        {/* Auth — guests only */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/github/callback" element={<GithubCallback />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* Checkout — login required, shown inside public layout */}
        <Route element={<PublicLayout />}>
          <Route path="/checkout" element={<ProtectedRoute><W c={<Checkout />} /></ProtectedRoute>} />
        </Route>

        {/* Client dashboard — login required */}
        <Route path="/dashboard" element={<ProtectedRoute><W c={<Dashboard />} /></ProtectedRoute>} />
        <Route path="/dashboard/orders" element={<ProtectedRoute><W c={<Orders />} /></ProtectedRoute>} />
        <Route path="/dashboard/orders/:id" element={<ProtectedRoute><W c={<OrderDetail />} /></ProtectedRoute>} />
        <Route path="/dashboard/invoices" element={<ProtectedRoute><W c={<Invoices />} /></ProtectedRoute>} />
        <Route path="/dashboard/quotes" element={<ProtectedRoute><W c={<Quotes />} /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><W c={<Messages />} /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><W c={<Profile />} /></ProtectedRoute>} />
        <Route path="/dashboard/progress" element={<ProtectedRoute><W c={<Progress />} /></ProtectedRoute>} />

        {/* Admin — admin role required */}
        <Route path="/admin" element={<AdminRoute><W c={<AdminDash />} /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><W c={<AdminOrders />} /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<AdminRoute><W c={<AdminOrderDetail />} /></AdminRoute>} />
        <Route path="/admin/packages" element={<AdminRoute><W c={<AdminPackages />} /></AdminRoute>} />
        <Route path="/admin/addons" element={<AdminRoute><W c={<AdminAddons />} /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><W c={<AdminPayments />} /></AdminRoute>} />
        <Route path="/admin/payment-methods" element={<AdminRoute><W c={<AdminPaymentMethods />} /></AdminRoute>} />
        <Route path="/admin/invoices" element={<AdminRoute><W c={<AdminInvoices />} /></AdminRoute>} />
        <Route path="/admin/portfolio" element={<AdminRoute><W c={<AdminPortfolio />} /></AdminRoute>} />
        <Route path="/admin/blog" element={<AdminRoute><W c={<AdminBlog />} /></AdminRoute>} />
        <Route path="/admin/quotes" element={<AdminRoute><W c={<AdminQuotes />} /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><W c={<AdminUsers />} /></AdminRoute>} />
        <Route path="/admin/chats" element={<AdminRoute><W c={<AdminChats />} /></AdminRoute>} />
        <Route path="/admin/header" element={<AdminRoute><W c={<AdminHeader />} /></AdminRoute>} />
        <Route path="/admin/footer" element={<AdminRoute><W c={<AdminFooter />} /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><W c={<AdminSettings />} /></AdminRoute>} />
        <Route path="/admin/integrations" element={<AdminRoute><W c={<AdminIntegrations />} /></AdminRoute>} />
        <Route path="/admin/builder" element={<AdminRoute><W c={<AdminBuilder />} /></AdminRoute>} />
        <Route path="/admin/builder/:slug" element={<AdminRoute><W c={<AdminBuilder />} /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BackToTopButton />
      {user?.role !== 'admin' && <ChatWidget />}
    </BrowserRouter>
    </ErrorBoundary>
  )
}
