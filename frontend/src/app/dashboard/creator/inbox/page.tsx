"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Invitation = Awaited<ReturnType<typeof api.getMyInvitations>>[number];
type Proposal = Awaited<ReturnType<typeof api.getMyProposals>>[number];

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACCEPTED:  "bg-green-50 text-green-700 border-green-200",
  DECLINED:  "bg-red-50 text-red-700 border-red-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function CreatorInboxPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<"invitations" | "proposals">("invitations");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    load();
  }, [accessToken]);

  async function load() {
    setLoading(true);
    const [inv, prop] = await Promise.all([
      api.getMyInvitations(accessToken!).catch(() => []),
      api.getMyProposals(accessToken!).catch(() => []),
    ]);
    setInvitations(inv);
    setProposals(prop);
    setLoading(false);
  }

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    await api.respondToInvitation(accessToken!, id, status);
    setInvitations(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  async function withdraw(id: string) {
    await api.withdrawProposal(accessToken!, id);
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: "WITHDRAWN" } : p));
  }

  const pendingCount = invitations.filter(i => i.status === "PENDING").length;

  return (
    <DashboardShell title="Inbox">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">Campaign invitations and your submitted proposals</p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border bg-muted/40 p-1">
          {(["invitations", "proposals"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
              {t === "invitations" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{pendingCount}</span>
              )}
              {t === "proposals" && proposals.length > 0 && (
                <span className="ml-1.5 text-muted-foreground text-xs">({proposals.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : tab === "invitations" ? (
          invitations.length === 0 ? (
            <Empty icon={<Mail className="h-10 w-10" />} text="No invitations yet" sub="Brands will invite you to their campaigns here." />
          ) : (
            <div className="space-y-3">
              {invitations.map((inv, i) => (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  className="rounded-2xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{inv.campaign.title}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {inv.campaign.brand?.companyName ?? "Brand"} · <span className="font-medium text-foreground">${inv.campaign.budgetUsd?.toLocaleString()}</span> budget
                      </p>
                      {inv.message && (
                        <p className="mt-2 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground italic">"{inv.message}"</p>
                      )}
                    </div>
                    {inv.status === "PENDING" && (
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => respond(inv.id, "DECLINED")}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </button>
                        <button onClick={() => respond(inv.id, "ACCEPTED")}
                          className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          proposals.length === 0 ? (
            <Empty icon={<Send className="h-10 w-10" />} text="No proposals sent"
              sub={<>Browse campaigns and submit your first proposal. <Link href="/marketplace" className="text-primary hover:underline">Explore marketplace →</Link></>} />
          ) : (
            <div className="space-y-3">
              {proposals.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  className="rounded-2xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{p.campaign.title}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">by {p.campaign.brand?.companyName ?? "Brand"}</p>
                      {p.proposedRate != null && (
                        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary">
                          <DollarSign className="h-3.5 w-3.5" /> ${p.proposedRate.toLocaleString()} proposed
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.coverLetter}</p>
                    </div>
                    {p.status === "PENDING" && (
                      <button onClick={() => withdraw(p.id)}
                        className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                        Withdraw
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </DashboardShell>
  );
}

function Empty({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: React.ReactNode }) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground opacity-40">{icon}</div>
      <p className="text-lg font-semibold">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
