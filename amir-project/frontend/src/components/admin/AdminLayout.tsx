import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, ShoppingBag, Package, Plus, CreditCard,
  Receipt, Briefcase, FileEdit, Settings, Users, FileText,
  Globe, LogOut, Menu, X, AlignJustify, LayoutTemplate, ExternalLink, MessageSquare,
  Plug,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import api from "@/api/client"
import toast from "react-hot-toast"
import ThemeToggle from "@/components/shared/ThemeToggle"

const nav = [
  { label: "Dashboard",       to: "/admin",                icon: LayoutDashboard  },
  { label: "Orders",          to: "/admin/orders",         icon: ShoppingBag      },
  { label: "Payments",        to: "/admin/payments",       icon: CreditCard       },
  { label: "Invoices",        to: "/admin/invoices",       icon: Receipt          },
  { label: "Packages",        to: "/admin/packages",       icon: Package          },
  { label: "Add-ons",         to: "/admin/addons",         icon: Plus             },
  { label: "Payment Methods", to: "/admin/payment-methods",icon: CreditCard       },
  { label: "Quotes",          to: "/admin/quotes",         icon: FileText         },
  { label: "Portfolio",       to: "/admin/portfolio",      icon: Briefcase        },
  { label: "Blog",            to: "/admin/blog",           icon: FileEdit         },
  { label: "Users",           to: "/admin/users",          icon: Users            },
  { label: "Messages",        to: "/admin/chats",          icon: MessageSquare    },
  { label: "Pages",           to: "/admin/builder",        icon: Globe            },
  { label: "Integrations",    to: "/admin/integrations",   icon: Plug             },
  { label: "Settings",        to: "/admin/settings",       icon: Settings         },
]

function Sidebar({ onClick }: { onClick?: () => void }) {
  const { pathname } = useLocation()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [logoLight, setLogoLight] = useState<string>("")
  const [logoDark, setLogoDark] = useState<string>("")
  const [logoSize, setLogoSize] = useState({ width: "", height: "" })
  const [siteName, setSiteName] = useState<string>("Amir Nazir")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    import("@/api/public").then(({ publicApi }) => {
      publicApi.settings().then((r: any) => {
        const s = r.data?.data || {}
        setLogoLight(s.logo_url_light || s.logo_url || "")
        setLogoDark(s.logo_url_dark || s.logo_admin_url || s.logo_url || "")
        if (s.site_name) setSiteName(s.site_name)
        setLogoSize({ width: s.logo_admin_width || "", height: s.logo_admin_height || "" })
      }).catch(() => {})
    })
  }, [])

  useEffect(() => {
    const fetchUnread = () =>
      api.get("/admin/chats").then(r => {
        const total = (r.data.data ?? []).reduce((s: number, c: any) => s + (Number(c.unread_admin) || 0), 0)
        setUnreadMessages(total)
      }).catch(() => {})
    fetchUnread()
    pollRef.current = setInterval(fetchUnread, 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate("/")
    toast.success("Logged out")
    onClick?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border flex-shrink-0">
        {(logoLight || logoDark) ? (
          <>
            {logoLight && (
              <img src={logoLight} alt={siteName}
                style={{ height: logoSize.height ? `${logoSize.height}px` : "32px", width: logoSize.width ? `${logoSize.width}px` : "auto" }}
                className="object-contain mb-0.5 dark:hidden" />
            )}
            {logoDark && (
              <img src={logoDark} alt={siteName}
                style={{ height: logoSize.height ? `${logoSize.height}px` : "32px", width: logoSize.width ? `${logoSize.width}px` : "auto" }}
                className={`object-contain mb-0.5 ${logoLight ? "hidden dark:block" : ""}`} />
            )}
          </>
        ) : (
          <div className="font-heading font-bold text-lg gradient-text">{siteName}</div>
        )}
        <p className="text-muted-foreground/60 text-xs mt-0.5">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((n) => {
          const isActive =
            pathname === n.to ||
            (n.to !== "/admin" && pathname.startsWith(n.to))
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <n.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{n.label}</span>
              {n.to === "/admin/chats" && unreadMessages > 0 && (
                <span className="w-5 h-5 gradient-brand rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout + Visit site */}
      <div className="p-3 border-t border-border flex-shrink-0 space-y-1">
        <a href="/" target="_blank" rel="noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ExternalLink className="w-4 h-4" /> Visit Website
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-border flex-col bg-card dark:bg-slate-950">
        <Sidebar />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-56 bg-card dark:bg-slate-950 border-r border-border flex flex-col z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClick={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 border-b border-border px-4 md:px-6 flex items-center justify-between flex-shrink-0 bg-card dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="md:hidden p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-heading font-semibold text-base text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Visit Website
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}
