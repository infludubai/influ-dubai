"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkX, Loader2, MapPin, Users, Search } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type ShortlistEntry } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { RatingStars, VerifiedBadge } from "@/components/Rating";

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function BrandShortlistPage() {
  const { accessToken } = useAuthStore();
  const [items, setItems] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await api.getShortlist(accessToken));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(creatorProfileId: string) {
    if (!accessToken) return;
    setRemoving(creatorProfileId);
    try {
      await api.removeFromShortlist(accessToken, creatorProfileId);
      setItems((list) => list.filter((i) => i.creatorProfileId !== creatorProfileId));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Saved Creators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creators you&apos;ve bookmarked from the marketplace, ready to invite
            to your next campaign.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <Bookmark className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No saved creators yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Browse the marketplace and tap the bookmark on any creator to build
              your shortlist.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              <Search className="h-4 w-4" /> Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const cp = item.creatorProfile;
              const name = cp.user?.profile?.displayName ?? "Creator";
              const followers =
                cp.totalAudienceSize ??
                cp.socialAccounts?.reduce((t, a) => t + (a.followersCount ?? 0), 0) ??
                0;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => remove(item.creatorProfileId)}
                    disabled={removing === item.creatorProfileId}
                    title="Remove from shortlist"
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    {removing === item.creatorProfileId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BookmarkX className="h-4 w-4" />
                    )}
                  </button>

                  <Link href={`/creators/${item.creatorProfileId}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-brand text-sm font-bold text-white">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate font-semibold">
                          {name}
                          <VerifiedBadge status={cp.verificationStatus} />
                        </p>
                        {cp.location && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {cp.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="mt-3">
                    <RatingStars value={cp.ratingAvg} count={cp.ratingCount} showEmpty />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {compact(followers)} followers
                    </span>
                    {cp.minRateUsd != null && (
                      <span className="font-medium text-emerald-600">
                        from ${cp.minRateUsd.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
