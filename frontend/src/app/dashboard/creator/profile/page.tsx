"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User, Globe, DollarSign, BarChart3, Plus, Trash2, CheckCircle2,
  ExternalLink, Save, Loader2, Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type CreatorProfile } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const PLATFORMS = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN", "X"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram", TIKTOK: "TikTok", YOUTUBE: "YouTube", LINKEDIN: "LinkedIn", X: "X (Twitter)",
};
const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "bg-pink-500/10 text-pink-600",
  TIKTOK: "bg-gray-900 text-white border-gray-700",
  YOUTUBE: "bg-red-500/10 text-red-600",
  LINKEDIN: "bg-blue-500/10 text-blue-600",
  X: "bg-gray-50 text-gray-700 border-gray-200",
};
const CATEGORY_OPTIONS = [
  "Fashion", "Beauty", "Tech", "Travel", "Food", "Fitness", "Gaming", "Finance",
  "Education", "Lifestyle", "Business", "Entertainment", "Health", "Sports", "Art",
];
const LANGUAGE_OPTIONS = ["Arabic", "English", "French", "Hindi", "Urdu", "Filipino", "Russian"];

const TABS = [
  { id: "info", label: "Basic Info", icon: User },
  { id: "social", label: "Social", icon: Globe },
  { id: "portfolio", label: "Portfolio", icon: BarChart3 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06 } }),
};

export default function CreatorProfilePage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("info");

  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [audienceSize, setAudienceSize] = useState("");

  const [socialPlatform, setSocialPlatform] = useState("INSTAGRAM");
  const [socialHandle, setSocialHandle] = useState("");
  const [socialFollowers, setSocialFollowers] = useState("");
  const [socialEngagement, setSocialEngagement] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  const [portTitle, setPortTitle] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portLink, setPortLink] = useState("");

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "CREATOR") { router.replace("/dashboard"); return; }
    load();
  }, [accessToken]);

  async function load() {
    try {
      const res = await api.getMyCreatorProfile(accessToken!);
      setScore(res.completionScore);
      if (res.profile) {
        setProfile(res.profile);
        setBio(res.profile.bio ?? "");
        setLocation(res.profile.location ?? "");
        setLanguages(res.profile.languages);
        setCategories(res.profile.categories);
        setMinRate(res.profile.minRateUsd?.toString() ?? "");
        setMaxRate(res.profile.maxRateUsd?.toString() ?? "");
        setAudienceSize(res.profile.totalAudienceSize?.toString() ?? "");
      }
    } catch { }
  }

  async function saveProfile() {
    if (!accessToken) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const updated = await api.upsertCreatorProfile(accessToken, {
        bio: bio || undefined,
        location: location || undefined,
        languages,
        categories,
        minRateUsd: minRate ? Number(minRate) : undefined,
        maxRateUsd: maxRate ? Number(maxRate) : undefined,
        totalAudienceSize: audienceSize ? Number(audienceSize) : undefined,
      });
      setProfile(updated);
      await load();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function addSocial() {
    if (!accessToken || !socialHandle) return;
    setSaving(true); setError("");
    try {
      await api.upsertSocialAccount(accessToken, {
        platform: socialPlatform,
        handle: socialHandle,
        followersCount: socialFollowers ? Number(socialFollowers) : undefined,
        engagementRate: socialEngagement ? Number(socialEngagement) : undefined,
        profileUrl: socialUrl || undefined,
      });
      setSocialHandle(""); setSocialFollowers(""); setSocialEngagement(""); setSocialUrl("");
      await load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function removeSocial(platform: string) {
    if (!accessToken) return;
    try { await api.deleteSocialAccount(accessToken, platform); await load(); }
    catch (e: any) { setError(e.message); }
  }

  async function addPortfolio() {
    if (!accessToken || !portTitle) return;
    setSaving(true); setError("");
    try {
      await api.createPortfolioItem(accessToken, {
        title: portTitle,
        description: portDesc || undefined,
        linkUrl: portLink || undefined,
      });
      setPortTitle(""); setPortDesc(""); setPortLink("");
      await load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function removePortfolio(id: string) {
    if (!accessToken) return;
    try { await api.deletePortfolioItem(accessToken, id); await load(); }
    catch (e: any) { setError(e.message); }
  }

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  const scoreColor = score >= 80 ? "bg-emerald-500/100" : score >= 50 ? "bg-amber-500" : "bg-red-400";

  if (!accessToken || !user) return null;

  const viewProfileAction = profile ? (
    <Link href={`/creators/${profile.id}`}>
      <button className="flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
        <Eye className="h-3.5 w-3.5" /> Public profile
      </button>
    </Link>
  ) : undefined;

  return (
    <DashboardShell title="My Profile" actions={viewProfileAction}>
      <div className="mx-auto max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>

          {/* Header */}
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <h1 className="text-2xl font-bold">Creator Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Build your professional creator presence for brands to discover</p>
          </motion.div>

          {/* Completion score */}
          <motion.div variants={fadeUp} custom={1} className="mb-6 rounded-2xl border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Profile completeness</span>
              <span className={`text-sm font-bold ${score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500"}`}>{score}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-2 rounded-full transition-all duration-700 ${scoreColor}`} style={{ width: `${score}%` }} />
            </div>
            {score < 100 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {score < 40 ? "Add bio, location, and social accounts to get started." : score < 80 ? "Add portfolio items and rates to stand out to brands." : "Almost there — fill remaining fields for 100%."}
              </p>
            )}
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </motion.div>
          )}

          {saved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Profile saved successfully
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div variants={fadeUp} custom={2} className="mb-6 flex rounded-2xl border bg-muted/30 p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  tab === t.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </motion.div>

          {/* ── Basic Info ── */}
          {tab === "info" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl border bg-card p-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Bio</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Write a compelling bio for brands..."
                    rows={4}
                    className="input-glow w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Dubai, UAE"
                    className="input-glow w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Total Audience Size</label>
                  <input type="number" value={audienceSize} onChange={e => setAudienceSize(e.target.value)}
                    placeholder="e.g. 150000"
                    className="input-glow w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Min rate (USD)
                    </label>
                    <input type="number" value={minRate} onChange={e => setMinRate(e.target.value)}
                      placeholder="500"
                      className="input-glow w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Max rate (USD)
                    </label>
                    <input type="number" value={maxRate} onChange={e => setMaxRate(e.target.value)}
                      placeholder="5000"
                      className="input-glow w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button key={lang} onClick={() => toggle(languages, setLanguages, lang)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          languages.includes(lang)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Categories / Niches</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(cat => (
                      <button key={cat} onClick={() => toggle(categories, setCategories, cat)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          categories.includes(cat)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save profile</>}
              </button>
            </motion.div>
          )}

          {/* ── Social Accounts ── */}
          {tab === "social" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Existing accounts */}
              {profile?.socialAccounts?.length ? (
                <div className="rounded-2xl border bg-card divide-y overflow-hidden">
                  {profile.socialAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[acc.platform]}`}>
                          {PLATFORM_LABELS[acc.platform]}
                        </span>
                        <span className="text-sm font-medium">@{acc.handle}</span>
                        <span className="text-xs text-muted-foreground">
                          {acc.followersCount ? `${(acc.followersCount / 1000).toFixed(0)}K` : ""}
                          {acc.engagementRate ? ` · ${acc.engagementRate}% eng` : ""}
                        </span>
                      </div>
                      <button onClick={() => removeSocial(acc.platform)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                  No social accounts linked yet
                </div>
              )}

              {/* Add form */}
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <p className="text-sm font-semibold">Add / update account</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</label>
                    <select value={socialPlatform} onChange={e => setSocialPlatform(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                      {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Handle</label>
                    <input value={socialHandle} onChange={e => setSocialHandle(e.target.value)}
                      placeholder="yourhandle"
                      className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Followers</label>
                    <input type="number" value={socialFollowers} onChange={e => setSocialFollowers(e.target.value)}
                      placeholder="50000"
                      className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Engagement %</label>
                    <input type="number" value={socialEngagement} onChange={e => setSocialEngagement(e.target.value)}
                      placeholder="3.5"
                      className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile URL (optional)</label>
                  <input value={socialUrl} onChange={e => setSocialUrl(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button onClick={addSocial} disabled={saving || !socialHandle}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving…" : "Add account"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Portfolio ── */}
          {tab === "portfolio" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {profile?.portfolioItems?.length ? (
                <div className="rounded-2xl border bg-card divide-y overflow-hidden">
                  {profile.portfolioItems.map(item => (
                    <div key={item.id} className="flex items-start justify-between px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                        {item.linkUrl && (
                          <a href={item.linkUrl} target="_blank" rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" /> {item.linkUrl.slice(0, 50)}{item.linkUrl.length > 50 ? "…" : ""}
                          </a>
                        )}
                      </div>
                      <button onClick={() => removePortfolio(item.id)}
                        className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                  No portfolio items yet. Add your best work below.
                </div>
              )}

              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <p className="text-sm font-semibold">Add portfolio item</p>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Title *</label>
                  <input value={portTitle} onChange={e => setPortTitle(e.target.value)}
                    placeholder="Campaign name or project title"
                    className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                  <textarea value={portDesc} onChange={e => setPortDesc(e.target.value)}
                    placeholder="Brief description of the work..."
                    rows={2}
                    className="input-glow w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Link URL</label>
                  <input value={portLink} onChange={e => setPortLink(e.target.value)}
                    placeholder="https://..."
                    className="input-glow w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button onClick={addPortfolio} disabled={saving || !portTitle}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving…" : "Add item"}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
