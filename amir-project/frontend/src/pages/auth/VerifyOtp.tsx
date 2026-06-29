import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { fadeUp } from '@/utils/motion'
import { safeLocalStorage } from '@/utils/safeStorage'

export default function VerifyOtp() {
  const [params] = useSearchParams()
  const userId = Number(params.get('user_id'))
  const type = params.get('type') as 'email_verify' | 'new_device'
  const email = params.get('email') ?? ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every((d) => d) && next.join('').length === 6) {
      submitOtp(next.join(''))
    }
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setDigits(next)
      refs.current[5]?.focus()
      submitOtp(pasted)
    }
  }

  const submitOtp = async (code: string) => {
    setError('')
    setLoading(true)
    try {
      const fn = type === 'email_verify' ? authApi.verifyEmail : authApi.verifyDevice
      const res = await fn(userId, code)
      setAuth(res.data.user, res.data.token)
      toast.success(type === 'email_verify' ? 'Email verified! Welcome!' : 'Device verified!')
      if (res.data.user.role === 'admin') {
        navigate('/admin')
      } else {
        const onboardingDone = safeLocalStorage.getItem('onboarding_done')
        const isNewUser = !res.data.user.phone && !res.data.user.company_name
        if (!onboardingDone && isNewUser) {
          navigate('/onboarding')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.errors?.otp?.[0] || err.response?.data?.message || 'Invalid OTP.'
      setError(msg)
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await authApi.resendOtp(userId, type)
      setCooldown(60)
      toast.success('New OTP sent to your email.')
    } catch (err: any) {
      const cd = err.response?.data?.cooldown
      if (cd) setCooldown(cd)
      toast.error(err.response?.data?.message || 'Failed to resend OTP.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-sm">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Verify your {type === 'new_device' ? 'device' : 'email'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-foreground">{email || 'your email'}</span>
          </p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3 mb-5 text-center">
              {error}
            </motion.div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <motion.input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                disabled={loading}
                whileFocus={{ scale: 1.05 }}
                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-0 ${
                  d ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground'
                } ${loading ? 'opacity-50' : ''}`}
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-primary font-medium hover:underline disabled:text-muted-foreground disabled:no-underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
