"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Download, Zap, Sparkles, Building2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Subscription = Awaited<ReturnType<typeof api.getSubscription>>;

const PLAN_META: Record<string, { label: string; icon: React.ReactNode; color: string; price: number }> = {
  FREE:         { label: "Free",         icon: <Zap className="h-4 w-4" />,       color: "bg-gray-100 text-gray-700",    price: 0 },
  PROFESSIONAL: { label: "Professional", icon: <Sparkles className="h-4 w-4" />,  color: "bg-primary/10 text-primary",   price: 99 },
  ENTERPRISE:   { label: "Enterprise",   icon: <Building2 className="h-4 w-4" />, color: "bg-purple-500/10 text-purple-500", price: 299 },
};

function BillingContent() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const justUpgraded = searchParams.get("success") === "1";

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    api.getSubscription(accessToken).then(setSub).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  async function upgrade(plan: "PROFESSIONAL" | "ENTERPRISE") {
    if (!accessToken) return;
    setUpgrading(plan);
    try {
      const res = await api.createCheckout(accessToken, plan);
      if (res.mock) { setSub(await api.getSubscription(accessToken)); }
      else if (res.url) { window.location.href = res.url; }
    } catch { /* ignore */ }
    setUpgrading(null);
  }

  async function openPortal() {
    if (!accessToken) return;
    try {
      const res = await api.createPortal(accessToken);
      if (!res.mock && res.url) window.location.href = res.url;
    } catch { /* ignore */ }
  }

  async function cancel() {
    if (!accessToken || !confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCancelling(true);
    await api.cancelSubscription(accessToken).catch(() => {});
    setSub(await api.getSubscription(accessToken).catch(() => null));
    setCancelling(false);
  }

  const plan = sub?.plan ?? "FREE";
  const meta = PLAN_META[plan] ?? PLAN_META.FREE;

  return (
    <DashboardShell title="Billing">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Subscription & Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your plan and view invoice history</p>
        </motion.div>

        {justUpgraded && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-600">Your plan was upgraded successfully!</p>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : (
          <>
            {/* Current plan */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
              className="mb-5 rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current plan</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sub?.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                      {sub?.status ?? "ACTIVE"}
                    </span>
                  </div>
                  {plan !== "FREE" && (
                    <p className="mt-1.5 text-sm font-semibold">${meta.price}<span className="font-normal text-muted-foreground">/month</span></p>
                  )}
                  {sub?.currentPeriodEnd && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sub.cancelAtPeriodEnd ? "Cancels" : "Renews"} on {new Date(sub.currentPeriodEnd).toLocaleDateString("en-AE", { dateStyle: "long" })}
                    </p>
                  )}
                  {sub?.cancelAtPeriodEnd && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-yellow-700">
                      <AlertCircle className="h-4 w-4" /> Scheduled to cancel at period end
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {plan !== "FREE" && (
                    <button onClick={openPortal} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                      Manage
                    </button>
                  )}
                  {plan !== "FREE" && !sub?.cancelAtPeriodEnd && (
                    <button onClick={cancel} disabled={cancelling}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                      {cancelling ? "Cancellingâ€¦" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Upgrade options */}
            {plan === "FREE" && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                className="mb-5 grid gap-4 sm:grid-cols-2">
                {(["PROFESSIONAL", "ENTERPRISE"] as const).map(p => {
                  const m = PLAN_META[p];
                  return (
                    <div key={p} className={`rounded-2xl border-2 bg-card p-5 ${p === "PROFESSIONAL" ? "border-primary" : "border-border"}`}>
                      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${m.color}`}>{m.icon}</div>
                      <p className="font-bold">{m.label}</p>
                      <p className="text-2xl font-bold">${m.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <button onClick={() => upgrade(p)} disabled={upgrading === p}
                        className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${p === "PROFESSIONAL" ? "gradient-brand text-white hover:opacity-90" : "border hover:bg-muted"}`}>
                        {upgrading === p ? "Processingâ€¦" : `Upgrade to ${m.label}`}
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {plan === "PROFESSIONAL" && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                className="mb-5 rounded-2xl border bg-card p-5">
                <p className="font-semibold">Need more?</p>
                <p className="mt-1 text-sm text-muted-foreground">Upgrade to Enterprise for unlimited campaigns and a dedicated account manager.</p>
                <button onClick={() => upgrade("ENTERPRISE")} disabled={upgrading === "ENTERPRISE"}
                  className="mt-3 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60 transition-colors">
                  {upgrading === "ENTERPRISE" ? "Processingâ€¦" : "Upgrade to Enterprise"}
                </button>
              </motion.div>
            )}

            {/* Invoice history */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="rounded-2xl border bg-card overflow-hidden">
              <div className="border-b px-6 py-4">
                <p className="font-semibold">Invoice history</p>
              </div>
              {!sub?.invoices?.length ? (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto mb-3 h-8 w-8 opacity-20" />
                  <p className="text-sm text-muted-foreground">No invoices yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sub.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-semibold">${inv.amountUsd.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                          {inv.status}
                        </span>
                        {inv.pdfUrl && (
                          <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Download className="h-3.5 w-3.5" /> PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Payments processed securely by Stripe.{" "}
              <Link href="/pricing" className="text-primary hover:underline">View all plans â†’</Link>
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
