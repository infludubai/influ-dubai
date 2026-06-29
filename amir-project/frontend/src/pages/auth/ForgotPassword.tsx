import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'
import { fadeUp } from '@/utils/motion'

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (step === 'reset') {
      setTimeout(() => refs.current[0]?.focus(), 50)
    }
  }, [step])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email)
      if (res.data.user_id) setUserId(res.data.user_id)
      toast.success('If this email exists, a reset code has been sent.')
      setStep('reset')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleDigitKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!userId) { setError('Invalid session. Please start over.'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword({ user_id: userId, otp, password, password_confirmation: confirm })
      toast.success('Password reset! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      const msg = err.response?.data?.errors?.otp?.[0] || err.response?.data?.message || 'Failed to reset password.'
      setError(msg)
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
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
            animate={step === 'reset' ? { scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
          >
            {step === 'email' ? <Mail className="w-8 h-8 text-white" /> : <KeyRound className="w-8 h-8 text-white" />}
          </motion.div>
          <h1 className="font-heading font-bold text-2xl">
            {step === 'email' ? 'Forgot password?' : 'Reset password'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'email'
              ? "Enter your email and we'll send a 6-digit reset code."
              : <>Enter the code sent to <span className="font-medium text-foreground">{email}</span></>
            }
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

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 gradient-brand text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              {/* 6-box OTP input — same design as VerifyOtp */}
              <div>
                <p className="text-sm font-medium mb-3 text-center">Enter your 6-digit code</p>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <motion.input
                      key={i}
                      ref={(el) => { refs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKey(i, e)}
                      disabled={loading}
                      whileFocus={{ scale: 1.05 }}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-0 ${
                        d ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground'
                      } ${loading ? 'opacity-50' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">New Password</label>
                  <button type="button" onClick={() => setShow(!show)}
                    className="text-xs text-muted-foreground flex items-center gap-1">
                    {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={show ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input
                  type={show ? 'text' : 'password'} required value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-11 gradient-brand text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                <button type="button" onClick={() => { setStep('email'); setDigits(['','','','','','']); setError('') }}
                  className="text-primary hover:underline">
                  Use a different email
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
