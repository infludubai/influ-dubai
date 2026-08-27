"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  api,
  type PlatformSetting,
  type PlatformSettingGroup,
  type SettingGroupId,
} from "@/lib/api";
import {
  Sparkles, CreditCard, Mail, SlidersHorizontal,
  Eye, EyeOff, Check, X, Loader2, ExternalLink, Save, AlertTriangle,
} from "lucide-react";

const GROUP_ICON: Record<SettingGroupId, React.ElementType> = {
  openai: Sparkles,
  stripe: CreditCard,
  smtp: Mail,
  platform: SlidersHorizontal,
};

const SOURCE_BADGE: Record<
  PlatformSetting["source"],
  { label: string; className: string }
> = {
  database: {
    label: "Saved here",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  environment: {
    label: "From env var",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  unset: {
    label: "Not set",
    className: "bg-muted text-muted-foreground border-border",
  },
};

type TestState = { status: "idle" | "running" | "done"; ok?: boolean; message?: string };

export default function AdminSettingsPage() {
  const { accessToken } = useAuthStore();

  const [groups, setGroups] = useState<PlatformSettingGroup[]>([]);
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [tests, setTests] = useState<Record<string, TestState>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetSettings(accessToken);
      setGroups(res.groups);
      setSettings(res.settings);
      setDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyKeys = useMemo(() => Object.keys(drafts), [drafts]);

  async function handleSave() {
    if (!accessToken || dirtyKeys.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.adminUpdateSettings(accessToken, drafts);
      setGroups(res.groups);
      setSettings(res.settings);
      setDrafts({});
      setRevealed({});
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(group: SettingGroupId) {
    if (!accessToken) return;
    setTests((t) => ({ ...t, [group]: { status: "running" } }));
    try {
      const res = await api.adminTestIntegration(accessToken, group);
      setTests((t) => ({
        ...t,
        [group]: { status: "done", ok: res.ok, message: res.message },
      }));
    } catch (err) {
      setTests((t) => ({
        ...t,
        [group]: {
          status: "done",
          ok: false,
          message: err instanceof Error ? err.message : "Test failed",
        },
      }));
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings &amp; Integrations</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect the services the platform depends on. Keys saved here are
            encrypted at rest and take effect immediately — no redeploy needed.
            A value set here overrides the matching environment variable.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || dirtyKeys.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {dirtyKeys.length > 0
            ? `Save ${dirtyKeys.length} change${dirtyKeys.length > 1 ? "s" : ""}`
            : "Saved"}
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedAt && dirtyKeys.length === 0 && !error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          <Check className="h-4 w-4 shrink-0" />
          Settings saved and applied.
        </div>
      )}

      <div className="space-y-5">
        {groups.map((group) => {
          const Icon = GROUP_ICON[group.id];
          const groupSettings = settings.filter((s) => s.group === group.id);
          const test = tests[group.id];

          return (
            <section
              key={group.id}
              className="overflow-hidden rounded-2xl border bg-card"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      {group.title}
                      {group.docsUrl && (
                        <a
                          href={group.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Get keys <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </h2>
                    <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                </div>

                {group.testable && (
                  <button
                    onClick={() => handleTest(group.id)}
                    disabled={test?.status === "running"}
                    className="shrink-0 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {test?.status === "running" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testing…
                      </span>
                    ) : (
                      "Test connection"
                    )}
                  </button>
                )}
              </header>

              {test?.status === "done" && (
                <div
                  className={`flex items-start gap-2 border-b px-5 py-2.5 text-xs ${
                    test.ok
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {test.ok ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{test.message}</span>
                </div>
              )}

              <div className="divide-y">
                {groupSettings.map((setting) => {
                  const isDirty = setting.key in drafts;
                  const show = revealed[setting.key] ?? false;
                  const value = isDirty ? drafts[setting.key] : setting.value;
                  const badge = SOURCE_BADGE[setting.source];

                  return (
                    <div
                      key={setting.key}
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_1fr] sm:gap-5"
                    >
                      <div className="min-w-0">
                        <label
                          htmlFor={setting.key}
                          className="block text-sm font-medium"
                        >
                          {setting.label}
                        </label>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <code className="text-[10px] text-muted-foreground">
                            {setting.key}
                          </code>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="relative">
                          <input
                            id={setting.key}
                            type={
                              setting.isSecret && !show && !isDirty
                                ? "text"
                                : setting.isSecret && !show
                                  ? "password"
                                  : setting.numeric
                                    ? "number"
                                    : "text"
                            }
                            value={value}
                            placeholder={setting.placeholder}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [setting.key]: e.target.value,
                              }))
                            }
                            onFocus={() => {
                              // Masked secrets aren't real values — clear on
                              // focus so a click-and-type replaces the key
                              // instead of appending to the mask.
                              if (
                                setting.isSecret &&
                                !isDirty &&
                                setting.value.includes("…")
                              ) {
                                setDrafts((d) => ({ ...d, [setting.key]: "" }));
                              }
                            }}
                            className={`w-full rounded-xl border bg-background px-3.5 py-2.5 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 ${
                              isDirty ? "border-primary/50" : "border-border"
                            }`}
                          />
                          {setting.isSecret && isDirty && (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealed((r) => ({
                                  ...r,
                                  [setting.key]: !show,
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                              title={show ? "Hide" : "Show"}
                            >
                              {show ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {setting.help && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {setting.help}
                          </p>
                        )}
                        {setting.isSecret && setting.configured && !isDirty && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Stored securely. Click the field and type to replace
                            it, or clear it to remove.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Secrets are encrypted with AES-256-GCM before being written to the
        database and are never returned to the browser in full. Every change is
        written to the audit log with the admin who made it — the value itself
        is never logged.
      </p>
    </div>
  );
}
