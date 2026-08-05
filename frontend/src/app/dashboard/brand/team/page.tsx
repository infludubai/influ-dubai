"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Loader2, UserPlus, Trash2, AlertCircle, Crown, Mail, ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type WorkspaceMembers, type WorkspaceRole } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const ASSIGNABLE: WorkspaceRole[] = ["ADMIN", "MEMBER", "VIEWER"];

const ROLE_HELP: Record<WorkspaceRole, string> = {
  OWNER: "Full control including billing",
  ADMIN: "Manage campaigns, deliverables and team members",
  MEMBER: "Manage campaigns and deliverables",
  VIEWER: "Read-only access",
};

export default function TeamPage() {
  const { accessToken } = useAuthStore();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [data, setData] = useState<WorkspaceMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const ws = await api.listWorkspaces(accessToken);
      const id = ws.activeId ?? ws.workspaces[0]?.id ?? null;
      setWorkspaceId(id);
      if (id) setData(await api.listWorkspaceMembers(accessToken, id));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    if (!accessToken || !workspaceId || !email.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await api.inviteWorkspaceMember(accessToken, workspaceId, {
        email: email.trim(),
        role,
      });
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberId: string, next: WorkspaceRole) {
    if (!accessToken || !workspaceId) return;
    try {
      await api.updateWorkspaceMemberRole(accessToken, workspaceId, memberId, next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change role");
    }
  }

  async function remove(memberId: string) {
    if (!accessToken || !workspaceId) return;
    if (!confirm("Remove this person from the workspace?")) return;
    try {
      await api.removeWorkspaceMember(accessToken, workspaceId, memberId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member");
    }
  }

  const seats = data?.seats;
  const atLimit = seats && seats.limit !== -1 && seats.used >= seats.limit;

  return (
    <DashboardShell>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite colleagues to collaborate on this workspace&apos;s campaigns,
            deliverables and creators.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No workspace yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your brand profile first.
            </p>
            <Link
              href="/dashboard/brand/profile"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Go to brand profile
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border bg-card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Invite a team member</h2>
                {seats && (
                  <span className="text-xs text-muted-foreground">
                    {seats.used} of {seats.limit === -1 ? "unlimited" : seats.limit}{" "}
                    seat{seats.limit === 1 ? "" : "s"} used
                  </span>
                )}
              </div>

              {atLimit ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                  <span>
                    You&apos;ve used every seat on your plan. Upgrade to add more
                    team members.
                  </span>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline"
                  >
                    View plans <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && invite()}
                    placeholder="colleague@company.com"
                    className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
                  >
                    {ASSIGNABLE.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={invite}
                    disabled={inviting || !email.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {inviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Invite
                  </button>
                </div>
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                {ROLE_HELP[role]}
              </p>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="border-b bg-muted/30 px-5 py-3">
                <h2 className="text-sm font-bold">Members</h2>
              </div>
              <div className="divide-y">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      {data.owner.displayName ?? data.owner.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {data.owner.email}
                    </p>
                  </div>
                  <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                    Owner
                  </span>
                </div>

                {data.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.displayName ?? m.email}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        {m.email}
                        {m.status === "INVITED" && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                            <Mail className="h-2.5 w-2.5" /> Invited
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) =>
                          changeRole(m.id, e.target.value as WorkspaceRole)
                        }
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary/60"
                      >
                        {ASSIGNABLE.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0) + r.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => remove(m.id)}
                        title="Remove from workspace"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {data.members.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No team members yet — it&apos;s just you.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
