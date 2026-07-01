"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, Mail, FileText, ArrowRight, CheckCircle2,
  Clock, XCircle, Sparkles, BarChart3, User, Megaphone, MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

type Analytics = Awaited<ReturnType<typeof api.getCreatorAnalytics>>;
type Invitation = Awaited<ReturnType<typeof api.getMyInvitations>>[number];
type Proposal = Awaited<ReturnType<typeof api.getMyProposals>>[number];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const INV_STATUS: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING:  { label: "Pending",  icon: Clock,         cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DECLINED: { label: "Declined", icon: XCircle,       cls: "bg-red-50 text-red-700 border-red-200" },
};

const PROP_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Under review", cls: "bg-amber-50 text-amber-700" },
  ACCEPTED:  { label: "Accepted",     cls: "bg-emerald-50 text-emerald-700" },
  REJECTED:  { label: "Rejected",     cls: "bg-red-50 text-red-700" },
  WITHDRAWN: { label: "Withdrawn",    cls: "bg-gray-100 text-gray-500" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
};

export default function CreatorDashboardPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "CREATOR") { router.replace("/dashboard"); return; }

    Promise.all([
      api.getCreatorAnalytics(accessToken).catch(() => null),
      api.getMyInvitations(accessToken).catch(() => []),
      api.getMyProposals(accessToken).catch(() => []),
    ]).then(([a, inv, prop]) => {
      setAnalytics(a);
      setInvitations(inv as Invitation[]);
      setProposals(prop as Proposal[]);
    }).finally(() => setLoading(false));
  }, [accessToken, user, router]);

  const pendingInvites = invitations.filter(i => i.status === "PENDING");
  const acceptedProposals = proposals.filter(p => p.status === "ACCEPTED");

  return (
    <DashboardShell>
      <motion.div initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>

          {/* Header */}
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl font-bold">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
              {" "}{user?.displayName?.split(" ")[0] ?? "Creator"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your creator account.</p>
          </motion.div>

          {/* KPI cards */}
          {loading ? (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />)}
            </div>
          ) : (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Reach", value: fmt(analytics?.totals.totalReach ?? 0), icon: Users, color: "bg-blue-500/10 text-blue-500" },
                { label: "Total Engagement", value: fmt(analytics?.totals.totalEngagement ?? 0), icon: TrendingUp, color: "bg-violet-500/10 text-violet-500" },
                { label: "Pending Invites", value: pendingInvites.length, icon: Mail, color: "bg-amber-500/10 text-amber-500" },
                { label: "Accepted Deals", value: acceptedProposals.length, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
              ].map((card, i) => (
                <motion.div key={card.label} variants={fadeUp} custom={i + 1}
                  className="card-hover rounded-2xl border bg-card p-5">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <motion.div variants={fadeUp} custom={5} className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/dashboard/creator/profile", icon: User, label: "Update profile", desc: "Keep your profile fresh for brands", color: "text-violet-600 bg-violet-50" },
              { href: "/marketplace", icon: Megaphone, label: "Browse campaigns", desc: "Find campaigns to apply for", color: "text-blue-600 bg-blue-50" },
              { href: "/messages", icon: MessageSquare, label: "Messages", desc: "Check your brand conversations", color: "text-indigo-600 bg-indigo-50" },
            ].map(a => (
              <Link key={a.href} href={a.href}>
                <div className="card-hover flex items-center gap-3 rounded-2xl border bg-card p-4 cursor-pointer">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending invitations */}
            <motion.div variants={fadeUp} custom={6} className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <p className="font-semibold text-sm">Pending invitations</p>
                <Link href="/dashboard/creator/inbox" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : pendingInvites.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
                  <Link href="/marketplace" className="text-xs text-primary hover:underline">Browse campaigns →</Link>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingInvites.slice(0, 4).map(inv => {
                    const meta = INV_STATUS[inv.status] ?? INV_STATUS.PENDING;
                    const StatusIcon = meta.icon;
                    return (
                      <div key={inv.id} className="flex items-start gap-3 px-5 py-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{inv.campaign.title}</p>
                          <p className="text-xs text-muted-foreground">{inv.campaign.brand.companyName} · ${inv.campaign.budgetUsd.toLocaleString()} budget</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                          <StatusIcon className="h-2.5 w-2.5" /> {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* My proposals */}
            <motion.div variants={fadeUp} custom={7} className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <p className="font-semibold text-sm">My proposals</p>
                <Link href="/dashboard/creator/inbox" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : proposals.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No proposals yet</p>
                  <p className="text-xs text-muted-foreground">Submit proposals to active campaigns</p>
                </div>
              ) : (
                <div className="divide-y">
                  {proposals.slice(0, 4).map(prop => {
                    const meta = PROP_STATUS[prop.status] ?? PROP_STATUS.PENDING;
                    return (
                      <div key={prop.id} className="flex items-start gap-3 px-5 py-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prop.campaign.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {prop.campaign.brand.companyName}
                            {prop.proposedRate ? ` · $${prop.proposedRate.toLocaleString()} proposed` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Analytics teaser */}
          {(analytics?.totals.totalReach ?? 0) > 0 && (
            <motion.div variants={fadeUp} custom={8}
              className="mt-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">You've reached {fmt(analytics!.totals.totalReach)} people</p>
                  <p className="text-xs text-muted-foreground">Across {analytics!.campaigns.length} campaign{analytics!.campaigns.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Link href="/dashboard/creator/analytics">
                <button className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-all">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> View analytics
                </button>
              </Link>
            </motion.div>
          )}
      </motion.div>
    </DashboardShell>
  );
}
