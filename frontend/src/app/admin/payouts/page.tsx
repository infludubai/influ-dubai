"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet, Loader2, CheckCircle2, XCircle, Send, AlertCircle, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type AdminPayouts, type Payout, type PayoutStatus } from "@/lib/api";

const FILTERS: (PayoutStatus | "ALL")[] = ["PENDING", "PROCESSING", "PAID", "FAILED", "ALL"];

const STATUS_META: Record<PayoutStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-600 border-blue-500/25" },
  PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-600 border-rose-500/25" },
};

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Releasing money is irreversible in the ledger, so it goes through a
// confirmation step that captures a payment reference.
function ReleaseModal({
  payout,
  onClose,
  onDone,
}: {
  payout: Payout;
  onClose: () => void;
  onDone: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [mode, setMode] = useState<"PAID" | "FAILED">("PAID");
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorName =
    payout.creatorProfile?.user?.profile?.displayName ??
    payout.creatorProfile?.user?.email ??
    "Creator";

  async function submit() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminUpdatePayout(accessToken, payout.id, {
        status: mode,
        reference: reference.trim() || undefined,
        failureReason: failureReason.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update payout");
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Record payout</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {creatorName} · {usd(payout.netUsd)} net
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl bg-muted/40 px-3.5 py-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross</span>
              <span className="tabular-nums">{usd(payout.grossUsd)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">
                Platform fee ({payout.feePercent}%)
              </span>
              <span className="tabular-nums">−{usd(payout.feeUsd)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t pt-1.5 font-bold">
              <span>Send to creator</span>
              <span className="tabular-nums">{usd(payout.netUsd)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("PAID")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "PAID"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : "border-border hover:bg-muted"
              }`}
            >
              Mark paid
            </button>
            <button
              onClick={() => setMode("FAILED")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "FAILED"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-600"
                  : "border-border hover:bg-muted"
              }`}
            >
              Mark failed
            </button>
          </div>

          {mode === "PAID" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Payment reference
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Bank transfer ID or Stripe transfer id"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Shown to the creator so they can reconcile the transfer.
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                What went wrong?
              </label>
              <textarea
                rows={2}
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="e.g. Bank details rejected — creator to update payment info"
                className={`${inputClass} resize-none`}
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t bg-muted/30 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || (mode === "FAILED" && !failureReason.trim())}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === "PAID" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "PAID" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<AdminPayouts | null>(null);
  const [filter, setFilter] = useState<PayoutStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<Payout | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setData(await api.adminListPayouts(accessToken, filter));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markProcessing(payout: Payout) {
    if (!accessToken) return;
    try {
      await api.adminUpdatePayout(accessToken, payout.id, { status: "PROCESSING" });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update");
    }
  }

  const totalPending =
    data?.summary.find((s) => s.status === "PENDING")?.netUsd ?? 0;
  const totalFees = data?.summary.reduce((t, s) => t + s.feeUsd, 0) ?? 0;

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Creator payments queued by approved deliverables. Money moves
          out-of-band via bank transfer or Stripe — recording it here notifies
          the creator and closes the ledger entry.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Awaiting release</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{usd(totalPending)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Platform fees earned
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{usd(totalFees)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Payouts in view</p>
          <p className="mt-1 text-2xl font-bold">{data?.payouts.length ?? 0}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_META[f].label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payouts…
          </div>
        ) : !data || data.payouts.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="text-sm font-semibold">No payouts in this view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Creator
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Work
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
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.payouts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">
                        {p.creatorProfile?.user?.profile?.displayName ?? "Creator"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.creatorProfile?.user?.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm">{p.deliverable?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.campaign?.brand?.companyName} · {p.campaign?.title}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {usd(p.grossUsd)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      −{usd(p.feeUsd)}
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
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status !== "PAID" && (
                        <div className="flex justify-end gap-1.5">
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => markProcessing(p)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                              title="Mark as processing"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setReleasing(p)}
                            className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                          >
                            Record
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {releasing && (
        <ReleaseModal
          payout={releasing}
          onClose={() => setReleasing(null)}
          onDone={() => {
            setReleasing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
