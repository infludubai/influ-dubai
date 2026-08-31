"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Check, Search, Sparkles, Trash2, X } from "lucide-react";

type User = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  featureOverrides: Record<string, boolean> | null;
  role: { name: string };
  profile: { displayName: string; avatarUrl: string | null } | null;
};

const STATUS_OPTIONS = ["ACTIVE", "PENDING_APPROVAL", "PENDING_VERIFICATION", "SUSPENDED"];
const ROLE_OPTIONS = ["CREATOR", "BRAND", "AGENCY", "ADMIN"];

/** Must mirror GRANTABLE_FEATURES on the API — unknown keys are rejected there. */
const FEATURES: Array<{ key: string; label: string }> = [
  { key: "aiInsights", label: "AI insights" },
  { key: "analytics", label: "Analytics" },
  { key: "unlimitedCampaigns", label: "Unlimited campaigns" },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-600",
  PENDING_VERIFICATION: "bg-amber-500/10 text-amber-600",
  SUSPENDED: "bg-red-500/10 text-red-600",
};

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [featuresFor, setFeaturesFor] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.adminListUsers(accessToken, {
        page, limit: 20,
        role: role || undefined,
        search: search || undefined,
        status: status || undefined,
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // The pending badge is independent of the current filter, so approvals
  // never go unnoticed while browsing another view.
  async function loadPendingCount() {
    if (!accessToken) return;
    try {
      const res = await api.adminListUsers(accessToken, { page: 1, limit: 1, status: "PENDING_APPROVAL" });
      setPendingCount(res.total);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); loadPendingCount(); }, [accessToken, page, role, status]);

  async function act(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    }
    load();
    loadPendingCount();
  }

  const updateStatus = (u: User, s: string) =>
    act(() => api.adminUpdateUserStatus(accessToken!, u.id, s));
  const updateRole = (u: User, r: string) =>
    act(() => api.adminUpdateUserRole(accessToken!, u.id, r));

  async function toggleFeature(u: User, key: string) {
    const next: Record<string, boolean> = { ...(u.featureOverrides ?? {}) };
    if (next[key]) delete next[key];
    else next[key] = true;
    await act(() => api.adminUpdateUserFeatures(accessToken!, u.id, next));
  }

  async function deleteUser(userId: string, email: string) {
    if (!accessToken || !confirm(`Delete user ${email}? This is irreversible.`)) return;
    await act(() => api.adminDeleteUser(accessToken, userId));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        {pendingCount > 0 && (
          <button
            onClick={() => { setStatus("PENDING_APPROVAL"); setPage(1); }}
            className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 transition-colors"
          >
            {pendingCount} awaiting approval
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setPage(1); load(); } }}
            placeholder="Search by email or name…"
            className="w-full rounded-xl border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button onClick={() => { setPage(1); load(); }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.profile?.displayName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.featureOverrides && Object.keys(u.featureOverrides).length > 0 && (
                      <p className="mt-1 text-[11px] text-primary">
                        + {Object.keys(u.featureOverrides).length} feature grant{Object.keys(u.featureOverrides).length > 1 ? "s" : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role.name}
                      onChange={e => updateRole(u, e.target.value)}
                      className="rounded-lg border bg-background px-2 py-1 text-xs font-medium outline-none"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === "PENDING_APPROVAL" ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[u.status]}`}>
                          PENDING
                        </span>
                        <button
                          onClick={() => updateStatus(u, "ACTIVE")}
                          title="Approve"
                          className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(u, "SUSPENDED")}
                          title="Reject"
                          className="rounded-lg bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <select value={u.status}
                        onChange={e => updateStatus(u, e.target.value)}
                        className="rounded-lg border bg-background px-2 py-1 text-xs outline-none">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFeaturesFor(featuresFor === u.id ? null : u.id)}
                        title="Feature grants"
                        className={`rounded-lg p-1.5 transition-colors ${featuresFor === u.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteUser(u.id, u.email)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {featuresFor === u.id && (
                      <div className="mt-2 space-y-1.5 rounded-xl border bg-background p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Grants on top of plan
                        </p>
                        {FEATURES.map(f => (
                          <label key={f.key} className="flex cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={u.featureOverrides?.[f.key] === true}
                              onChange={() => toggleFeature(u, f.key)}
                              className="h-3.5 w-3.5 accent-[var(--primary)]"
                            />
                            {f.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} total users</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40 hover:bg-muted transition-colors">
            Previous
          </button>
          <span className="px-3 py-1.5">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40 hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
