import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authApi } from '@/api/auth'
import { publicApi } from '@/api/public'
import toast from 'react-hot-toast'
import { fadeUp } from '@/utils/motion'
import { safeSessionStorage } from '@/utils/safeStorage'

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oauth, setOauth] = useState({ google: false, github: false })
  const [logoDark, setLogoDark] = useState<string>("")
  const [logoLight, setLogoLight] = useState<string>("")
  const [logoSize, setLogoSize] = useState({ width: "", height: "" })
  const [siteName, setSiteName] = useState<string>("Amir Nazir")
  const { setAuth } = useAuthStore()
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('returnTo') || null

  const logoUrl = theme === 'dark' ? (logoLight || logoDark) : (logoDark || logoLight)

  useEffect(() => {
    publicApi.settings().then((response) => {
      const settings = response.data.data || {}
      setOauth({
        google: Boolean(settings.google_client_id),
        github: Boolean(settings.github_client_id),
      })
      if (settings.logo_url) setLogoDark(settings.logo_url)
      if (settings.logo_url_light) setLogoLight(settings.logo_url_light)
      if (settings.site_name) setSiteName(settings.site_name)
      setLogoSize({
        width: settings.logo_auth_width || "",
        height: settings.logo_auth_height || "",
      })
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(login, password)
      const { data } = res

      if (data.requires_verification) {
        navigate(`/verify-otp?user_id=${data.user_id}&type=email_verify`)
        return
      }
      if (data.requires_device_verification) {
        navigate(`/verify-otp?user_id=${data.user_id}&type=new_device`)
        return
      }

      setAuth(data.user, data.token)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)

      if (data.user.role === 'admin') {
        // Admin: use returnTo if it's an admin path, otherwise go to /admin
        const dest = returnTo && returnTo.startsWith('/admin') ? returnTo : '/admin'
        navigate(dest)
      } else {
        // Client: use returnTo, but never allow going to /admin
        const dest = returnTo && !returnTo.startsWith('/admin') ? returnTo : '/dashboard'
        navigate(dest)
      }
    } catch (err: any) {
      const msg = err.response?.data?.errors?.login?.[0]
        || err.response?.data?.message
        || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setLoading(true)
    try {
      if (returnTo) {
        safeSessionStorage.setItem('oauth_return_to', returnTo)
      }
      const res = await authApi.githubAuthUrl()
      window.location.href = res.data.url
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start GitHub login'
      toast.error(msg)
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // Save return path in sessionStorage for callback to retrieve
      if (returnTo) {
        safeSessionStorage.setItem('oauth_return_to', returnTo)
      }

      // Get the Google OAuth authorization URL
      const res = await authApi.googleAuthUrl()
      const { url } = res.data

      // Redirect to Google OAuth
      window.location.href = url
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start Google login'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </Link>
          {logoUrl ? (
            <img src={logoUrl} alt={siteName}
              style={{
                height: logoSize.height ? `${logoSize.height}px` : '40px',
                width: logoSize.width ? `${logoSize.width}px` : 'auto',
              }}
              className="object-contain mx-auto mb-1" />
          ) : (
            <div className="font-heading font-bold text-2xl gradient-text mb-1">{siteName}</div>
          )}
          <h1 className="font-heading font-bold text-2xl text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email or Username</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                placeholder="you@email.com or username"
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full h-11 px-3.5 pr-10 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 gradient-brand text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!oauth.google || loading}
                onClick={() => handleGoogleLogin()}
                className={`h-11 rounded-lg border text-sm font-semibold transition ${
                  oauth.google
                    ? 'border-border text-foreground hover:bg-accent active:scale-95 disabled:opacity-60'
                    : 'border-border text-muted-foreground opacity-70 cursor-not-allowed'
                }`}
              >
                {loading ? '...' : 'Google'}
              </button>
              <button
                type="button"
                disabled={!oauth.github || loading}
                onClick={() => handleGithubLogin()}
                className={`h-11 rounded-lg border text-sm font-semibold transition ${
                  oauth.github
                    ? 'border-border text-foreground hover:bg-accent active:scale-95 disabled:opacity-60'
                    : 'border-border text-muted-foreground opacity-70 cursor-not-allowed'
                }`}
              >
                {loading ? '...' : 'GitHub'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
