"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type VerificationRequest } from "@/lib/api";

/**
 * Creator-facing verification status and request form. Shown on the creator
 * profile page — verification is what unlocks the badge brands filter on.
 */
export function VerificationCard() {
  const { accessToken } = useAuthStore();
  const [status, setStatus] = useState<string>("UNVERIFIED");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.getMyVerification(accessToken);
      setStatus(res.status);
      setRequests(res.requests);
    } catch {
      /* leave defaults */
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await api.requestVerification(accessToken, {
        evidenceUrl: evidenceUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      setOpen(false);
      setEvidenceUrl("");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  const lastRejection = requests.find((r) => r.status === "REJECTED");

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              status === "VERIFIED"
                ? "bg-blue-500/10 text-blue-500"
                : status === "PENDING"
                  ? "bg-amber-500/10 text-amber-600"
                  : status === "REJECTED"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {status === "VERIFIED" ? (
              <BadgeCheck className="h-5 w-5" />
            ) : status === "PENDING" ? (
              <Clock className="h-5 w-5" />
            ) : status === "REJECTED" ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <BadgeCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {status === "VERIFIED"
                ? "Verified creator"
                : status === "PENDING"
                  ? "Verification under review"
                  : status === "REJECTED"
                    ? "Verification declined"
                    : "Get verified"}
            </h3>
            <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              {status === "VERIFIED"
                ? "Your badge is live. Brands filtering for verified creators can now find you."
                : status === "PENDING"
                  ? "Our team is checking your linked accounts. This usually takes 1–2 business days."
                  : status === "REJECTED"
                    ? (lastRejection?.decisionReason ??
                      "Your last request was declined. Address the feedback and reapply.")
                    : "Verified profiles rank higher and win more campaigns. Link your social accounts and submit proof of your audience."}
            </p>
          </div>
        </div>

        {(status === "UNVERIFIED" || status === "REJECTED") && !open && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            {status === "REJECTED" ? "Reapply" : "Request verification"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Evidence link{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://drive.google.com/… screenshots of your platform insights"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Insights screenshots showing reach and audience demographics speed
              this up considerably.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Anything we should know?
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. My TikTok handle differs from my Instagram handle"
              className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for review
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
