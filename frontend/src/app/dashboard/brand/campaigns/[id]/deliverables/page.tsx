"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList, Plus, X, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  ChevronLeft, Clock, DollarSign, Trash2, ThumbsUp, MessageSquareWarning,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  api,
  type Campaign,
  type Deliverable,
  type DeliverableSummary,
} from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { DeliverableStatusBadge, DueDate } from "@/components/DeliverableStatusBadge";

const PLATFORMS = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN", "X"];

// ── Assign modal ────────────────────────────────────────────────────────────
function AssignModal({
  campaignId,
  creators,
  onClose,
  onCreated,
}: {
  campaignId: string;
  creators: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [creatorProfileId, setCreatorProfileId] = useState(creators[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await api.createDeliverable(accessToken, campaignId, {
        creatorProfileId,
        title: title.trim(),
        description: description.trim() || undefined,
        platform: platform || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        agreedRateUsd: rate ? Number(rate) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <h2 className="text-base font-bold">Assign a deliverable</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {creators.length === 0 ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-600">
              No creators are engaged on this campaign yet. Accept a proposal or
              have a creator accept an invitation first.
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Creator</label>
                <select
                  value={creatorProfileId}
                  onChange={(e) => setCreatorProfileId(e.target.value)}
                  className={inputClass}
                >
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1× Instagram Reel — product launch"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Brief{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What exactly should the creator produce? Tone, hashtags, mentions, do's and don'ts…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Any</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Rate (USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="1500"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
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
            onClick={handleCreate}
            disabled={saving || !title.trim() || !creatorProfileId}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Assign
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Review panel ────────────────────────────────────────────────────────────
function ReviewBox({
  deliverable,
  onReviewed,
}: {
  deliverable: Deliverable;
  onReviewed: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [busy, setBusy] = useState<"approve" | "changes" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = deliverable.revisions[0];

  async function act(outcome: "APPROVED" | "CHANGES_REQUESTED") {
    if (!accessToken) return;
    if (outcome === "CHANGES_REQUESTED" && !feedback.trim()) {
      setShowFeedback(true);
      return;
    }
    setBusy(outcome === "APPROVED" ? "approve" : "changes");
    setError(null);
    try {
      await api.reviewDeliverable(accessToken, deliverable.id, {
        outcome,
        feedback: feedback.trim() || undefined,
      });
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5">
      <p className="text-xs font-bold text-amber-600">
        Awaiting your review — version {latest?.version}
      </p>

      {latest?.contentUrl && (
        <a
          href={latest.contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open submitted content <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {latest?.note && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          “{latest.note}”
        </p>
      )}

      {showFeedback && (
        <textarea
          rows={2}
          autoFocus
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What needs to change? Be specific so the creator can fix it in one pass."
          className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
        />
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => act("APPROVED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {busy === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="h-3.5 w-3.5" />
          )}
          Approve
        </button>
        <button
          onClick={() => act("CHANGES_REQUESTED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
        >
          {busy === "changes" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageSquareWarning className="h-3.5 w-3.5" />
          )}
          Request changes
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function CampaignDeliverablesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { accessToken } = useAuthStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [items, setItems] = useState<Deliverable[]>([]);
  const [summary, setSummary] = useState<DeliverableSummary | null>(null);
  const [creators, setCreators] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const [c, list, sum, proposals] = await Promise.all([
        api.getCampaign(campaignId, accessToken),
        api.listCampaignDeliverables(accessToken, campaignId),
        api.getDeliverableSummary(accessToken, campaignId),
        api.getCampaignProposals(accessToken, campaignId).catch(() => []),
      ]);
      setCampaign(c);
      setItems(list);
      setSummary(sum);

      // Only accepted creators can be assigned work, mirroring the API rule.
      setCreators(
        proposals
          .filter((p) => p.status === "ACCEPTED")
          .map((p) => ({
            id: p.creator.id,
            name: p.creator.user?.profile?.displayName ?? "Creator",
          })),
      );
    } catch {
      router.push("/dashboard/brand");
    } finally {
      setLoading(false);
    }
  }, [accessToken, campaignId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(id: string) {
    if (!accessToken) return;
    try {
      await api.cancelDeliverable(accessToken, id);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not cancel");
    }
  }

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <Link
          href={`/dashboard/brand/campaigns/${campaignId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to campaign
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Deliverables</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaign?.title ?? "Campaign"}
            </p>
          </div>
          <button
            onClick={() => setAssigning(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Assign deliverable
          </button>
        </div>

        {summary && summary.total > 0 && (
          <div className="mb-6 rounded-2xl border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold">
                {summary.approved} of {summary.total} approved
              </span>
              <span className="text-sm text-muted-foreground">
                ${summary.approvedUsd.toLocaleString()} of $
                {summary.committedUsd.toLocaleString()} committed
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${summary.percentComplete}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>{summary.pending} not started</span>
              <span className="text-amber-600">{summary.submitted} in review</span>
              <span className="text-rose-600">
                {summary.changesRequested} needs changes
              </span>
              <span className="text-emerald-600">{summary.approved} approved</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No deliverables assigned yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Break the campaign into concrete pieces of work — one post, reel or
              video each — so creators know exactly what to produce and you can
              approve them individually.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((d) => (
              <div key={d.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <DeliverableStatusBadge status={d.status} />
                      {d.platform && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {d.platform}
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-base font-bold">{d.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.creatorProfile?.user?.profile?.displayName ?? "Creator"}
                    </p>
                    {d.description && (
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                        {d.description}
                      </p>
                    )}
                  </div>

                  {d.status !== "APPROVED" && d.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancel(d.id)}
                      title="Cancel deliverable"
                      className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <DueDate date={d.dueDate} done={d.status === "APPROVED"} />
                  </span>
                  {d.agreedRateUsd != null && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      {d.agreedRateUsd.toLocaleString()}
                    </span>
                  )}
                </div>

                {d.status === "SUBMITTED" && (
                  <ReviewBox deliverable={d} onReviewed={load} />
                )}

                {d.status === "APPROVED" && d.revisions[0]?.contentUrl && (
                  <a
                    href={d.revisions[0].contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    View approved content <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {assigning && (
          <AssignModal
            campaignId={campaignId}
            creators={creators}
            onClose={() => setAssigning(false)}
            onCreated={() => {
              setAssigning(false);
              void load();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
