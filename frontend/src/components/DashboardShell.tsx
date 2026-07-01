"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, Search, BarChart3, MessageSquare,
  Inbox, CreditCard, Settings, LogOut, Menu, X, User, ChevronRight, Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const exactRoutes = ["/dashboard/brand", "/dashboard/creator", "/dashboard/creator/profile", "/marketplace", "/messages"];
  const active = exactRoutes.includes(item.href)
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link href={item.href}>
      <div className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      }`}
        style={active ? { boxShadow: "inset 0 0 0 1px rgba(109,40,217,0.15)" } : undefined}
      >
        <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-foreground"}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge != null && item.badge > 0 && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full gradient-brand px-1 text-[10px] font-bold text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
        {collapsed && item.badge != null && item.badge > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        )}
        {active && !collapsed && !item.badge && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
      </div>
    </Link>
  );
}

export function DashboardShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}) {
  const { user, accessToken, clearSession } = useAuthStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inboxBadge, setInboxBadge] = useState(0);
  const [msgBadge, setMsgBadge] = useState(0);

  const isCreator = user?.role === "CREATOR";

  // Build nav with live badge injected into Inbox item
  const BASE_BRAND_NAV: NavItem[] = [
    { href: "/dashboard/brand",           label: "Overview",         icon: LayoutDashboard },
    { href: "/dashboard/brand/campaigns/new", label: "New Campaign", icon: Megaphone },
    { href: "/marketplace",               label: "Discover Creators",icon: Search },
    { href: "/dashboard/brand/analytics", label: "Analytics",        icon: BarChart3 },
    { href: "/dashboard/brand/inbox",     label: "Inbox",            icon: Inbox, badge: inboxBadge },
    { href: "/messages",                  label: "Messages",         icon: MessageSquare, badge: msgBadge },
  ];

  const BASE_CREATOR_NAV: NavItem[] = [
    { href: "/dashboard/creator",         label: "Overview",         icon: LayoutDashboard },
    { href: "/dashboard/creator/profile", label: "My Profile",       icon: User },
    { href: "/marketplace",               label: "Marketplace",      icon: Search },
    { href: "/dashboard/creator/campaigns",label: "Browse Campaigns", icon: Megaphone },
    { href: "/dashboard/creator/analytics",label: "Analytics",       icon: BarChart3 },
    { href: "/dashboard/creator/inbox",   label: "Inbox",            icon: Inbox, badge: inboxBadge },
    { href: "/messages",                  label: "Messages",         icon: MessageSquare, badge: msgBadge },
  ];

  const navItems = isCreator ? BASE_CREATOR_NAV : BASE_BRAND_NAV;

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  // Fetch live badge counts
  useEffect(() => {
    if (!accessToken) return;

    async function fetchBadges() {
      try {
        if (isCreator) {
          const invitations = await api.getMyInvitations(accessToken!).catch(() => []);
          setInboxBadge(invitations.filter((i: any) => i.status === "PENDING").length);
        } else {
          const campaigns = await api.getMyCampaigns(accessToken!).catch(() => [] as any[]);
          let pending = 0;
          for (const c of campaigns.slice(0, 5)) {
            const proposals = await api.getCampaignProposals(accessToken!, c.id).catch(() => []);
            pending += proposals.filter((p: any) => p.status === "PENDING").length;
          }
          setInboxBadge(pending);
        }
        // Message unread: count convos with unread > 0
        const convs = await api.listConversations(accessToken!).catch(() => [] as any[]);
        setMsgBadge(convs.reduce((n: number, c: any) => n + (c.unread > 0 ? 1 : 0), 0));
      } catch { /* ignore */ }
    }

    fetchBadges();
    const t = setInterval(fetchBadges, 60_000);
    return () => clearInterval(t);
  }, [accessToken, isCreator]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex h-full flex-col ${mobile ? "p-4" : collapsed ? "p-3" : "p-4"}`}>
      {/* Logo */}
      <div className={`mb-6 flex items-center ${collapsed && !mobile ? "justify-center" : "gap-3 px-1"}`}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <span className="text-base font-bold tracking-tight">
              InfluDubai <span className="gradient-text">AI</span>
            </span>
          )}
        </Link>
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Menu className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role badge */}
      {(!collapsed || mobile) && (
        <div className="mb-4 rounded-xl bg-primary/8 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{user?.role}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(item => (
          <div key={item.href} className="relative">
            <NavLink item={item} collapsed={collapsed && !mobile} />
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-3 h-px bg-border" />

      {/* Bottom nav */}
      <nav className="space-y-0.5">
        {BOTTOM_NAV.map(item => <NavLink key={item.href} item={item} collapsed={collapsed && !mobile} />)}
      </nav>

      {/* User */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
          {initials}
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.displayName ?? "Account"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.role}</p>
          </div>
        )}
        <button
          onClick={() => { clearSession(); router.push("/"); }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          title="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className={`relative hidden flex-col border-r bg-sidebar transition-all duration-300 lg:flex ${collapsed ? "w-[72px]" : "w-[256px]"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r shadow-2xl lg:hidden"
            >
              <button onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            {title && <h1 className="text-sm font-semibold text-foreground">{title}</h1>}
          </div>
          <div className="flex items-center gap-1">
            {actions && <div className="mr-2">{actions}</div>}
            <ThemeToggle />
            <NotificationBell />
            <Link href="/messages">
              <button className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <MessageSquare className="h-4 w-4" />
                {msgBadge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full gradient-brand text-[9px] font-bold text-white">
                    {msgBadge > 9 ? "9+" : msgBadge}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
