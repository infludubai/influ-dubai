"use client";

import { useState } from "react";
import { PiggyBank, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

/**
 * Adds funds to a campaign so approved deliverables have payout cover.
 * With Stripe configured this redirects to Checkout; otherwise the backend
 * records a mock payment and we report that plainly rather than implying a
 * real charge was made.
 */
export function FundCampaignButton({
  campaignId,
  suggestedAmount,
  onFunded,
}: {
  campaignId: string;
  suggestedAmount?: number;
  onFunded?: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockDone, setMockDone] = useState(false);

  async function submit() {
    if (!accessToken) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.fundCampaign(accessToken, campaignId, value);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setMockDone(true);
      onFunded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start funding");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setMockDone(false);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <PiggyBank className="h-4 w-4" /> Add funds
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between border-b px-5 py-4">
              <h2 className="text-base font-bold">Add campaign funds</h2>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {mockDone ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-emerald-600" />
                <p className="font-semibold">Funding recorded</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  No payment provider is connected, so this was recorded as a
                  mock payment. No money was charged.
                </p>
                <button
                  onClick={close}
                  className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 px-5 py-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Covers creator payouts as deliverables are approved.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t bg-muted/30 px-5 py-3.5">
                  <button
                    onClick={close}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
