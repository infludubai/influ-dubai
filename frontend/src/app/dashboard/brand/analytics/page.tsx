"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Users, TrendingUp, ShoppingCart, DollarSign, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Overview = Awaited<ReturnType<typeof api.getBrandOverview>>;

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    "bg-green-50 text-green-700 border-green-200",
  DRAFT:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAUSED:    "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function BrandAnalyticsPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    api.getBrandOverview(accessToken).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const chartData = data?.campaigns.map(c => ({
    name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
    Reach: c.reach,
    Engagement: c.engagement,
    Conversions: c.conversions,
  })) ?? [];

  const kpis = [
    { icon: DollarSign,   label: "Total Budget",      value: `$${fmt(data?.totals.totalBudget ?? 0)}`,      color: "bg-emerald-50 text-emerald-600" },
    { icon: Users,        label: "Total Reach",        value: fmt(data?.totals.totalReach ?? 0),             color: "bg-blue-50 text-blue-600" },
    { icon: TrendingUp,   label: "Total Engagement",   value: fmt(data?.totals.totalEngagement ?? 0),        color: "bg-violet-50 text-violet-600" },
    { icon: ShoppingCart, label: "Total Conversions",  value: fmt(data?.totals.totalConversions ?? 0),       color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <DashboardShell title="Analytics">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Brand Performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aggregated stats across all your campaigns</p>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map(({ icon: Icon, label, value, color }) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border bg-card p-5 card-hover">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                className="mb-6 rounded-2xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold">Performance by campaign</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Reach</span>
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Engagement</span>
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-300" />Conversions</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(Number(v))} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => fmt(Number(v ?? 0))}
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}
                    />
                    <Bar dataKey="Reach" fill="#6366f1" radius={[4,4,0,0]} />
                    <Bar dataKey="Engagement" fill="#8b5cf6" radius={[4,4,0,0]} />
                    <Bar dataKey="Conversions" fill="#c4b5fd" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Campaign table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="rounded-2xl border bg-card overflow-hidden">
              <div className="border-b px-6 py-4">
                <p className="font-semibold">Campaigns</p>
              </div>
              {(data?.campaigns.length ?? 0) === 0 ? (
                <div className="py-16 text-center">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data?.campaigns.map(c => (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Reach: <strong className="text-foreground">{fmt(c.reach)}</strong></span>
                          <span>Engagement: <strong className="text-foreground">{fmt(c.engagement)}</strong></span>
                          <span>Conversions: <strong className="text-foreground">{fmt(c.conversions)}</strong></span>
                          {c.roiEstimate != null && (
                            <span className="font-semibold text-emerald-600">ROI {c.roiEstimate.toFixed(1)}×</span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? "bg-muted"}`}>{c.status}</span>
                      <Link href={`/dashboard/brand/campaigns/${c.id}/analytics`}>
                        <button className="shrink-0 flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                          Details <ArrowRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
