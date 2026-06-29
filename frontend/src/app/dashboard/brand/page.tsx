"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, BarChart3, Users, TrendingUp, ArrowRight, Megaphone, Sparkles, Target, Search } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type BrandProfile, type Campaign } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "badge-draft",
  ACTIVE: "badge-active",
  PAUSED: "badge-paused",
  COMPLETED: "badge-completed",
  CANCELLED: "badge-cancelled",
};
const TYPE_LABEL: Record<string, string> = {
  AWARENESS: "Awareness", ENGAGEMENT: "Engagement", LEAD_GENERATION: "Lead Gen", SALES: "Sales",
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export default function BrandDashboardPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "BRAND" && user?.role !== "AGENCY") { router.replace("/dashboard"); return; }
    load();
  }, [accessToken]);

  async function load() {
    try {
      const [b, c] = await Promise.all([
        api.getMyBrandProfile(accessToken!),
        api.getMyCampaigns(accessToken!).catch(() => [] as Campaign[]),
      ]);
      setBrand(b);
      setCampaigns(c);
    } catch { /* no brand profile yet */ }
    setLoading(false);
  }

  if (!accessToken || loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    </div>
  );

  const active = campaigns.filter(c => c.status === "ACTIVE").length;
  const draft = campaigns.filter(c => c.status === "DRAFT").length;
  const totalBudget = campaigns.reduce((s, c) => s + c.budgetUsd, 0);

  return (
    <DashboardShell
      title={brand?.companyName ?? "Brand Dashboard"}
      actions={
        <Link href="/dashboard/brand/campaigns/new">
          <button className="gradient-brand flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> New Campaign
          </button>
        </Link>
      }
    >
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>

        {/* Setup prompt */}
        {!brand && (
          <motion.div variants={fadeUp} custom={0}
            className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-md">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Complete your brand profile</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Set up your company details to start creating campaigns and discovering creators.</p>
              </div>
              <Link href="/dashboard/brand/profile">
                <button className="gradient-brand shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
                  Set up profile
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Welcome row */}
        <motion.div variants={fadeUp} custom={0} className="mb-6">
          <h2 className="text-2xl font-bold">
            {brand ? `Good to see you, ${brand.companyName.split(" ")[0]}` : "Welcome to your dashboard"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {brand?.industry && `${brand.industry}${brand.country ? ` · ${brand.country}` : ""} · `}
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
          </p>
        </motion.div>

        {/* KPI cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Megaphone, label: "Total Campaigns", value: campaigns.length, color: "text-blue-600 bg-blue-50", delta: null },
            { icon: TrendingUp, label: "Active", value: active, color: "text-emerald-600 bg-emerald-50", delta: null },
            { icon: BarChart3, label: "In Draft", value: draft, color: "text-amber-600 bg-amber-50", delta: null },
            { icon: Users, label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, color: "text-purple-600 bg-purple-50", delta: null },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i + 1}
              className="group rounded-2xl border bg-card p-5 card-hover">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div variants={fadeUp} custom={5} className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/marketplace", icon: Search, label: "Discover creators", desc: "Browse 12,000+ verified creators", color: "text-violet-600 bg-violet-50" },
            { href: "/dashboard/brand/campaigns/new", icon: Megaphone, label: "Create campaign", desc: "Launch a new influencer campaign", color: "text-blue-600 bg-blue-50" },
            { href: "/dashboard/brand/analytics", icon: BarChart3, label: "View analytics", desc: "Track reach, engagement & ROI", color: "text-emerald-600 bg-emerald-50" },
          ].map(q => (
            <Link key={q.href} href={q.href}>
              <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 card-hover cursor-pointer">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${q.color}`}>
                  <q.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{q.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{q.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Campaigns */}
        <motion.div variants={fadeUp} custom={6}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Your Campaigns</h3>
            <Link href="/dashboard/brand/campaigns/new">
              <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> New campaign
              </button>
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Megaphone className="h-7 w-7 text-muted-foreground" />
              </div>
              <h4 className="font-semibold">No campaigns yet</h4>
              <p className="mt-1 text-sm text-muted-foreground">Create your first influencer campaign to get started.</p>
              <Link href="/dashboard/brand/campaigns/new">
                <button className="gradient-brand mt-5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
                  Create campaign
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {campaigns.map((c, i) => (
                <motion.div key={c.id} variants={fadeUp} custom={i + 7}>
                  <Link href={`/dashboard/brand/campaigns/${c.id}`}>
                    <div className="group flex cursor-pointer items-center gap-4 rounded-2xl border bg-card px-5 py-4 card-hover">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                        <Megaphone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">{c.title}</span>
                          <span className={STATUS_COLOR[c.status]}>{c.status}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{TYPE_LABEL[c.type]}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium">${c.budgetUsd.toLocaleString()} budget</span>
                          {c.deadline && <span>Due {new Date(c.deadline).toLocaleDateString("en-AE", { dateStyle: "medium" })}</span>}
                          {c.targetCategories?.length > 0 && <span>{c.targetCategories.slice(0, 2).join(", ")}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}
