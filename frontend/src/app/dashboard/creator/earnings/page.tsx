"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet, Loader2, Clock, CheckCircle2, AlertCircle, TrendingUp, Receipt,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type CreatorEarnings, type PayoutStatus } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const STATUS_META: Record<PayoutStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending release",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/25",
  },
  PAID: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/25",
  },
};

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CreatorEarningsPage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setData(await api.getMyEarnings(accessToken));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = [
    {
      label: "Pending",
      value: usd(data?.totals.pending ?? 0),
      icon: Clock,
      color: "text-amber-600",
      hint: "Approved work awaiting release",
    },
    {
      label: "Paid out",
      value: usd(data?.totals.paid ?? 0),
      icon: CheckCircle2,
      color: "text-emerald-600",
      hint: "Money already sent to you",
    },
    {
      label: "Lifetime gross",
      value: usd(data?.totals.lifetimeGross ?? 0),
      icon: TrendingUp,
      color: "",
      hint: "Before platform fees",
    },
    {
      label: "Platform fees",
      value: usd(data?.totals.fees ?? 0),
      icon: Receipt,
      color: "text-muted-foreground",
      hint: "Deducted across all payouts",
    },
  ];

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A payout is created automatically the moment a brand approves your
            deliverable. Amounts shown are net of the platform fee.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color || "text-muted-foreground"}`} />
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className={`mt-1.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading earnings…
          </div>
        ) : !data || data.payouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <Wallet className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No earnings yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Once a brand approves a deliverable with an agreed rate, the
              payout will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Deliverable
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Campaign
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Gross
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Fee
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Net
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{p.deliverable?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString("en-AE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm">{p.campaign?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.campaign?.brand?.companyName}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {usd(p.grossUsd)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                        −{usd(p.feeUsd)}
                        <span className="ml-1 text-[10px]">({p.feePercent}%)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {usd(p.netUsd)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[p.status].className}`}
                        >
                          {STATUS_META[p.status].label}
                        </span>
                        {p.status === "FAILED" && p.failureReason && (
                          <p className="mt-1 flex items-start gap-1 text-[11px] text-rose-600">
                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            {p.failureReason}
                          </p>
                        )}
                        {p.status === "PAID" && p.reference && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Ref: {p.reference}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
