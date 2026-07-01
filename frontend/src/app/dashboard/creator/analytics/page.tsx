"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Users, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Overview = Awaited<ReturnType<typeof api.getCreatorAnalytics>>;

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function CreatorAnalyticsPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    api.getCreatorAnalytics(accessToken).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const radarData = [
    { metric: "Reach",       value: Math.min(data?.totals.totalReach ?? 0, 100) },
    { metric: "Engagement",  value: Math.min(data?.totals.totalEngagement ?? 0, 100) },
    { metric: "Conversions", value: Math.min(data?.totals.totalConversions ?? 0, 100) },
  ];

  // Fake trend line from campaigns for the area chart
  const areaData = (data?.campaigns ?? []).map((c, i) => ({
    name: `Campaign ${i + 1}`,
    Reach: c.reach,
    Engagement: c.engagement,
  }));

  const kpis = [
    { icon: Users,        label: "Total Reach",       value: fmt(data?.totals.totalReach ?? 0),       color: "bg-blue-500/10 text-blue-600" },
    { icon: TrendingUp,   label: "Total Engagement",  value: fmt(data?.totals.totalEngagement ?? 0),   color: "bg-violet-500/10 text-violet-600" },
    { icon: ShoppingCart, label: "Total Conversions", value: fmt(data?.totals.totalConversions ?? 0),  color: "bg-amber-500/10 text-amber-500" },
    { icon: DollarSign,   label: "Campaigns",         value: String(data?.campaigns.length ?? 0),      color: "bg-emerald-500/10 text-emerald-600" },
  ];

  return (
    <DashboardShell title="Analytics">
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Performance Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stats from campaigns you've participated in</p>
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

            {(data?.totals.totalReach ?? 0) > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Area chart */}
                {areaData.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                    className="rounded-2xl border bg-card p-6">
                    <p className="mb-4 font-semibold">Reach vs Engagement</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={areaData}>
                        <defs>
                          <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(Number(v))} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                        <Area type="monotone" dataKey="Reach"      stroke="#6366f1" fill="url(#reachGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Engagement" stroke="#8b5cf6" fill="url(#engGrad)"   strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Radar chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                  className="rounded-2xl border bg-card p-6">
                  <p className="mb-4 font-semibold">Performance radar</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <Radar name="You" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            ) : null}

            {/* Campaign table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="mt-6 rounded-2xl border bg-card overflow-hidden">
              <div className="border-b px-6 py-4 font-semibold">Campaigns participated</div>
              {(data?.campaigns.length ?? 0) === 0 ? (
                <div className="py-16 text-center">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p className="text-muted-foreground text-sm">No accepted campaigns yet.</p>
                  <Link href="/marketplace" className="mt-2 inline-block text-sm text-primary hover:underline">Browse campaigns â†’</Link>
                </div>
              ) : (
                <div className="divide-y">
                  {data?.campaigns.map(c => (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.title}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Reach: <strong className="text-foreground">{fmt(c.reach)}</strong></span>
                          <span>Engagement: <strong className="text-foreground">{fmt(c.engagement)}</strong></span>
                          <span>Conversions: <strong className="text-foreground">{fmt(c.conversions)}</strong></span>
                        </div>
                      </div>
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
