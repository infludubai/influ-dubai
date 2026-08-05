"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, Loader2, CheckCircle2, XCircle, ExternalLink, X,
  AlertCircle, Users, ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type VerificationRequest } from "@/lib/api";

const FILTERS = ["PENDING", "VERIFIED", "REJECTED", "ALL"] as const;

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/25",
};

function DecisionModal({
  request,
  decision,
  onClose,
  onDone,
}: {
  request: VerificationRequest;
  decision: "VERIFIED" | "REJECTED";
  onClose: () => void;
  onDone: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = request.creatorProfile?.user?.profile?.displayName ?? "this creator";
  const approving = decision === "VERIFIED";

  async function submit() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminDecideVerification(accessToken, request.id, {
        decision,
        reason: reason.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save decision");
      setBusy(false);
    }
  }

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
          <h2 className="text-base font-bold">
            {approving ? "Verify" : "Decline"} {name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-muted-foreground">
            {approving
              ? "The verified badge will show on their public profile and in marketplace results."
              : "Explain what is missing so they can fix it and reapply."}
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {approving ? "Internal note (optional)" : "Reason (required)"}
            </label>
            <textarea
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                approving
                  ? "e.g. Instagram insights screenshots match reported figures"
                  : "e.g. Engagement figures could not be corroborated — please attach platform insights"
              }
              className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
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
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || (!approving && !reason.trim())}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              approving ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : approving ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {approving ? "Verify creator" : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerificationPage() {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("PENDING");
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<{
    request: VerificationRequest;
    decision: "VERIFIED" | "REJECTED";
  } | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        api.adminListVerification(accessToken, filter),
        api.adminVerificationStats(accessToken).catch(() => ({})),
      ]);
      setRequests(list);
      setStats(s);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Creator Verification</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review follower authenticity before granting the verified badge.
          Cross-check the reported figures against the linked accounts and any
          evidence the creator attached.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(["PENDING", "VERIFIED", "REJECTED"] as const).map((s) => (
          <div key={s} className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </p>
            <p className="mt-1 text-2xl font-bold">{stats[s] ?? 0}</p>
          </div>
        ))}
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
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-20 text-center">
          <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
          <p className="font-semibold">Nothing in this view</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verification requests appear here as creators submit them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const cp = r.creatorProfile;
            const name = cp?.user?.profile?.displayName ?? "Creator";
            const totalFollowers =
              cp?.socialAccounts?.reduce(
                (t, a) => t + (a.followersCount ?? 0),
                0,
              ) ?? 0;

            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[r.status] ?? ""}`}
                      >
                        {r.status}
                      </span>
                      {cp?.fraudRiskLevel && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                            cp.fraudRiskLevel === "HIGH"
                              ? "border-rose-500/25 bg-rose-500/10 text-rose-600"
                              : cp.fraudRiskLevel === "MEDIUM"
                                ? "border-amber-500/25 bg-amber-500/10 text-amber-600"
                                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          Fraud risk: {cp.fraudRiskLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold">{name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {cp?.user?.email} · {cp?.location ?? "Location not set"}
                    </p>
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setDeciding({ request: r, decision: "VERIFIED" })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> Verify
                      </button>
                      <button
                        onClick={() => setDeciding({ request: r, decision: "REJECTED" })}
                        className="rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/40 px-3.5 py-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Linked accounts (
                      {totalFollowers.toLocaleString()} total)
                    </p>
                    {cp?.socialAccounts?.length ? (
                      <ul className="space-y-1">
                        {cp.socialAccounts.map((a) => (
                          <li key={a.id} className="flex justify-between text-xs">
                            <span className="font-medium">
                              {a.platform} @{a.handle}
                            </span>
                            <span className="text-muted-foreground">
                              {(a.followersCount ?? 0).toLocaleString()} ·{" "}
                              {(a.engagementRate ?? 0).toFixed(1)}% eng
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">None linked</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-muted/40 px-3.5 py-3">
                    <p className="mb-2 text-xs font-bold text-muted-foreground">
                      Submitted evidence
                    </p>
                    {r.evidenceUrl ? (
                      <a
                        href={r.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Open evidence <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">No link provided</p>
                    )}
                    {r.note && (
                      <p className="mt-1.5 text-xs text-muted-foreground">{r.note}</p>
                    )}
                    <Link
                      href={`/creators/${r.creatorProfileId}`}
                      target="_blank"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View public profile <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {r.decisionReason && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-semibold">Decision note:</span>{" "}
                    {r.decisionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deciding && (
        <DecisionModal
          request={deciding.request}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
