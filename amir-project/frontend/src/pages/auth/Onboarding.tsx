import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Building2, User, Globe, Search, Megaphone,
  Palette, ShoppingCart, Wrench, Loader2, CheckCircle2, Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { safeLocalStorage } from '@/utils/safeStorage'
import { isValidPhone } from '@/utils/validation'

const INDUSTRIES = [
  'Technology', 'E-Commerce / Retail', 'Healthcare', 'Real Estate', 'Education',
  'Finance', 'Restaurant / Food', 'Hospitality', 'Construction', 'Legal',
  'Marketing / Agency', 'Consulting', 'Fitness / Wellness', 'Other',
]

const GOALS = [
  { icon: Globe,       label: 'Build a Website',       value: 'website' },
  { icon: Search,      label: 'Improve SEO',           value: 'seo' },
  { icon: Megaphone,   label: 'Digital Marketing',     value: 'marketing' },
  { icon: Palette,     label: 'Branding & Logo',       value: 'branding' },
  { icon: ShoppingCart,label: 'Online Store',          value: 'ecommerce' },
  { icon: Wrench,      label: 'Website Maintenance',   value: 'maintenance' },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    account_type: '' as 'business' | 'individual' | '',
    name:         user?.name || '',
    company_name: '',
    phone:        user?.phone || '',
    industry:     '',
    goals:        [] as string[],
  })

  const totalSteps = 3

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const toggleGoal = (val: string) => {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(val) ? f.goals.filter(g => g !== val) : [...f.goals, val],
    }))
  }

  const finish = async () => {
    if (!isValidPhone(form.phone)) {
      toast.error('Please enter a valid phone number.')
      return
    }
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', {
        name:         form.name,
        phone:        form.phone || undefined,
        account_type: form.account_type,
        company_name: form.company_name || undefined,
        industry:     form.industry || undefined,
        goals:        form.goals.join(', ') || undefined,
      })
      if (res.data?.user) setUser(res.data.user)
      safeLocalStorage.setItem('onboarding_done', '1')
      toast.success('Welcome! Your account is all set.')
      navigate('/dashboard')
    } catch {
      toast.error('Could not save details. You can update them in your profile.')
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const skip = () => {
    safeLocalStorage.setItem('onboarding_done', '1')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-white/70 text-sm">Quick Setup — {step}/{totalSteps}</span>
          </div>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-8 bg-primary' : i + 1 < step ? 'w-4 bg-green-400' : 'w-4 bg-white/15'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          <AnimatePresence custom={dir} mode="wait">
            {/* ── Step 1: Account type ── */}
            {step === 1 && (
              <motion.div key="step1" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8"
              >
                <h2 className="font-heading font-bold text-2xl text-slate-950 mb-1">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</h2>
                <p className="text-slate-500 text-sm mb-7">Let's set up your account in 3 quick steps.</p>

                <p className="text-sm font-semibold text-slate-700 mb-4">Are you a business or individual?</p>
                <div className="grid grid-cols-2 gap-4 mb-7">
                  {([
                    { type: 'business',   Icon: Building2, label: 'Business', desc: 'Company, agency, or brand' },
                    { type: 'individual', Icon: User,      label: 'Individual', desc: 'Freelancer, creator, or personal' },
                  ] as const).map(({ type, Icon, label, desc }) => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, account_type: type }))}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${form.account_type === type ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${form.account_type === type ? 'gradient-brand' : 'bg-slate-100'}`}>
                        <Icon className={`w-5 h-5 ${form.account_type === type ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => go(2)}
                  disabled={!form.account_type}
                  className="w-full gradient-brand text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={skip} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition">
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Details ── */}
            {step === 2 && (
              <motion.div key="step2" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8"
              >
                <h2 className="font-heading font-bold text-2xl text-slate-950 mb-1">About {form.account_type === 'business' ? 'your business' : 'you'}</h2>
                <p className="text-slate-500 text-sm mb-7">Help us personalize your experience.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Your Full Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                      placeholder="Amir Nazir" />
                  </div>

                  {form.account_type === 'business' && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Company / Brand Name</label>
                      <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                        placeholder="Acme Corp" />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                      placeholder="+971 50 123 4567" type="tel" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Industry</label>
                    <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-white">
                      <option value="">Select your industry…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-7">
                  <button onClick={() => go(1)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">← Back</button>
                  <button onClick={() => go(3)} disabled={!form.name.trim()}
                    className="flex-1 gradient-brand text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Goals ── */}
            {step === 3 && (
              <motion.div key="step3" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8"
              >
                <h2 className="font-heading font-bold text-2xl text-slate-950 mb-1">What are you looking for?</h2>
                <p className="text-slate-500 text-sm mb-7">Select all that apply — this helps us show you the right services.</p>

                <div className="grid grid-cols-2 gap-3 mb-7">
                  {GOALS.map(({ icon: Icon, label, value }) => {
                    const selected = form.goals.includes(value)
                    return (
                      <button key={value} onClick={() => toggleGoal(value)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${selected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'gradient-brand' : 'bg-slate-100'}`}>
                          <Icon className={`w-4.5 h-4.5 ${selected ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs leading-tight">{label}</p>
                          {selected && <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => go(2)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">← Back</button>
                  <button onClick={finish} disabled={saving}
                    className="flex-1 gradient-brand text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Finish Setup</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
