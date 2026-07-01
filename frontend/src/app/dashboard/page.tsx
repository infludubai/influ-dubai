"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Building2, Briefcase, ShieldCheck, Loader2, MailCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const ROLE_META: Record<string, { icon: React.ElementType; label: string; desc: string; href: string; color: string }> = {
  CREATOR: { icon: Sparkles, label: "Creator Dashboard", desc: "Manage your profile, analytics, campaigns & earnings.", href: "/dashboard/creator", color: "from-violet-500 to-purple-600" },
  BRAND:   { icon: Building2, label: "Brand Dashboard",   desc: "Create campaigns, discover creators, track ROI.",       href: "/dashboard/brand",           color: "from-blue-500 to-indigo-600" },
  AGENCY:  { icon: Briefcase, label: "Agency Dashboard",  desc: "Manage multiple brands, campaigns and creators.",       href: "/dashboard/brand",           color: "from-emerald-500 to-teal-600" },
  ADMIN:   { icon: ShieldCheck, label: "Admin Panel",     desc: "Platform governance, user management & analytics.",     href: "/admin",                     color: "from-rose-500 to-red-600" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, user, clearSession } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    api.me(accessToken)
      .then((me) => { setStatus(me.status); setLoading(false); })
      .catch(() => { clearSession(); router.replace("/login"); });
  }, [accessToken]);

  if (!accessToken || !user || loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );

  const meta = ROLE_META[user.role];

  return (
    <div className="flex min-h-screen flex-col bg-hero-mesh">
      {/* Topbar */}
      <header className="flex items-center justify-between border-b bg-background/80 px-6 py-3.5 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
        </Link>
        <button
          onClick={() => { clearSession(); router.push("/"); }}
          className="rounded-xl border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Log out
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-16 text-center">

        {/* Email verification banner */}
        {status === "PENDING_VERIFICATION" && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700">Verify your email</p>
                <p className="mt-0.5 text-xs text-amber-700">Check your inbox for a verification link. Some features are limited until verified.</p>
              </div>
              <button
                disabled={resent}
                onClick={async () => { await api.resendVerification(user.email); setResent(true); }}
                className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 transition-colors"
              >
                {resent ? "Sent ✓" : "Resend"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-xl shadow-primary/30 mx-auto">
            {meta && <meta.icon className="h-8 w-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold">
            Welcome{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-2 text-muted-foreground">{meta?.desc}</p>
        </motion.div>

        {/* Go to dashboard CTA */}
        {meta && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-8 w-full">
            <Link href={meta.href} className="block">
              <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${meta.color} p-6 text-left shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Continue to</p>
                    <p className="mt-1 text-xl font-bold text-white">{meta.label}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
              </div>
            </Link>

            {/* Secondary links */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/dashboard/billing">
                <div className="rounded-xl border bg-card p-4 text-left card-hover cursor-pointer">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing</p>
                  <p className="mt-0.5 text-sm font-medium">Plan & Invoices</p>
                </div>
              </Link>
              <Link href="/dashboard/settings">
                <div className="rounded-xl border bg-card p-4 text-left card-hover cursor-pointer">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                  <p className="mt-0.5 text-sm font-medium">Privacy & Security</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Onboarding link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6">
          <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
            Edit profile setup
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
