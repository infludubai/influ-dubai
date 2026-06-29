"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import {
  LayoutDashboard, Users, Megaphone, DollarSign, FileText, LogOut,
  Sparkles, ShieldCheck, Menu, X, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/fraud", label: "Fraud Detection", icon: ShieldCheck },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/logs", label: "Audit Log", icon: FileText },
];

function NavItem({ item, onClick }: { item: typeof NAV[0]; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  return (
    <Link href={item.href} onClick={onClick}>
      <div className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}>
        <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
        <span>{item.label}</span>
        {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
      </div>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, user, clearSession } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!accessToken || user?.role !== "ADMIN") router.replace("/login");
  }, [accessToken, user, router]);

  if (!accessToken || user?.role !== "ADMIN") return null;

  const initials = user.displayName?.slice(0, 2).toUpperCase() ?? "AD";

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-1">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
        </Link>
      </div>

      {/* Admin badge */}
      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-rose-50 px-3 py-2.5 border border-rose-100">
        <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Admin Panel</p>
          <p className="text-xs text-rose-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(item => <NavItem key={item.href} item={item} onClick={onNav} />)}
      </nav>

      <div className="my-3 h-px bg-border" />

      {/* User + logout */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{user.displayName ?? "Admin"}</p>
          <p className="truncate text-[10px] text-muted-foreground">Administrator</p>
        </div>
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
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-sidebar lg:flex">
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
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar shadow-2xl lg:hidden"
            >
              <button onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/90 backdrop-blur-md px-4">
          <button onClick={() => setMobileOpen(true)}
            className="mr-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold">Admin Control Center</span>
          </div>
          <Link href="/dashboard" className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to app
          </Link>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
