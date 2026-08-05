"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Plus, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type Workspace } from "@/lib/api";

/**
 * Switches which brand account (client workspace) the user is acting as.
 * Hidden entirely for creators and for brands with a single workspace — there
 * is nothing to switch between, and an inert control is just noise.
 */
export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isBrandSide = user?.role === "BRAND" || user?.role === "AGENCY";

  const load = useCallback(async () => {
    if (!accessToken || !isBrandSide) return;
    try {
      const res = await api.listWorkspaces(accessToken);
      setWorkspaces(res.workspaces);
      setActiveId(res.activeId);
    } catch {
      setWorkspaces([]);
    }
  }, [accessToken, isBrandSide]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function switchTo(id: string) {
    if (!accessToken || id === activeId) {
      setOpen(false);
      return;
    }
    setSwitching(id);
    try {
      await api.switchWorkspace(accessToken, id);
      setActiveId(id);
      setOpen(false);
      // Every brand-scoped view is now looking at a different workspace.
      router.refresh();
      window.location.reload();
    } finally {
      setSwitching(null);
    }
  }

  async function create() {
    if (!accessToken || !newName.trim()) return;
    setError(null);
    try {
      const created = await api.createWorkspace(accessToken, {
        companyName: newName.trim(),
      });
      setNewName("");
      setCreating(false);
      await switchTo(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create workspace");
    }
  }

  const isAgency = user?.role === "AGENCY";
  if (!isBrandSide) return null;
  if (workspaces.length <= 1 && !isAgency) return null;

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <div ref={ref} className="relative mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border bg-muted/30 px-2.5 py-2 text-left transition-colors hover:bg-muted"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {active?.companyName ?? "No workspace"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {active?.role === "OWNER" ? "Owner" : active?.role.toLowerCase()}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="max-h-56 overflow-y-auto py-1">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => switchTo(w.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {w.companyName}
                </span>
                {switching === w.id ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  w.id === activeId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )
                )}
              </button>
            ))}
          </div>

          {isAgency && (
            <div className="border-t p-2">
              {creating ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && create()}
                    placeholder="Client name"
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary/60"
                  />
                  {error && <p className="text-[10px] text-destructive">{error}</p>}
                  <div className="flex gap-1">
                    <button
                      onClick={create}
                      className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setCreating(false);
                        setError(null);
                      }}
                      className="rounded-lg border px-2 py-1.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add client workspace
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
