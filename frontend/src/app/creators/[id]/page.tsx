"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Star, Loader2, ShieldCheck, MessageSquare, Megaphone,
  ArrowLeft, ExternalLink, FileText, ChevronDown, ChevronUp, Sparkles, X,
} from "lucide-react";
import { api, type CreatorProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { FraudBadge, FraudScoreRing } from "@/components/FraudBadge";

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram", TIKTOK: "TikTok", YOUTUBE: "YouTube", LINKEDIN: "LinkedIn", X: "X (Twitter)",
};
const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "bg-pink-100 text-pink-700",
  TIKTOK:    "bg-black text-white",
  YOUTUBE:   "bg-red-100 text-red-700",
  LINKEDIN:  "bg-blue-100 text-blue-700",
  X:         "bg-gray-100 text-gray-700",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

type Campaign = { id: string; title: string; status: string; budgetUsd: number };

export default function PublicCreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showFraud, setShowFraud] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    riskScore: number; riskLevel: string; flags: string[]; summary: string; aiGenerated: boolean;
  } | null>(null);

  // Invite flow (brand only)
  const [showInvite, setShowInvite] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    api.getPublicCreatorProfile(params.id as string)
      .then(p => {
        setProfile(p);
        if (p.fraudRiskLevel && p.fraudRiskScore !== undefined) {
          setAnalysisResult({ riskScore: p.fraudRiskScore!, riskLevel: p.fraudRiskLevel!, flags: p.fraudFlags ?? [], summary: "", aiGenerated: false });
          setShowFraud(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function runAnalysis() {
    if (!accessToken || !profile) return;
    setAnalyzing(true);
    try {
      const res = await api.analyzeFraud(profile.id, accessToken);
      setAnalysisResult(res);
      setShowFraud(true);
      setProfile(prev => prev ? { ...prev, fraudRiskScore: res.riskScore, fraudRiskLevel: res.riskLevel, fraudFlags: res.flags } : prev);
    } catch { /* ignore */ }
    setAnalyzing(false);
  }

  async function openInvite() {
    setShowInvite(true);
    setInviteSent(false);
    setSelectedCampaignId(null);
    setInviteMsg("");
    if (campaigns.length === 0 && accessToken) {
      setLoadingCampaigns(true);
      const list = await api.getMyCampaigns(accessToken).catch(() => [] as Campaign[]);
      setCampaigns(list.filter((c: Campaign) => c.status === "DRAFT" || c.status === "ACTIVE"));
      setLoadingCampaigns(false);
    }
  }

  async function sendInvite() {
    if (!accessToken || !profile || !selectedCampaignId) return;
    setInviting(true);
    try {
      await api.inviteCreator(accessToken, selectedCampaignId, profile.id, inviteMsg || undefined);
      setInviteSent(true);
    } catch (e: any) {
      alert(e.message ?? "Failed to send invitation");
    }
    setInviting(false);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (notFound || !profile) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Creator profile not found.</p>
      <Link href="/marketplace">
        <button className="rounded-xl border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors">← Back to Marketplace</button>
      </Link>
    </div>
  );

  const displayName = profile.user?.profile?.displayName ?? "Creator";
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const totalFollowers = profile.socialAccounts.reduce((sum, s) => sum + (s.followersCount ?? 0), 0);
  const isBrand = user?.role === "BRAND" || user?.role === "AGENCY";

  return (
    <div className="min-h-screen bg-background">
      {/* Site header */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/marketplace">
              <button className="rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Marketplace
              </button>
            </Link>
            {accessToken ? (
              <Link href="/dashboard">
                <button className="gradient-brand rounded-xl px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="gradient-brand rounded-xl px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
                  Sign in
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Back link */}
        <button onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 overflow-hidden rounded-3xl border bg-card">
          {/* Gradient banner */}
          <div className="h-24 gradient-brand opacity-15" />
          <div className="px-6 pb-6">
            {/* Avatar overlapping banner */}
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-indigo-400/20 text-2xl font-bold text-primary shadow-lg">
                {profile.profileImageUrl
                  ? <img src={profile.profileImageUrl} alt={displayName} className="h-full w-full rounded-xl object-cover" />
                  : initials}
              </div>
              {/* CTA buttons */}
              <div className="flex items-center gap-2 pb-1">
                {accessToken && (
                  <Link href={`/messages?with=${profile.userId}`}>
                    <button className="flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
                      <MessageSquare className="h-4 w-4" /> Message
                    </button>
                  </Link>
                )}
                {isBrand && (
                  <button onClick={openInvite}
                    className="gradient-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm">
                    <Megaphone className="h-4 w-4" /> Invite to campaign
                  </button>
                )}
                {!accessToken && (
                  <Link href="/login">
                    <button className="gradient-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all">
                      <MessageSquare className="h-4 w-4" /> Contact
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Name + meta */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {profile.verificationStatus === "VERIFIED" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Verified
                </span>
              )}
              {profile.verificationStatus === "PENDING" && (
                <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">Pending</span>
              )}
              {profile.fraudRiskLevel && (
                <FraudBadge level={profile.fraudRiskLevel} score={profile.fraudRiskScore} size="sm" />
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
              )}
              {totalFollowers > 0 && <span>{fmt(totalFollowers)} total followers</span>}
              {(profile.minRateUsd || profile.maxRateUsd) && (
                <span className="font-medium text-foreground">
                  ${profile.minRateUsd?.toLocaleString() ?? "0"}{profile.maxRateUsd ? ` – $${profile.maxRateUsd.toLocaleString()}` : "+"} USD / campaign
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Invite to campaign panel */}
        <AnimatePresence>
          {showInvite && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">Invite {displayName} to a campaign</p>
                <button onClick={() => setShowInvite(false)} className="rounded-lg p-1 hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {inviteSent ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                  <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                  Invitation sent! {displayName} will see it in their inbox.
                </div>
              ) : loadingCampaigns ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your campaigns…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  No active or draft campaigns found.{" "}
                  <Link href="/dashboard/brand/campaigns/new" className="text-primary hover:underline">Create one →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {campaigns.map(c => (
                      <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                        selectedCampaignId === c.id ? "border-primary bg-primary/5" : "bg-background hover:border-primary/30"
                      }`}>
                        <input type="radio" name="campaign" value={c.id} checked={selectedCampaignId === c.id}
                          onChange={() => setSelectedCampaignId(c.id)} className="accent-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground">${c.budgetUsd.toLocaleString()} budget · {c.status}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Personal message (optional)</label>
                    <textarea value={inviteMsg} onChange={e => setInviteMsg(e.target.value)}
                      rows={2} placeholder={`Hi ${displayName}, we'd love to collaborate with you on this campaign…`}
                      className="input-glow w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={sendInvite} disabled={!selectedCampaignId || inviting}
                      className="gradient-brand rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all">
                      {inviting ? "Sending…" : "Send invitation"}
                    </button>
                    <button onClick={() => setShowInvite(false)} className="rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* About */}
        {profile.bio && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.07 } }}
            className="mb-4 rounded-2xl border bg-card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</p>
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          </motion.div>
        )}

        {/* Categories & Languages */}
        {(profile.categories.length > 0 || profile.languages.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="mb-4 rounded-2xl border bg-card p-5">
            {profile.categories.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niches</p>
                <div className="flex flex-wrap gap-2">
                  {profile.categories.map(c => (
                    <span key={c} className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.languages.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(l => (
                    <span key={l} className="rounded-full border px-3 py-1 text-xs font-medium">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Social accounts */}
        {profile.socialAccounts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.13 } }}
            className="mb-4 rounded-2xl border bg-card p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social Media</p>
            <div className="space-y-3">
              {profile.socialAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-medium ${PLATFORM_COLORS[acc.platform]}`}>
                      {PLATFORM_LABELS[acc.platform]}
                    </span>
                    <span className="text-sm font-medium">@{acc.handle}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {acc.followersCount != null && <span>{fmt(acc.followersCount)} followers</span>}
                    {acc.engagementRate != null && <span>{acc.engagementRate}% eng.</span>}
                    {acc.profileUrl && (
                      <a href={acc.profileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Authenticity / Fraud panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}
          className="mb-4 rounded-2xl border bg-card overflow-hidden">
          <button onClick={() => setShowFraud(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Authenticity Score</p>
                {analysisResult && (
                  <FraudBadge level={analysisResult.riskLevel} score={analysisResult.riskScore} size="sm" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {accessToken && !analysisResult && (
                <button onClick={e => { e.stopPropagation(); runAnalysis(); }} disabled={analyzing}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-all">
                  {analyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing…</> : <><ShieldCheck className="h-3 w-3" /> Run check</>}
                </button>
              )}
              {showFraud ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          <AnimatePresence initial={false}>
            {showFraud && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t">
                <div className="px-5 py-4">
                  {analysisResult ? (
                    <div className="flex items-start gap-6">
                      <FraudScoreRing score={analysisResult.riskScore} />
                      <div className="flex-1">
                        {analysisResult.summary && (
                          <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{analysisResult.summary}</p>
                        )}
                        {analysisResult.flags.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Flags detected</p>
                            {analysisResult.flags.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                                <span className="mt-0.5 shrink-0">⚠</span> {f}
                              </div>
                            ))}
                          </div>
                        )}
                        {analysisResult.flags.length === 0 && (
                          <p className="text-sm text-emerald-600 font-medium">No fraud flags detected.</p>
                        )}
                        {accessToken && (
                          <button onClick={runAnalysis} disabled={analyzing}
                            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <Loader2 className={`h-3 w-3 ${analyzing ? "animate-spin" : "hidden"}`} />
                            Refresh analysis
                          </button>
                        )}
                        {analysisResult.aiGenerated && (
                          <p className="mt-2 text-[10px] text-muted-foreground/60">Enhanced by GPT-4o-mini</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {accessToken
                        ? "Click \"Run check\" above to generate an authenticity score."
                        : "Log in to run an authenticity check on this creator."}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Portfolio */}
        {profile.portfolioItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.19 } }}
            className="mb-4 rounded-2xl border bg-card p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio</p>
            <div className="space-y-4">
              {profile.portfolioItems.map((item, i) => (
                <div key={item.id} className={i > 0 ? "border-t pt-4" : ""}>
                  <p className="font-medium">{item.title}</p>
                  {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                  {item.linkUrl && (
                    <a href={item.linkUrl} target="_blank" rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      {item.linkUrl} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Media kit */}
        {profile.mediaKitUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.22 } }}
            className="text-center">
            <a href={profile.mediaKitUrl} target="_blank" rel="noreferrer">
              <button className="flex mx-auto items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <FileText className="h-4 w-4" /> Download Media Kit
              </button>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
