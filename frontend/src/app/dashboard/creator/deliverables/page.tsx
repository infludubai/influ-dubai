"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList, Send, X, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, MessageSquareWarning, Clock, DollarSign, History,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Deliverable } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { DeliverableStatusBadge, DueDate } from "@/components/DeliverableStatusBadge";

// ── Submit modal ────────────────────────────────────────────────────────────
function SubmitModal({
  deliverable,
  onClose,
  onSubmitted,
}: {
  deliverable: Deliverable;
  onClose: () => void;
  onSubmitted: (updated: Deliverable) => void;
}) {
  const { accessToken } = useAuthStore();
  const [contentUrl, setContentUrl] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRevision = deliverable.revisions.length > 0;
  const lastFeedback = deliverable.revisions.find(
    (r) => r.outcome === "CHANGES_REQUESTED",
  )?.feedback;

  async function handleSubmit() {
    if (!accessToken) return;
    setSending(true);
    setError(null);
    try {
      const updated = await api.submitDeliverable(accessToken, deliverable.id, {
        contentUrl: contentUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSubmitted(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">
              {isRevision ? "Submit revision" : "Submit deliverable"}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {deliverable.title}
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
          {lastFeedback && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <MessageSquareWarning className="h-3.5 w-3.5" />
                Requested changes
              </p>
              <p className="mt-1 text-sm leading-relaxed text-rose-600/90">
                {lastFeedback}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Link to your published content
            </label>
            <input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://instagram.com/p/…"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Paste the public URL of the post, reel or video you published.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Note for the brand{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the brand should know about this submission…"
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
            onClick={handleSubmit}
            disabled={sending || !contentUrl.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for review
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
function DeliverableCard({
  deliverable,
  onSubmit,
}: {
  deliverable: Deliverable;
  onSubmit: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const canSubmit =
    deliverable.status === "PENDING" || deliverable.status === "CHANGES_REQUESTED";
  const reviewed = deliverable.revisions.filter((r) => r.outcome);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <DeliverableStatusBadge status={deliverable.status} />
            {deliverable.platform && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {deliverable.platform}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-bold">{deliverable.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deliverable.campaign?.brand?.companyName ?? "Brand"} ·{" "}
            {deliverable.campaign?.title}
          </p>
          {deliverable.description && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {deliverable.description}
            </p>
          )}
        </div>

        {canSubmit && (
          <button
            onClick={onSubmit}
            className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            {deliverable.status === "CHANGES_REQUESTED" ? "Resubmit" : "Submit work"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <DueDate
            date={deliverable.dueDate}
            done={deliverable.status === "APPROVED"}
          />
        </span>
        {deliverable.agreedRateUsd != null && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <DollarSign className="h-3.5 w-3.5" />
            {deliverable.agreedRateUsd.toLocaleString()} agreed
          </span>
        )}
        {reviewed.length > 0 && (
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            {showHistory ? "Hide" : "Show"} history ({deliverable.revisions.length})
          </button>
        )}
      </div>

      {showHistory && (
        <div className="mt-4 space-y-2.5 border-t pt-4">
          {deliverable.revisions.map((rev) => (
            <div key={rev.id} className="rounded-xl border bg-muted/30 px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold">Version {rev.version}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(rev.createdAt).toLocaleString("en-AE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {rev.contentUrl && (
                <a
                  href={rev.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View submission <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {rev.note && (
                <p className="mt-1.5 text-xs text-muted-foreground">{rev.note}</p>
              )}
              {rev.outcome && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    rev.outcome === "APPROVED" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {rev.outcome === "APPROVED"
                    ? "Approved by the brand"
                    : `Changes requested: ${rev.feedback}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function CreatorDeliverablesPage() {
  const { accessToken } = useAuthStore();
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Deliverable | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await api.listMyDeliverables(accessToken));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = items.filter((d) => d.status !== "APPROVED");
  const done = items.filter((d) => d.status === "APPROVED");
  const earned = done.reduce((sum, d) => sum + (d.agreedRateUsd ?? 0), 0);

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Deliverables</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Work assigned to you across every campaign. Submit here and track
            brand feedback in one place.
          </p>
        </div>

        {!loading && items.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="mt-1 text-2xl font-bold">{active.length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Approved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{done.length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Earned</p>
              <p className="mt-1 text-2xl font-bold">${earned.toLocaleString()}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading deliverables…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No deliverables yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Once a brand accepts your proposal and assigns you work, it will
              appear here ready to submit.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground">
                  Active ({active.length})
                </h2>
                {active.map((d) => (
                  <DeliverableCard
                    key={d.id}
                    deliverable={d}
                    onSubmit={() => setSubmitting(d)}
                  />
                ))}
              </section>
            )}

            {done.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Completed ({done.length})
                </h2>
                {done.map((d) => (
                  <DeliverableCard key={d.id} deliverable={d} onSubmit={() => {}} />
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {submitting && (
          <SubmitModal
            deliverable={submitting}
            onClose={() => setSubmitting(null)}
            onSubmitted={() => {
              setSubmitting(null);
              void load();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
