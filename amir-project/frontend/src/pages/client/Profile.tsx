import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Camera, Save, Eye, EyeOff, User, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useNavigate } from "react-router-dom"
import api from "@/api/client"
import { authApi } from "@/api/auth"
import toast from "react-hot-toast"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import { isValidPhone } from "@/utils/validation"

export default function Profile() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<"info" | "password">("info")
  const [loggingOut, setLoggingOut] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [info, setInfo] = useState({
    name: user?.name || "",
    username: user?.username || "",
    company_name: user?.company_name || "",
    address: user?.address || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  })

  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  })

  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(info.phone)) {
      toast.error("Please enter a valid phone number.")
      return
    }
    setSaving(true)
    try {
      const res = await api.put("/auth/profile", { ...info, avatar })
      setUser(res.data.user)
      toast.success("Profile updated!")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.")
    } finally { setSaving(false) }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.password !== passwords.password_confirmation) {
      toast.error("Passwords do not match"); return
    }
    if (passwords.password.length < 8) {
      toast.error("Password must be at least 8 characters"); return
    }
    setSaving(true)
    try {
      await api.put("/auth/profile/password", passwords)
      toast.success("Password changed!")
      setPasswords({ current_password: "", password: "", password_confirmation: "" })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password.")
    } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authApi.logout()
    } catch { /* ignore — clear locally regardless */ } finally {
      logout()
      navigate('/login')
      toast.success('Logged out successfully.')
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatar(result)
      setInfo((current) => ({ ...current, avatar: result }))
      toast.success("Avatar ready. Save profile to apply.")
    }
    reader.readAsDataURL(file)
  }

  const inputClass = "w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <ClientPageHeader title="Account Details" description="Manage your personal information and password." />

        {/* Avatar */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
                </span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${user?.role === "admin" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
          >
            {loggingOut
              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              : <LogOut className="w-4 h-4" />
            }
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-card rounded-2xl border border-border p-1.5">
          <button onClick={() => setTab("info")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === "info" ? "gradient-brand text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
            Personal Info
          </button>
          <button onClick={() => setTab("password")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === "password" ? "gradient-brand text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
            Change Password
          </button>
        </div>

        {/* Info form */}
        {tab === "info" && (
          <motion.form onSubmit={handleInfoSave} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <Field label="Full Name">
              <input value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Your full name" className={inputClass} />
            </Field>
            <Field label="Username">
              <input value={info.username} onChange={e => setInfo({ ...info, username: e.target.value })} placeholder="username" className={inputClass} />
            </Field>
            <Field label="Company Name">
              <input value={info.company_name} onChange={e => setInfo({ ...info, company_name: e.target.value })} placeholder="Your company or brand" className={inputClass} />
            </Field>
            <Field label="Phone Number">
              <input value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} placeholder="+92 300 XXXXXXX" className={inputClass} />
            </Field>
            <Field label="Email Address">
              <input value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
            </Field>
            <Field label="Address" className="md:col-span-2">
              <textarea value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} rows={4} placeholder="Business address or billing address" className={`${inputClass} h-auto py-3`} />
            </Field>
            <button type="submit" disabled={saving}
              className="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </motion.form>
        )}

        {/* Password form */}
        {tab === "password" && (
          <motion.form onSubmit={handlePasswordSave} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <input type={showOld ? "text" : "password"} value={passwords.current_password}
                  onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                  placeholder="Enter current password" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={passwords.password}
                  onChange={e => setPasswords({ ...passwords, password: e.target.value })}
                  placeholder="Min 8 characters" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm New Password</label>
              <input type="password" value={passwords.password_confirmation}
                onChange={e => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                placeholder="Repeat new password" className={inputClass} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full gradient-brand text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Change Password</>}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  )
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
