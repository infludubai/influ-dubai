"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, Scan, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { FraudBadge, FraudScoreRing } from "@/components/FraudBadge";

type Stats = Awaited<ReturnType<typeof api.adminGetFraudStats>>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
};

export default function AdminFraudPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scanned: number; flagged: number } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.adminGetFraudStats(accessToken).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  async function runScan() {
    if (!accessToken) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.adminScanAllFraud(accessToken);
      setScanResult({ scanned: res.scanned, flagged: res.flagged });
      const updated = await api.adminGetFraudStats(accessToken);
      setStats(updated);
    } catch { /* ignore */ }
    setScanning(false);
  }

  return (
    <div className="p-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fraud Detection</h1>
            <p className="mt-1 text-sm text-muted-foreground">AI-powered authenticity scoring for creator profiles</p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {scanning ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning…</> : <><Scan className="h-4 w-4" /> Run full scan</>}
          </button>
        </motion.div>

        {/* Scan result banner */}
        {scanResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-600">
              Scan complete — analyzed {scanResult.scanned} creators, flagged {scanResult.flagged} with Medium or High risk.
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Analyzed", value: stats?.analyzed ?? 0, icon: ShieldCheck, color: "text-blue-500 bg-blue-500/10" },
                { label: "High Risk", value: stats?.high ?? 0, icon: ShieldX, color: "text-red-600 bg-red-500/10" },
                { label: "Medium Risk", value: stats?.medium ?? 0, icon: ShieldAlert, color: "text-amber-600 bg-amber-500/10" },
                { label: "Low Risk", value: stats?.low ?? 0, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-500/10" },
              ].map((c, i) => (
                <motion.div key={c.label} variants={fadeUp} custom={i + 1}
                  className="rounded-2xl border bg-card p-5">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Risk distribution bar */}
            {stats && stats.analyzed > 0 && (
              <motion.div variants={fadeUp} custom={5} className="mb-6 rounded-2xl border bg-card p-6">
                <p className="mb-3 text-sm font-semibold">Risk distribution</p>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                  {[
                    { val: stats.high, color: "bg-red-500/100" },
                    { val: stats.medium, color: "bg-amber-500/100" },
                    { val: stats.low, color: "bg-emerald-500" },
                  ].map((s, i) => (
                    <div key={i} className={`${s.color} transition-all`}
                      style={{ width: `${(s.val / stats.analyzed) * 100}%` }} />
                  ))}
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500/100" />High ({stats.high})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500/100" />Medium ({stats.medium})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Low ({stats.low})</span>
                </div>
              </motion.div>
            )}

            {/* Recent reports */}
            <motion.div variants={fadeUp} custom={6} className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <p className="font-semibold">Recent fraud reports</p>
                <span className="text-xs text-muted-foreground">{stats?.recentReports?.length ?? 0} shown</span>
              </div>
              {!stats?.recentReports?.length ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No fraud reports yet. Run a scan to analyze creators.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {stats.recentReports.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                      <FraudScoreRing score={r.riskScore} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <FraudBadge level={r.riskLevel} score={r.riskScore} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                          </span>
                        </div>
                        {r.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.flags.slice(0, 2).map((f, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                <AlertTriangle className="h-2.5 w-2.5" /> {f.slice(0, 60)}{f.length > 60 ? "…" : ""}
                              </span>
                            ))}
                            {r.flags.length > 2 && <span className="text-[10px] text-muted-foreground">+{r.flags.length - 2} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
