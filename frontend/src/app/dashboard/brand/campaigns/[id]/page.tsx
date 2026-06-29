"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Calendar, DollarSign, MapPin, Tag, Users, Trash2, Megaphone } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Campaign } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { CampaignPredictor } from "@/components/CampaignPredictor";

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACTIVE:    "bg-green-50 text-green-700 border-green-200",
  PAUSED:    "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const TRANSITIONS: Record<string, { label: string; next: string; style: string }[]> = {
  DRAFT:    [{ label: "Activate", next: "ACTIVE",    style: "gradient-brand text-white" }, { label: "Cancel", next: "CANCELLED", style: "border border-red-200 text-red-600 hover:bg-red-50" }],
  ACTIVE:   [{ label: "Pause",   next: "PAUSED",    style: "border hover:bg-muted" },      { label: "Complete", next: "COMPLETED", style: "border border-green-200 text-green-700 hover:bg-green-50" }],
  PAUSED:   [{ label: "Resume",  next: "ACTIVE",    style: "gradient-brand text-white" }, { label: "Cancel", next: "CANCELLED", style: "border border-red-200 text-red-600 hover:bg-red-50" }],
  COMPLETED: [],
  CANCELLED: [],
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    load();
  }, [params.id, accessToken]);

  async function load() {
    try {
      const c = await api.getCampaign(params.id as string, accessToken ?? undefined);
      setCampaign(c);
    } catch { router.push("/dashboard/brand"); }
    setLoading(false);
  }

  async function changeStatus(status: string) {
    if (!accessToken || !campaign) return;
    setUpdating(true);
    try {
      const updated = await api.updateCampaign(accessToken, campaign.id, { status: status as any });
      setCampaign(updated);
    } catch (e: any) { alert(e.message); }
    setUpdating(false);
  }

  async function deleteCampaign() {
    if (!accessToken || !campaign) return;
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    await api.deleteCampaign(accessToken, campaign.id);
    router.push("/dashboard/brand");
  }

  if (loading) return (
    <DashboardShell>
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </DashboardShell>
  );

  if (!campaign) return null;

  const actions = TRANSITIONS[campaign.status] ?? [];
  const campaignId = params.id as string;

  return (
    <DashboardShell title={campaign.title}>
      <div className="mx-auto max-w-3xl">

        {/* Title + status + action buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{campaign.title}</h1>
              {campaign.brand?.companyName && (
                <p className="text-sm text-muted-foreground">{campaign.brand.companyName}</p>
              )}
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOR[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map(a => (
                <button key={a.next} onClick={() => changeStatus(a.next)} disabled={updating}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 ${a.style}`}>
                  {updating ? "…" : a.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Key stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
          className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold">${campaign.budgetUsd.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Campaign budget</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{campaign.type.replace("_", " ")}</div>
              <div className="text-sm text-muted-foreground">Campaign type</div>
            </div>
          </div>
        </motion.div>

        {/* Details card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }}
          className="mb-5 rounded-2xl border bg-card p-6 space-y-4">

          {campaign.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">About this campaign</p>
              <p className="text-sm leading-relaxed">{campaign.description}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
            {campaign.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</span>
              </div>
            )}
            {campaign.targetLocations.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Locations:</span>
                <span className="font-medium">{campaign.targetLocations.join(", ")}</span>
              </div>
            )}
          </div>

          {campaign.targetCategories.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creator niches</p>
              <div className="flex flex-wrap gap-2">
                {campaign.targetCategories.map(c => (
                  <span key={c} className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">{c}</span>
                ))}
              </div>
            </div>
          )}

          {campaign.targetAudience && (
            <div className="border-t pt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target audience</p>
              <p className="text-sm text-muted-foreground">{campaign.targetAudience}</p>
            </div>
          )}

          {campaign.requirements && (
            <div className="border-t pt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creator requirements</p>
              <p className="text-sm text-muted-foreground">{campaign.requirements}</p>
            </div>
          )}
        </motion.div>

        {/* AI Performance Predictor */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }} className="mb-5">
          <CampaignPredictor campaignId={campaign.id} accessToken={accessToken!} />
        </motion.div>

        {/* Navigation CTA row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-3">
            <p className="font-semibold">Find creators for this campaign</p>
            <p className="text-sm text-muted-foreground">Browse matching creators or view AI recommendations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/brand/campaigns/${campaignId}/analytics`}>
              <button className="flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                <BarChart3 className="h-4 w-4" /> Analytics
              </button>
            </Link>
            <Link href={`/dashboard/brand/campaigns/${campaignId}/recommendations`}>
              <button className="gradient-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                AI Recommendations <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href={`/marketplace${campaign.targetCategories.length ? "?" + campaign.targetCategories.map(c => `category=${c}`).join("&") : ""}`}>
              <button className="flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                <Users className="h-4 w-4" /> Browse all
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Danger zone */}
        {(campaign.status === "DRAFT" || campaign.status === "CANCELLED") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.24 } }}
            className="flex justify-end">
            <button onClick={deleteCampaign}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" /> Delete campaign
            </button>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
