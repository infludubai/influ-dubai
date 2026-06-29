"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, DollarSign, Calendar, MapPin, Tag, ChevronLeft, ChevronRight,
  Send, X, Loader2, CheckCircle2, Building2, Filter,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Campaign } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type PublicCampaign = Campaign & { brand: { companyName: string; logoUrl: string | null } };

const TYPES = ["AWARENESS", "ENGAGEMENT", "LEAD_GENERATION", "SALES"];
const TYPE_LABEL: Record<string, string> = {
  AWARENESS: "Awareness", ENGAGEMENT: "Engagement", LEAD_GENERATION: "Lead Gen", SALES: "Sales",
};
const TYPE_COLOR: Record<string, string> = {
  AWARENESS: "bg-blue-50 text-blue-700", ENGAGEMENT: "bg-violet-50 text-violet-700",
  LEAD_GENERATION: "bg-emerald-50 text-emerald-700", SALES: "bg-amber-50 text-amber-700",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ── Proposal modal ─────────────────────────────────────────────────────────────
function ProposalModal({
  campaign,
  onClose,
  onSent,
}: {
  campaign: PublicCampaign;
  onClose: () => void;
  onSent: (id: string) => void;
}) {
  const { accessToken } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState("");
  const [rate, setRate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!accessToken || !coverLetter.trim()) { setError("Please write a cover letter."); return; }
    setSending(true);
    setError("");
    try {
      await api.submitProposal(accessToken, campaign.id, {
        coverLetter: coverLetter.trim(),
        proposedRate: rate ? Number(rate) : undefined,
      });
      onSent(campaign.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to submit proposal");
    }
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
        className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">Submit a proposal</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {campaign.title} · <span className="font-medium text-foreground">{campaign.brand.companyName}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-muted transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Budget: <span className="font-semibold text-foreground">${campaign.budgetUsd.toLocaleString()}</span></span>
          </span>
          {campaign.deadline && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Due: <span className="font-semibold text-foreground">{new Date(campaign.deadline).toLocaleDateString()}</span></span>
            </span>
          )}
          {campaign.targetCategories.length > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {campaign.targetCategories.slice(0, 3).join(", ")}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Cover letter <span className="text-destructive">*</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              rows={5}
              placeholder={`Tell ${campaign.brand.companyName} why you're the perfect creator for this campaign. Mention your relevant experience, audience, and content style…`}
              className="w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
            <p className="mt-1 text-xs text-muted-foreground">{coverLetter.length} characters</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Your proposed rate (USD) <span className="text-xs font-normal text-muted-foreground">optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full rounded-2xl border bg-background py-2.5 pl-7 pr-4 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={submit}
            disabled={sending || !coverLetter.trim()}
            className="gradient-brand flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Submit proposal</>}
          </button>
          <button onClick={onClose} className="rounded-2xl border px-5 py-3 text-sm hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CreatorCampaignsPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [proposalTarget, setProposalTarget] = useState<PublicCampaign | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "CREATOR") { router.replace("/dashboard"); return; }
  }, [accessToken, user]);

  useEffect(() => {
    load();
  }, [page, typeFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listPublicCampaigns({ type: typeFilter || undefined, page, limit: 12 });
      setCampaigns(res.items as PublicCampaign[]);
      setTotal(res.total);
    } catch { setCampaigns([]); }
    setLoading(false);
  }

  function handleSent(campaignId: string) {
    setSubmitted(prev => new Set([...prev, campaignId]));
    setProposalTarget(null);
  }

  const totalPages = Math.ceil(total / 12);

  return (
    <DashboardShell title="Browse Campaigns">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Browse Open Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} active campaign{total !== 1 ? "s" : ""} looking for creators like you
          </p>
        </motion.div>

        {/* Type filter */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="mb-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {["", ...TYPES].map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                typeFilter === t
                  ? "gradient-brand border-transparent text-white shadow-sm"
                  : "hover:border-primary/40 hover:text-foreground text-muted-foreground"
              }`}
            >
              {t ? TYPE_LABEL[t] : "All types"}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border bg-muted" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 py-24 text-center">
            <Megaphone className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-semibold">No active campaigns right now</p>
            <p className="text-sm text-muted-foreground">Check back soon — new campaigns are posted regularly.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {campaigns.map((c, i) => {
              const alreadyApplied = submitted.has(c.id);
              const brandInitials = c.brand.companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

              return (
                <motion.div key={c.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  className="flex flex-col rounded-2xl border bg-card transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="flex flex-1 flex-col p-5">
                    {/* Brand */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-indigo-400/15 text-xs font-bold text-primary">
                        {c.brand.logoUrl
                          ? <img src={c.brand.logoUrl} alt={c.brand.companyName} className="h-10 w-10 rounded-xl object-cover" />
                          : brandInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground truncate">{c.brand.companyName}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLOR[c.type] ?? "bg-muted"}`}>
                          {TYPE_LABEL[c.type]}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 font-semibold leading-snug line-clamp-2">{c.title}</h3>

                    {/* Description */}
                    {c.description && (
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
                    )}

                    {/* Categories */}
                    {c.targetCategories.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {c.targetCategories.slice(0, 3).map(cat => (
                          <span key={cat} className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] text-primary font-medium">{cat}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" /> Budget
                        </span>
                        <span className="font-bold text-emerald-600">${c.budgetUsd.toLocaleString()}</span>
                      </div>
                      {c.deadline && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline</span>
                          <span>{new Date(c.deadline).toLocaleDateString("en-AE", { dateStyle: "medium" })}</span>
                        </div>
                      )}
                      {c.targetLocations.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.targetLocations.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="border-t p-3">
                    {alreadyApplied ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Proposal sent
                      </div>
                    ) : (
                      <button
                        onClick={() => setProposalTarget(c)}
                        className="gradient-brand w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
                      >
                        <Send className="h-3.5 w-3.5" /> Apply now
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${
                  p === page ? "gradient-brand text-white shadow-md" : "border hover:bg-muted"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-40 transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Proposal modal */}
      <AnimatePresence>
        {proposalTarget && (
          <ProposalModal
            campaign={proposalTarget}
            onClose={() => setProposalTarget(null)}
            onSent={handleSent}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
