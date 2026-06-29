"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Search, Trash2 } from "lucide-react";

type User = { id: string; email: string; status: string; createdAt: string; role: { name: string }; profile: { displayName: string; avatarUrl: string | null } | null };

const STATUS_OPTIONS = ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"];
const ROLE_OPTIONS = ["", "CREATOR", "BRAND", "AGENCY", "ADMIN"];

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.adminListUsers(accessToken, { page, limit: 20, role: role || undefined, search: search || undefined });
      setUsers(res.users);
      setTotal(res.total);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [accessToken, page, role]);

  async function updateStatus(userId: string, status: string) {
    if (!accessToken) return;
    await api.adminUpdateUserStatus(accessToken, userId, status).catch(() => {});
    load();
  }

  async function deleteUser(userId: string, email: string) {
    if (!accessToken || !confirm(`Delete user ${email}? This is irreversible.`)) return;
    await api.adminDeleteUser(accessToken, userId).catch(() => {});
    load();
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Users</h1>

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
          {ROLE_OPTIONS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
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
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.profile?.displayName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium">{u.role.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.status}
                      onChange={e => updateStatus(u.id, e.target.value)}
                      className="rounded-lg border bg-background px-2 py-1 text-xs outline-none">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteUser(u.id, u.email)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
