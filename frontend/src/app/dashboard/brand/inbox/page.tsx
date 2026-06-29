"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Proposal = Awaited<ReturnType<typeof api.getCampaignProposals>>[number];

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACCEPTED:  "bg-green-50 text-green-700 border-green-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function BrandInboxPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [proposals, setProposals] = useState<(Proposal & { campaignTitle: string; campaignId: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    load();
  }, [accessToken]);

  async function load() {
    setLoading(true);
    try {
      const campaigns = await api.getMyCampaigns(accessToken!);
      const all = await Promise.all(
        campaigns.map(c =>
          api.getCampaignProposals(accessToken!, c.id)
            .then(ps => ps.map(p => ({ ...p, campaignTitle: c.title, campaignId: c.id })))
            .catch(() => [])
        )
      );
      setProposals(all.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { /* empty */ }
    setLoading(false);
  }

  async function respond(id: string, status: "ACCEPTED" | "REJECTED") {
    await api.respondToProposal(accessToken!, id, status);
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }

  const pendingCount = proposals.filter(p => p.status === "PENDING").length;

  return (
    <DashboardShell title="Inbox">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Creator proposals across all your campaigns</p>
        </motion.div>

        {pendingCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{pendingCount}</span>
            {pendingCount === 1 ? "1 proposal needs your response" : `${pendingCount} proposals need your response`}
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted opacity-30">
              <FileText className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold">No proposals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Activate a campaign and invite creators to start receiving proposals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((p, i) => {
              const name = p.creator?.user?.profile?.displayName ?? "Creator";
              const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  className="rounded-2xl border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                        <span className="text-xs text-muted-foreground">
                          for <Link href={`/dashboard/brand/campaigns/${p.campaignId}`} className="text-primary hover:underline font-medium">{p.campaignTitle}</Link>
                        </span>
                      </div>
                      {p.proposedRate != null && (
                        <p className="mt-1 text-sm font-semibold text-primary">${p.proposedRate.toLocaleString()} proposed rate</p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.coverLetter}</p>
                    </div>
                    {p.status === "PENDING" && (
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                        <button onClick={() => respond(p.id, "REJECTED")}
                          className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button onClick={() => respond(p.id, "ACCEPTED")}
                          className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
