"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, MapPin, Users, Star, ArrowRight, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Campaign } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Match = Awaited<ReturnType<typeof api.getCampaignRecommendations>>[number];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-600 border-emerald-400 bg-emerald-50" :
    score >= 40 ? "text-amber-600 border-amber-400 bg-amber-50" :
                  "text-gray-500 border-gray-300 bg-gray-50";
  return (
    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 font-bold ${color}`}>
      <span className="text-lg leading-none">{score}</span>
      <span className="text-[9px] font-normal opacity-70">/ 100</span>
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}<span className="font-normal text-muted-foreground">/{max}</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-1.5 rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

const PLATFORM_COLOR: Record<string, string> = {
  INSTAGRAM: "bg-pink-50 text-pink-600",
  YOUTUBE:   "bg-red-50 text-red-600",
  TIKTOK:    "bg-gray-900 text-white",
  LINKEDIN:  "bg-blue-50 text-blue-700",
  X:         "bg-gray-100 text-gray-700",
};

export default function RecommendationsPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    load();
  }, [params.id, accessToken]);

  async function load() {
    try {
      const [c, m] = await Promise.all([
        api.getCampaign(params.id as string, accessToken!),
        api.getCampaignRecommendations(accessToken!, params.id as string),
      ]);
      setCampaign(c);
      setMatches(m);
    } catch { router.push("/dashboard/brand"); }
    setLoading(false);
  }

  if (loading) return (
    <DashboardShell>
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Matching engine running…</p>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title="AI Recommendations">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">AI Matching Engine</span>
          </div>
          <h1 className="text-2xl font-bold">Recommended Creators</h1>
          {campaign && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              For <span className="font-medium text-foreground">"{campaign.title}"</span> · {campaign.type.replace("_", " ")} · ${campaign.budgetUsd.toLocaleString()} budget ·{" "}
              <Link href={`/dashboard/brand/campaigns/${params.id}`} className="text-primary hover:underline">← Back</Link>
            </p>
          )}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Scores: category overlap (40 pts) · location match (20 pts) · budget fit (20 pts) · audience size (20 pts)
          </div>
        </motion.div>

        {/* Results */}
        {matches.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 py-20 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-semibold">No matches found</p>
            <p className="text-sm text-muted-foreground">Add target categories and locations to your campaign for better results.</p>
            <Link href={`/dashboard/brand/campaigns/${params.id}`}>
              <button className="mt-4 text-sm font-medium text-primary hover:underline">Edit campaign →</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, i) => {
              const initials = m.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const isExpanded = expanded === m.creatorProfileId;

              return (
                <motion.div key={m.creatorProfileId}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                  className="overflow-hidden rounded-2xl border bg-card transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4 p-5">
                    {/* Rank */}
                    <div className="hidden w-5 text-center text-sm font-bold text-muted-foreground/50 sm:block">
                      #{i + 1}
                    </div>

                    <ScoreRing score={m.score} />

                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo-400/20 font-bold text-primary text-sm">
                      {m.profileImageUrl
                        ? <img src={m.profileImageUrl} alt={m.displayName} className="h-11 w-11 rounded-xl object-cover" />
                        : initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{m.displayName}</span>
                        {m.verificationStatus === "VERIFIED" && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                        {m.totalAudienceSize && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{fmt(m.totalAudienceSize)}</span>}
                        {(m.minRateUsd || m.maxRateUsd) && (
                          <span className="font-medium text-primary">
                            ${m.minRateUsd?.toLocaleString() ?? "0"}{m.maxRateUsd ? ` – $${m.maxRateUsd.toLocaleString()}` : "+"}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.categories.slice(0, 4).map((c: string) => (
                          <span key={c} className="rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary">{c}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => setExpanded(isExpanded ? null : m.creatorProfileId)}
                        className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                        {isExpanded ? <><ChevronUp className="h-3 w-3" /> Hide</> : <><ChevronDown className="h-3 w-3" /> Score</>}
                      </button>
                      <Link href={`/creators/${m.creatorProfileId}`}>
                        <button className="gradient-brand flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                          Profile <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="border-t bg-muted/20 px-5 py-4"
                    >
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score breakdown</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ScoreBar label="Category overlap" value={m.scoreBreakdown.categoryScore} max={40} color="bg-blue-400" />
                        <ScoreBar label="Location match"   value={m.scoreBreakdown.locationScore}  max={20} color="bg-emerald-400" />
                        <ScoreBar label="Budget fit"       value={m.scoreBreakdown.budgetScore}    max={20} color="bg-amber-400" />
                        <ScoreBar label="Audience size"    value={m.scoreBreakdown.audienceScore}  max={20} color="bg-violet-400" />
                      </div>
                      {m.socialAccounts?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.socialAccounts.map((a: any) => (
                            <span key={a.id} className={`rounded-lg px-2 py-0.5 text-xs font-medium ${PLATFORM_COLOR[a.platform] ?? "bg-muted"}`}>
                              {a.platform} @{a.handle}{a.followersCount ? ` · ${fmt(a.followersCount)}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {matches.length > 0 && (
          <div className="mt-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">Looking for more options?</p>
            <Link href={`/marketplace${campaign?.targetCategories?.length ? "?" + campaign.targetCategories.map(c => `category=${c}`).join("&") : ""}`}>
              <button className="inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                Browse all creators <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
