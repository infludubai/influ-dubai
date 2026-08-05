"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet, Loader2, TrendingDown, PiggyBank, AlertTriangle, Receipt,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type BrandSpend } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAYMENT_STATUS: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  FAILED: "bg-rose-500/10 text-rose-600 border-rose-500/25",
  REFUNDED: "bg-muted text-muted-foreground border-border",
};

export default function BrandSpendPage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<BrandSpend | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setData(await api.getBrandSpend(accessToken));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const underfunded = (data?.balanceUsd ?? 0) < 0;

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Spend</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campaign funding you&apos;ve added versus what approved deliverables
            have committed to creators.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Funded</p>
                </div>
                <p className="mt-1.5 text-2xl font-bold">{usd(data?.fundedUsd ?? 0)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Committed</p>
                </div>
                <p className="mt-1.5 text-2xl font-bold">
                  {usd(data?.committedUsd ?? 0)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Approved deliverables
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Paid out</p>
                </div>
                <p className="mt-1.5 text-2xl font-bold text-emerald-600">
                  {usd(data?.paidOutUsd ?? 0)}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  underfunded ? "border-rose-500/30 bg-rose-500/5" : "bg-card"
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <p
                  className={`mt-1.5 text-2xl font-bold ${
                    underfunded ? "text-rose-600" : ""
                  }`}
                >
                  {usd(data?.balanceUsd ?? 0)}
                </p>
              </div>
            </div>

            {underfunded && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Your approved deliverables commit more than you&apos;ve funded.
                  Add funds from a campaign page so creator payouts can be
                  released.
                </span>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="border-b bg-muted/30 px-5 py-3">
                <h2 className="text-sm font-bold">Funding history</h2>
              </div>
              {!data || data.payments.length === 0 ? (
                <div className="py-16 text-center">
                  <Receipt className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">No funding yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Open a campaign and use &ldquo;Add funds&rdquo; to cover
                    creator payouts.
                  </p>
                  <Link
                    href="/dashboard/brand"
                    className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Go to campaigns
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {data.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.campaign?.title ?? p.description ?? "Campaign funding"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString("en-AE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {p.method === "MOCK" && " · mock payment"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${PAYMENT_STATUS[p.status]}`}
                        >
                          {p.status}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {usd(p.amountUsd)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
