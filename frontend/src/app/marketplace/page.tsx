"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, X, MapPin, Star,
  ChevronLeft, ChevronRight, Users, Sparkles, Megaphone, MessageSquare,
  Loader2, ArrowRight,
} from "lucide-react";
import { api, type CreatorProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { FraudBadge } from "@/components/FraudBadge";
import { ThemeToggle } from "@/components/ThemeToggle";

const CATEGORIES = ["Fashion", "Beauty", "Fitness", "Food", "Tech", "Travel", "Family", "Finance", "Lifestyle", "Education", "Entertainment", "Business"];
const LANGUAGES  = ["Arabic", "English", "French", "Hindi", "Urdu", "Filipino", "Russian"];
const LOCATIONS  = ["Dubai", "Abu Dhabi", "Riyadh", "Jeddah", "Cairo", "Kuwait City", "Doha", "Muscat"];

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  INSTAGRAM: <span className="text-[10px] font-bold">IG</span>,
  YOUTUBE:   <span className="text-[10px] font-bold">YT</span>,
  LINKEDIN:  <span className="text-[10px] font-bold">IN</span>,
  TIKTOK:    <span className="text-[10px] font-bold">TT</span>,
  X:         <span className="text-[10px] font-bold">𝕏</span>,
};

const PLATFORM_COLOR: Record<string, string> = {
  INSTAGRAM: "bg-pink-500/10 text-pink-600",
  YOUTUBE:   "bg-red-500/10 text-red-600",
  TIKTOK:    "bg-gray-900 text-white",
  LINKEDIN:  "bg-blue-500/10 text-blue-600",
  X:         "bg-gray-100 text-gray-700",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06 } }),
};

// ── Quick-invite modal ────────────────────────────────────────────────────────
type Campaign = { id: string; title: string; status: string; budgetUsd: number };

function QuickInviteModal({
  creator, onClose,
}: {
  creator: CreatorProfile;
  onClose: () => void;
}) {
  const { accessToken } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const name = creator.user?.profile?.displayName ?? "this creator";

  useEffect(() => {
    if (!accessToken) return;
    api.getMyCampaigns(accessToken)
      .then((list: any[]) => setCampaigns(list.filter((c: Campaign) => c.status === "DRAFT" || c.status === "ACTIVE")))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function send() {
    if (!accessToken || !selectedId) return;
    setSending(true);
    try {
      await api.inviteCreator(accessToken, selectedId, creator.id, message || undefined);
      setSent(true);
    } catch (e: any) { alert(e.message ?? "Failed"); }
    setSending(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-bold">Invite to campaign</p>
            <p className="text-sm text-muted-foreground">Send an invitation to <span className="font-medium text-foreground">{name}</span></p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {sent ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-4">
            <Star className="h-5 w-5 text-emerald-500 fill-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-600">Invitation sent!</p>
              <p className="text-xs text-emerald-600">{name} will see it in their inbox.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            No active or draft campaigns.{" "}
            <Link href="/dashboard/brand/campaigns/new" className="text-primary hover:underline">Create one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {campaigns.map(c => (
                <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                  selectedId === c.id ? "border-primary bg-primary/5" : "bg-background hover:border-primary/30"
                }`}>
                  <input type="radio" name="qcampaign" value={c.id} checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)} className="accent-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">${c.budgetUsd.toLocaleString()} · {c.status}</p>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={2} placeholder={`Hi ${name}, we'd love to work with you…`}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={send} disabled={!selectedId || sending}
                className="gradient-brand flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all">
                {sending ? "Sending…" : "Send invitation"}
              </button>
              <button onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Creator card ──────────────────────────────────────────────────────────────
function CreatorCard({
  creator, i, onInvite,
}: {
  creator: CreatorProfile;
  i: number;
  onInvite?: (c: CreatorProfile) => void;
}) {
  const { user } = useAuthStore();
  const name = creator.user?.profile?.displayName ?? "Creator";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const totalFollowers = creator.socialAccounts?.reduce((s, a) => s + (a.followersCount ?? 0), 0) ?? 0;
  const isBrand = user?.role === "BRAND" || user?.role === "AGENCY";

  return (
    <motion.div variants={fadeUp} custom={i}
      className="group flex h-full flex-col rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">

      {/* Card body — navigates to profile */}
      <Link href={`/creators/${creator.id}`} className="flex flex-1 flex-col p-5">
        {/* Avatar + badges */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 text-lg font-bold text-primary overflow-hidden">
            {creator.profileImageUrl
              ? <img src={creator.profileImageUrl} alt={name} className="h-14 w-14 object-cover" />
              : initials}
          </div>
          <div className="flex flex-col items-end gap-1">
            {creator.verificationStatus === "VERIFIED" && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                <Star className="h-3 w-3 fill-green-500 text-green-500" /> Verified
              </span>
            )}
            {creator.fraudRiskLevel && (
              <FraudBadge level={creator.fraudRiskLevel} size="xs" />
            )}
          </div>
        </div>

        {/* Name + location */}
        <div className="mb-3">
          <p className="font-semibold leading-tight">{name}</p>
          {creator.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {creator.location}
            </p>
          )}
        </div>

        {/* Categories */}
        {creator.categories?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {creator.categories.slice(0, 3).map(c => (
              <span key={c} className="rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary">{c}</span>
            ))}
            {creator.categories.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{creator.categories.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-2.5 border-t pt-3">
          {totalFollowers > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Followers</span>
              <span className="font-semibold">{fmt(totalFollowers)}</span>
            </div>
          )}
          {creator.socialAccounts?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {creator.socialAccounts.slice(0, 4).map(a => (
                <span key={a.id} className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${PLATFORM_COLOR[a.platform]}`}>
                  {PLATFORM_ICON[a.platform]}
                  {a.followersCount ? fmt(a.followersCount) : `@${a.handle}`}
                </span>
              ))}
            </div>
          )}
          {(creator.minRateUsd || creator.maxRateUsd) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold text-primary">
                {creator.minRateUsd ? `$${creator.minRateUsd.toLocaleString()}` : ""}
                {creator.minRateUsd && creator.maxRateUsd ? " – " : ""}
                {creator.maxRateUsd ? `$${creator.maxRateUsd.toLocaleString()}` : ""}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Action row (only shown when logged in) */}
      {user && (
        <div className="flex items-center gap-2 border-t px-4 py-2.5 bg-muted/20">
          <Link href={`/creators/${creator.id}`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
              View profile <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
          {user.role !== "CREATOR" && (
            <>
              <Link href={`/messages?with=${creator.userId}`}>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors" title="Message">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </Link>
              {onInvite && (
                <button onClick={() => onInvite(creator)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl gradient-brand text-white hover:opacity-90 transition-all" title="Invite to campaign">
                  <Megaphone className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const { user, accessToken } = useAuthStore();
  const isBrand = user?.role === "BRAND" || user?.role === "AGENCY";

  const [results, setResults] = useState<{ items: CreatorProfile[]; total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<CreatorProfile | null>(null);

  const [q, setQ]               = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [language, setLanguage] = useState(searchParams.get("language") ?? "");
  const [minRate, setMinRate]   = useState(searchParams.get("minRate") ?? "");
  const [maxRate, setMaxRate]   = useState(searchParams.get("maxRate") ?? "");
  const [minFol, setMinFol]     = useState(searchParams.get("minFollowers") ?? "");
  const [maxFol, setMaxFol]     = useState(searchParams.get("maxFollowers") ?? "");
  const [page, setPage]         = useState(Number(searchParams.get("page") ?? 1));

  const activeFilters = [category, location, language, minRate, maxRate, minFol, maxFol].filter(Boolean).length;

  const doFetch = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await api.listCreators({
        q: q || undefined,
        category: category || undefined,
        location: location || undefined,
        language: language || undefined,
        minRate: minRate ? Number(minRate) : undefined,
        maxRate: maxRate ? Number(maxRate) : undefined,
        minFollowers: minFol ? Number(minFol) : undefined,
        maxFollowers: maxFol ? Number(maxFol) : undefined,
        page: p,
        limit: 12,
      });
      setResults(res);
    } catch { setResults({ items: [], total: 0, page: 1, limit: 12 }); }
    setLoading(false);
  }, [q, category, location, language, minRate, maxRate, minFol, maxFol, page]);

  useEffect(() => { doFetch(); }, []);

  function applyFilters() { setPage(1); doFetch(1); setShowFilters(false); }
  function clearFilters() {
    setQ(""); setCategory(""); setLocation(""); setLanguage("");
    setMinRate(""); setMaxRate(""); setMinFol(""); setMaxFol("");
    setPage(1);
    setTimeout(() => doFetch(1), 0);
  }
  function goPage(p: number) { setPage(p); doFetch(p); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const totalPages = results ? Math.ceil(results.total / results.limit) : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/marketplace" className="font-medium text-foreground">Marketplace</Link>
            <Link href="/register?role=BRAND" className="hover:text-foreground transition-colors">For Brands</Link>
            <Link href="/register?role=CREATOR" className="hover:text-foreground transition-colors">For Creators</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all">Dashboard</button>
              </Link>
            ) : (
              <>
                <Link href="/login"><button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</button></Link>
                <Link href="/register"><button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all">Sign up</button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold">Creator Marketplace</h1>
          <p className="text-muted-foreground">Discover verified creators across UAE and MENA</p>
        </div>

        {/* Search bar + filter toggle */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
              placeholder="Search by name, niche, or keyword…"
              className="input-glow w-full rounded-2xl border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary transition-all"
            />
          </div>
          <button onClick={applyFilters} className="gradient-brand rounded-2xl px-5 text-sm font-semibold text-white hover:opacity-90 transition-all">
            Search
          </button>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters || activeFilters > 0 ? "border-primary bg-primary/8 text-primary" : "hover:bg-muted"
            }`}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden rounded-2xl border bg-card p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
                  <select value={location} onChange={e => setLocation(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">All locations</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">All languages</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate (USD)</label>
                  <div className="flex gap-2">
                    <input type="number" value={minRate} onChange={e => setMinRate(e.target.value)} placeholder="Min"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                    <input type="number" value={maxRate} onChange={e => setMaxRate(e.target.value)} placeholder="Max"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={applyFilters} className="gradient-brand rounded-xl px-6 py-2 text-sm font-semibold text-white hover:opacity-90">Apply filters</button>
                <button onClick={clearFilters} className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {category  && <Chip label={category}  onRemove={() => { setCategory(""); }} />}
            {location  && <Chip label={location}  onRemove={() => { setLocation(""); }} />}
            {language  && <Chip label={language}  onRemove={() => { setLanguage(""); }} />}
            {(minRate || maxRate) && <Chip label={`$${minRate||"0"} – $${maxRate||"∞"}`} onRemove={() => { setMinRate(""); setMaxRate(""); }} />}
            {(minFol  || maxFol)  && <Chip label={`${fmt(Number(minFol||0))} – ${maxFol ? fmt(Number(maxFol)) : "∞"} followers`} onRemove={() => { setMinFol(""); setMaxFol(""); }} />}
          </div>
        )}

        {/* Results count */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Searching…" : `${results?.total ?? 0} creator${results?.total !== 1 ? "s" : ""} found`}
          </p>
          {isBrand && (
            <p className="text-xs text-muted-foreground">
              <Megaphone className="inline h-3 w-3 mr-1 opacity-60" />
              Click <span className="font-medium">orange button</span> on a card to send a quick invite
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border bg-muted" />
            ))}
          </div>
        ) : results?.items.length === 0 ? (
          <div className="py-24 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-semibold">No creators found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline">Clear all filters</button>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results?.items.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                i={i}
                onInvite={isBrand ? setInviteTarget : undefined}
              />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => goPage(p)}
                className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${
                  p === page ? "gradient-brand text-white shadow-md" : "border hover:bg-muted"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-40 transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick-invite modal */}
      <AnimatePresence>
        {inviteTarget && (
          <QuickInviteModal creator={inviteTarget} onClose={() => setInviteTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
