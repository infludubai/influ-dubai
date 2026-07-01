"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, MousePointerClick, ShoppingCart, DollarSign, Plus, X } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Analytics = Awaited<ReturnType<typeof api.getCampaignAnalytics>>;

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function StatCard({ icon, label, value, sub, color = "bg-primary/10 text-primary" }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 card-hover">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reach: "", impressions: "", engagement: "", clicks: "", conversions: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    load();
  }, [params.id, accessToken]);

  async function load() {
    setLoading(true);
    try {
      setData(await api.getCampaignAnalytics(accessToken!, params.id as string));
    } catch { router.push("/dashboard/brand"); }
    setLoading(false);
  }

  async function saveMetric() {
    setSaving(true);
    try {
      await api.recordMetric(accessToken!, params.id as string, {
        reach: Number(form.reach),
        impressions: Number(form.impressions),
        engagement: Number(form.engagement),
        clicks: Number(form.clicks),
        conversions: Number(form.conversions),
      });
      setForm({ reach: "", impressions: "", engagement: "", clicks: "", conversions: "" });
      setShowForm(false);
      await load();
    } catch { /* ignore */ }
    setSaving(false);
  }

  const chartData = data?.metrics.map((m, i) => ({
    name: `Week ${i + 1}`,
    Reach: m.reach,
    Engagement: m.engagement,
    Clicks: m.clicks,
    Conversions: m.conversions,
  })) ?? [];

  const logAction = (
    <button onClick={() => setShowForm(v => !v)}
      className="gradient-brand flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all">
      <Plus className="h-4 w-4" /> Log metrics
    </button>
  );

  if (loading) return (
    <DashboardShell>
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title={data?.campaign.title ?? "Analytics"} actions={logAction}>
      <div className="mx-auto max-w-5xl">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data?.campaign.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ${data?.campaign.budgetUsd.toLocaleString()} budget ·{" "}
                <Link href={`/dashboard/brand/campaigns/${params.id}`} className="text-primary hover:underline">
                  ← Back to campaign
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Log metrics form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Record new metric snapshot</p>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(["reach", "impressions", "engagement", "clicks", "conversions"] as const).map(f => (
                <div key={f}>
                  <label className="mb-1 block text-xs font-medium capitalize text-muted-foreground">{f}</label>
                  <input type="number" min="0" value={form[f]}
                    onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                    className="input-glow w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveMetric} disabled={saving}
                className="gradient-brand rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving…" : "Save snapshot"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* KPI cards */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />}            label="Total Reach"   value={fmt(data?.totals.reach ?? 0)}      color="bg-blue-500/10 text-blue-600" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />}       label="Engagement"    value={fmt(data?.totals.engagement ?? 0)}  sub={`${(data?.engagementRate ?? 0).toFixed(1)}% rate`} color="bg-violet-500/10 text-violet-600" />
          <StatCard icon={<MousePointerClick className="h-5 w-5" />} label="Clicks"        value={fmt(data?.totals.clicks ?? 0)}      sub={`${(data?.ctr ?? 0).toFixed(2)}% CTR`}           color="bg-indigo-500/10 text-indigo-600" />
          <StatCard icon={<ShoppingCart className="h-5 w-5" />}     label="Conversions"   value={fmt(data?.totals.conversions ?? 0)} color="bg-amber-500/10 text-amber-600" />
        </motion.div>

        {/* ROI + CPE highlight */}
        {(data?.roiEstimate != null || data?.costPerEngagement != null) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="mb-5 grid gap-4 sm:grid-cols-2">
            {data.roiEstimate != null && (
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{data.roiEstimate.toFixed(2)}×</p>
                  <p className="text-sm font-medium text-emerald-600">Estimated ROI</p>
                </div>
              </div>
            )}
            {data.costPerEngagement != null && (
              <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${data.costPerEngagement.toFixed(2)}</p>
                  <p className="text-sm font-medium text-muted-foreground">Cost per engagement</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Charts */}
        {chartData.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
            className="rounded-2xl border bg-muted/20 py-20 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-semibold">No metric data yet</p>
            <p className="text-sm text-muted-foreground">Click "Log metrics" above to record your first snapshot.</p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="rounded-2xl border bg-card p-6">
              <p className="mb-4 font-semibold">Reach & Engagement over time</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => fmt(Number(v))} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Reach"      stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Engagement" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="rounded-2xl border bg-card p-6">
              <p className="mb-4 font-semibold">Clicks & Conversions</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                  <Legend />
                  <Bar dataKey="Clicks"      fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Conversions" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
