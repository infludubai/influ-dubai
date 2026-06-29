import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'
import { authApi } from '@/api/auth'
import { publicApi } from '@/api/public'
import { useThemeStore } from '@/store/themeStore'
import toast from 'react-hot-toast'
import { fadeUp } from '@/utils/motion'
import { isStrongPassword, isValidPhone, passwordChecks, passwordScore } from '@/utils/validation'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoDark, setLogoDark] = useState<string>("")
  const [logoLight, setLogoLight] = useState<string>("")
  const [logoSize, setLogoSize] = useState({ width: "", height: "" })
  const [siteName, setSiteName] = useState<string>("Amir Nazir")
  const { theme } = useThemeStore()
  const logoUrl = theme === 'dark' ? (logoLight || logoDark) : (logoDark || logoLight)

  useEffect(() => {
    publicApi.settings().then((r) => {
      const s = r.data?.data || {}
      if (s.logo_url) setLogoDark(s.logo_url)
      if (s.logo_url_light) setLogoLight(s.logo_url_light)
      if (s.site_name) setSiteName(s.site_name)
      setLogoSize({ width: s.logo_auth_width || "", height: s.logo_auth_height || "" })
    }).catch(() => {})
  }, [])
  const navigate = useNavigate()

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const checks = passwordChecks(form.password)
  const score = passwordScore(form.password)
  const strengthLabel = score <= 1 ? 'Weak' : score <= 3 ? 'Good' : 'Strong'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!isValidPhone(form.phone)) {
      setErrors({ phone: 'Please enter a valid phone number.' })
      return
    }
    if (!isStrongPassword(form.password)) {
      setErrors({ password: 'Use 8+ characters with uppercase, number, and special character.' })
      return
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register(form)
      toast.success('Account created! Check your email for the verification OTP.')
      navigate(`/verify-otp?user_id=${res.data.user_id}&type=email_verify&email=${encodeURIComponent(res.data.email)}`)
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {}
        Object.entries(err.response.data.errors).forEach(([k, v]: any) => { errs[k] = v[0] })
        setErrors(errs)
      } else {
        setErrors({ name: err.response?.data?.message || 'Registration failed.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (name: string, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={name === 'password' || name === 'password_confirmation' ? (show ? 'text' : 'password') : type}
        value={form[name as keyof typeof form]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full h-11 px-3.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 ${errors[name] ? 'border-destructive' : 'border-input'}`}
      />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 py-12">
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
          <h1 className="font-heading font-bold text-2xl">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Start your digital journey today</p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name', 'Full Name', 'text', 'John Smith')}
            {field('email', 'Email Address', 'email', 'you@email.com')}
            {field('phone', 'Phone (optional)', 'tel', '+1 234 567 8900')}

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Password</label>
                <button type="button" onClick={() => setShow(!show)} className="text-xs text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-3.5 h-3.5 inline mr-1" /> : <Eye className="w-3.5 h-3.5 inline mr-1" />}
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                placeholder="Min 8 characters"
                className={`w-full h-11 px-3.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 ${errors.password ? 'border-destructive' : 'border-input'}`}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              {form.password && (
                <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Password strength</span>
                    <span className={score === 4 ? "font-semibold text-green-600" : "font-semibold text-amber-600"}>{strengthLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full ${i < score ? (score === 4 ? "bg-green-500" : "bg-amber-500") : "bg-muted"}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                    {checks.map((item) => (
                      <span key={item.label} className={item.passed ? "text-green-600" : ""}>{item.passed ? "✓" : "•"} {item.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                type={show ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={(e) => set('password_confirmation', e.target.value)}
                required
                placeholder="Repeat password"
                className={`w-full h-11 px-3.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 ${errors.password_confirmation ? 'border-destructive' : 'border-input'}`}
              />
              {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 gradient-brand text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
