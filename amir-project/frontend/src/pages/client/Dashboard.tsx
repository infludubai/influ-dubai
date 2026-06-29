import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer, scaleIn } from "@/utils/motion"
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  FileText,
  LogOut,
  MessageSquare,
  PackageCheck,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react"
import api from "@/api/client"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import toast from "react-hot-toast"
import ThemeToggle from "@/components/shared/ThemeToggle"

const statusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

function money(value: unknown) {
  return `$${Number(value || 0).toLocaleString()}`
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await authApi.logout() } catch { /* ignore */ } finally {
      logout()
      navigate('/login')
      toast.success('Logged out successfully.')
    }
  }

  useEffect(() => {
    Promise.allSettled([
      api.get("/client/orders"),
      api.get("/client/invoices"),
      api.get("/client/quotes"),
    ]).then(([ordersResult, invoicesResult, quotesResult]) => {
      if (ordersResult.status === "fulfilled") setOrders(ordersResult.value.data.data ?? [])
      if (invoicesResult.status === "fulfilled") setInvoices(invoicesResult.value.data.data ?? [])
      if (quotesResult.status === "fulfilled") setQuotes(quotesResult.value.data.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const activeOrder = useMemo(() => orders.find((order) => !["completed", "cancelled", "rejected"].includes(order.status)) || orders[0], [orders])
  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "paid")
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)

  const navCards = [
    { label: "Orders", to: "/dashboard/orders", icon: ShoppingBag, desc: "Track every project order", stat: orders.length },
    { label: "Invoices", to: "/dashboard/invoices", icon: Receipt, desc: "View and download billing", stat: invoices.length },
    { label: "Quotes", to: "/dashboard/quotes", icon: FileText, desc: "Review custom requests", stat: quotes.length },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare, desc: "Talk with support", stat: "Open" },
  ]

  const statCards = [
    { icon: ShoppingBag, label: "Orders", value: orders.length, to: "/dashboard/orders", color: "blue" },
    { icon: Receipt, label: "Open Invoices", value: unpaidInvoices.length, to: "/dashboard/invoices", color: "amber" },
    { icon: PackageCheck, label: "Total Spend", value: money(totalSpent), to: "/dashboard/invoices", color: "emerald" },
    { icon: ShieldCheck, label: "Account", value: user?.email_verified_at ? "Verified" : "Active", to: "/dashboard/profile", color: "violet" },
  ]

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.header
          variants={fadeUp} initial="hidden" animate="visible"
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || ""} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">My Account</p>
              <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] || "Client"}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Sparkles className="h-4 w-4" /> Start New Project
            </Link>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              <ExternalLink className="h-4 w-4" /> Visit Website
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-card px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-60 transition-colors"
            >
              {loggingOut
                ? <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                : <LogOut className="h-4 w-4" />
              }
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </motion.header>

        <motion.section
          variants={staggerContainer} initial="hidden" animate="visible"
          className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((m, i) => (
            <motion.div key={m.label} variants={scaleIn} custom={i}>
              <StatCard icon={m.icon} label={m.label} value={m.value} to={m.to} color={m.color} loading={loading} />
            </motion.div>
          ))}
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <motion.div
              variants={staggerContainer} initial="hidden" animate="visible"
              className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {navCards.map((item, i) => (
                <motion.div key={item.to} variants={fadeUp} custom={i} className="h-full">
                <Link to={item.to} className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{item.stat}</span>
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{item.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug flex-1">{item.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Recent Orders</h2>
                  <p className="text-sm text-muted-foreground">Latest project activity in your account.</p>
                </div>
                <Link to="/dashboard/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
              </div>
              {orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" text="Choose a package when you are ready to begin." action="Browse Packages" to="/pricing" />
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <Link key={order.id} to={`/dashboard/orders/${order.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 transition hover:border-blue-200 hover:bg-blue-50/40 dark:hover:bg-blue-950/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{order.order_number}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {String(order.status || "pending").replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{order.package?.name || "Custom project"} · {money(order.total_price)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <aside className="space-y-6">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Account Details</h2>
                  <p className="text-sm text-muted-foreground">Profile, company, address, phone, avatar, and password.</p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Name</span><span className="font-semibold text-foreground">{user?.name || "-"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Company</span><span className="font-semibold text-foreground">{user?.company_name || "-"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Phone</span><span className="font-semibold text-foreground">{user?.phone || "-"}</span></div>
              </div>
              <Link to="/dashboard/profile" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Edit Account Details <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm">
              <div className="bg-blue-600 p-5">
                <p className="text-sm text-blue-100">Active Project</p>
                <h2 className="mt-1 font-heading text-xl font-bold">{activeOrder?.package?.name || "No active project"}</h2>
              </div>
              <div className="p-5">
                {activeOrder ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order</span>
                      <span className="font-semibold">{activeOrder.order_number}</span>
                    </div>
                    <div className="mb-5 h-2 rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4 text-blue-300" />
                      Current status: {String(activeOrder.status || "pending").replace("_", " ")}
                    </div>
                    <Link to="/dashboard/progress" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                      Track Progress <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <EmptyDark />
                )}
              </div>
            </motion.div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-foreground">Billing</h2>
                <Link to="/dashboard/invoices" className="text-sm font-semibold text-blue-600">Invoices</Link>
              </div>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{money(invoice.total)} · {invoice.status}</p>
                      </div>
                      <a href={`${import.meta.env.VITE_API_URL?.replace('/api','') || ''}/api/client/invoices/${invoice.id}/download`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600">PDF</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

const colorMap: Record<string, { bg: string; icon: string; border: string; text: string }> = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600",   border: "hover:border-blue-200",   text: "text-blue-600" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",  icon: "text-amber-600",  border: "hover:border-amber-200",  text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30",icon: "text-emerald-600",border: "hover:border-emerald-200",text: "text-emerald-600" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-600", border: "hover:border-violet-200", text: "text-violet-600" },
}

function StatCard({ icon: Icon, label, value, to, color, loading }: { icon: any; label: string; value: React.ReactNode; to: string; color: string; loading: boolean }) {
  const c = colorMap[color] || colorMap.blue
  return (
    <Link to={to} className={`group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${c.border} block`}>
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className={`h-4 w-4 ${c.text} opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5`} />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-heading text-2xl font-bold text-foreground`}>{loading ? "…" : value}</p>
    </Link>
  )
}

function EmptyState({ icon: Icon, title, text, action, to }: { icon: any; title: string; text: string; action: string; to: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{action}</Link>
    </div>
  )
}

function EmptyDark() {
  return (
    <div className="text-center">
      <PackageCheck className="mx-auto mb-3 h-10 w-10 text-white/25" />
      <p className="font-semibold">No project in progress</p>
      <p className="mt-1 text-sm text-white/50">Start with a package or request a quote.</p>
      <Link to="/pricing" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">Browse Packages</Link>
    </div>
  )
}
