"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

type Campaign = { id: string; title: string; status: string; budgetUsd: number; createdAt: string; brand: { companyName: string }; _count: { invitations: number; proposals: number } };

const STATUSES = ["", "DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PAUSED: "bg-yellow-50 text-yellow-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function AdminCampaignsPage() {
  const { accessToken } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.adminListCampaigns(accessToken, { page, limit: 20, status: status || undefined });
      setCampaigns(res.campaigns);
      setTotal(res.total);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [accessToken, page, status]);

  async function updateStatus(campaignId: string, newStatus: string) {
    if (!accessToken) return;
    await api.adminUpdateCampaignStatus(accessToken, campaignId, newStatus).catch(() => {});
    load();
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Campaigns</h1>

      <div className="mb-4 flex gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Campaign</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Budget</th>
                <th className="px-4 py-3 text-left">Invites / Proposals</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.brand.companyName}</td>
                  <td className="px-4 py-3">${c.budgetUsd.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c._count.invitations} / {c._count.proposals}</td>
                  <td className="px-4 py-3">
                    <select value={c.status}
                      onChange={e => updateStatus(c.id, e.target.value)}
                      className={`rounded-lg border px-2 py-1 text-xs font-medium outline-none ${STATUS_COLOR[c.status] ?? ""}`}>
                      {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} total campaigns</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40 hover:bg-muted transition-colors">Previous</button>
          <span className="px-3 py-1.5">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
