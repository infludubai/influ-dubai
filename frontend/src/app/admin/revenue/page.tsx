"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type RevenueData = Awaited<ReturnType<typeof api.adminGetRevenue>>;

const PLAN_COLORS: Record<string, string> = {
  FREE: "#94a3b8",
  PROFESSIONAL: "#6366f1",
  ENTERPRISE: "#7c3aed",
};

export default function AdminRevenuePage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api.adminGetRevenue(accessToken).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const totalRevenue = data?.byPlan.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Revenue</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl border bg-muted" />)}
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Platform Revenue</p>
            <p className="mt-1 text-4xl font-bold">${totalRevenue.toFixed(2)}</p>
          </motion.div>

          {data?.byPlan && data.byPlan.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-6 rounded-2xl border bg-card p-6">
              <p className="mb-4 font-semibold">Revenue by Plan</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.byPlan} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="plan" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Revenue"]} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {data.byPlan.map(r => (
                      <Cell key={r.plan} fill={PLAN_COLORS[r.plan] ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {data.byPlan.map(r => (
                  <div key={r.plan} className="rounded-xl border p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{r.plan}</p>
                    <p className="text-lg font-bold">${(r.total ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{r.count} invoices</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border bg-card">
            <div className="border-b px-6 py-4 font-semibold">Recent Invoices</div>
            {!data?.recentInvoices?.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No invoices yet</div>
            ) : (
              <div className="divide-y">
                {data.recentInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium">${inv.amountUsd.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
