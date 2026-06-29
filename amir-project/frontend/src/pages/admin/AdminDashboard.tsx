import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ShoppingBag, Users, FileText, DollarSign, MessageSquare, Clock,
  Package, Settings, LayoutTemplate, Globe, CreditCard, PenSquare,
  Briefcase, ChevronRight,
} from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import api from "@/api/client"

interface RevenuePoint { month: string; revenue: number; order_count: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [chart, setChart] = useState<RevenuePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/recent-orders"),
      api.get("/admin/revenue-chart"),
    ]).then(([s, r, c]) => {
      setStats(s.data.data)
      setRecent(r.data.data ?? [])
      setChart(c.data.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n ?? 0}`

  const cards = stats ? [
    { icon: ShoppingBag,   label: "Total Orders",    value: stats.total_orders,           color: "text-blue-400",    bg: "bg-blue-500/10",    href: "/admin/orders" },
    { icon: Clock,         label: "Pending Orders",  value: stats.pending_orders,         color: "text-amber-400",   bg: "bg-amber-500/10",   href: "/admin/orders" },
    { icon: Users,         label: "Total Clients",   value: stats.total_clients,          color: "text-green-400",   bg: "bg-green-500/10",   href: "/admin/users" },
    { icon: MessageSquare, label: "New Quotes",      value: stats.new_quotes,             color: "text-purple-400",  bg: "bg-purple-500/10",  href: "/admin/quotes" },
    { icon: DollarSign,    label: "Revenue (Month)", value: fmt(stats.revenue_this_month),color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/payments" },
    { icon: DollarSign,    label: "Total Revenue",   value: fmt(stats.revenue_total),     color: "text-primary",     bg: "bg-primary/10",     href: "/admin/payments" },
  ] : []

  const statusColor: Record<string, string> = {
    pending_approval: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    approved:         "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    in_progress:      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    completed:        "bg-green-500/15 text-green-600 dark:text-green-400",
    cancelled:        "bg-red-500/15 text-red-600 dark:text-red-400",
    revision:         "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  }

  const quickActions = [
    { label: "Orders",       icon: ShoppingBag,   href: "/admin/orders" },
    { label: "Packages",     icon: Package,       href: "/admin/packages" },
    { label: "Quotes",       icon: FileText,      href: "/admin/quotes" },
    { label: "Users",        icon: Users,         href: "/admin/users" },
    { label: "Blog",         icon: PenSquare,     href: "/admin/blog" },
    { label: "Portfolio",    icon: Briefcase,     href: "/admin/portfolio" },
    { label: "Invoices",     icon: FileText,      href: "/admin/invoices" },
    { label: "Payments",     icon: CreditCard,    href: "/admin/payments" },
    { label: "Chats",        icon: MessageSquare, href: "/admin/chats" },
    { label: "Builder",      icon: LayoutTemplate,href: "/admin/builder" },
    { label: "Pay Methods",  icon: Globe,         href: "/admin/payment-methods" },
    { label: "Settings",     icon: Settings,      href: "/admin/settings" },
  ]

  const maxRevenue = Math.max(...chart.map(p => p.revenue), 1)
  const fmtMonth = (m: string) => {
    const [y, mo] = m.split("-")
    return new Date(Number(y), Number(mo) - 1).toLocaleString("en", { month: "short" })
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse h-28" />
            ))
          : cards.map((c) => (
              <Link key={c.label} to={c.href}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition group">
                <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{c.label}</p>
                <p className="text-foreground text-2xl font-bold mt-1">{c.value}</p>
              </Link>
            ))
        }
      </div>

      {/* Revenue Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Revenue bar chart */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-heading font-semibold text-foreground">Revenue — Last 12 Months</h2>
            <Link to="/admin/payments" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-40 animate-pulse bg-muted/40 rounded-lg" />
            ) : chart.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">No revenue data yet.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {chart.map((pt) => {
                  const pct = maxRevenue > 0 ? (pt.revenue / maxRevenue) * 100 : 0
                  return (
                    <div key={pt.month} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex flex-col justify-end" style={{ height: "120px" }}>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-muted text-foreground text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 border border-border">
                          {fmt(pt.revenue)}<br />
                          <span className="text-muted-foreground">{pt.order_count} order{pt.order_count !== 1 ? "s" : ""}</span>
                        </div>
                        <div
                          className="w-full bg-primary/70 hover:bg-primary rounded-t transition-all"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground/60 text-[10px]">{fmtMonth(pt.month)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-heading font-semibold text-foreground">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-6 text-muted-foreground text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-muted-foreground text-sm text-center">No orders yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((o: any) => (
                <Link key={o.id} to={`/admin/orders/${o.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">#{o.order_number}</p>
                    <p className="text-muted-foreground text-xs mt-0.5 truncate">{o.user?.name ?? "Unknown"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[o.status] ?? "bg-muted text-muted-foreground"}`}>
                    {o.status?.replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} to={a.href}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/40 transition group">
              <a.icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition" />
              <span className="text-muted-foreground group-hover:text-foreground text-xs font-medium transition">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
