"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck, Loader2, ExternalLink, ThumbsUp, MessageSquareWarning,
  Clock, DollarSign, ArrowRight, Star,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Deliverable } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { DueDate } from "@/components/DeliverableStatusBadge";
import { RatingInput } from "@/components/Rating";

function ReviewCard({
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
  const creatorName =
    deliverable.creatorProfile?.user?.profile?.displayName ?? "Creator";

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
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              Version {latest?.version}
            </span>
            {deliverable.platform && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {deliverable.platform}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-bold">{deliverable.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {creatorName} ·{" "}
            <Link
              href={`/dashboard/brand/campaigns/${deliverable.campaignId}/deliverables`}
              className="text-primary hover:underline"
            >
              {deliverable.campaign?.title}
            </Link>
          </p>
        </div>

        {deliverable.agreedRateUsd != null && (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-600">
            <DollarSign className="h-4 w-4" />
            {deliverable.agreedRateUsd.toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <DueDate date={deliverable.dueDate} done={false} />
        </span>
        {deliverable.submittedAt && (
          <span className="text-muted-foreground">
            Submitted{" "}
            {new Date(deliverable.submittedAt).toLocaleDateString("en-AE", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>

      {latest?.contentUrl && (
        <a
          href={latest.contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open submitted content <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {latest?.note && (
        <p className="mt-2 rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
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

      <div className="mt-4 flex flex-wrap gap-2">
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

// Prompts the brand to rate creators on campaigns where work was approved but
// no review has been left. Surfaced here because this is where brands already
// come to close out collaborations.
function RateCreatorPrompt({
  item,
  onDone,
}: {
  item: { campaignId: string; campaignTitle: string; creatorProfileId: string; creatorName: string };
  onDone: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!accessToken || rating === 0) return;
    setBusy(true);
    setError(null);
    try {
      await api.reviewCreator(accessToken, item.campaignId, {
        creatorProfileId: item.creatorProfileId,
        rating,
        comment: comment.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Rate {item.creatorName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You completed &ldquo;{item.campaignTitle}&rdquo; together. Your
            rating helps other brands hire confidently.
          </p>

          <div className="mt-3">
            <RatingInput value={rating} onChange={setRating} />
          </div>

          {rating > 0 && (
            <>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What was it like working together? (optional)"
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              />
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              <button
                onClick={submit}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandReviewQueuePage() {
  const { accessToken } = useAuthStore();
  const [items, setItems] = useState<Deliverable[]>([]);
  const [pendingRatings, setPendingRatings] = useState<
    { campaignId: string; campaignTitle: string; creatorProfileId: string; creatorName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [queue, ratings] = await Promise.all([
        api.listPendingReview(accessToken),
        api.getPendingReviews(accessToken).catch(() => []),
      ]);
      setItems(queue);
      setPendingRatings(ratings);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything creators have submitted across all your campaigns,
            oldest first. Approving a deliverable marks it complete and unlocks
            the creator&apos;s payout.
          </p>
        </div>

        {!loading && pendingRatings.length > 0 && (
          <div className="mb-6 space-y-3">
            {pendingRatings.map((p) => (
              <RateCreatorPrompt key={p.campaignId} item={p} onDone={load} />
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
          </div>
        ) : items.length === 0 && pendingRatings.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">Nothing waiting on you</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              When a creator submits work it lands here for approval.
            </p>
            <Link
              href="/dashboard/brand"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Back to overview <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-bold text-muted-foreground">
              {items.length} awaiting review
            </p>
            {items.map((d) => (
              <ReviewCard key={d.id} deliverable={d} onReviewed={load} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
