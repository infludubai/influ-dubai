"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api, type AdminContent, type ContentField } from "@/lib/api";
import {
  Loader2, Save, RotateCcw, Check, AlertTriangle, ExternalLink, Pencil,
} from "lucide-react";

const PAGE_PREVIEW: Record<string, string> = {
  global: "/",
  home: "/",
  pricing: "/pricing",
  about: "/about",
  contact: "/contact",
};

function FieldEditor({
  field,
  value,
  dirty,
  onChange,
}: {
  field: ContentField;
  value: string;
  dirty: boolean;
  onChange: (v: string) => void;
}) {
  const base = `w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 ${
    dirty ? "border-primary/50" : "border-border"
  }`;

  const rowsForType =
    field.type === "rows" ? 6 : field.type === "list" ? 5 : 4;

  return (
    <div className="grid gap-2 px-5 py-4 sm:grid-cols-[230px_1fr] sm:gap-5">
      <div className="min-w-0">
        <label htmlFor={field.key} className="block text-sm font-medium">
          {field.label}
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {field.customised && !dirty && (
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              Edited
            </span>
          )}
          {dirty && (
            <span className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Unsaved
            </span>
          )}
          <code className="text-[10px] text-muted-foreground">{field.key}</code>
        </div>
      </div>

      <div className="min-w-0">
        {field.type === "text" || field.type === "url" || field.type === "number" ? (
          <input
            id={field.key}
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={base}
          />
        ) : (
          <textarea
            id={field.key}
            rows={rowsForType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${base} resize-y font-mono text-[13px] leading-relaxed`}
          />
        )}

        {field.type === "rows" && field.columns && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            One per line, values separated by{" "}
            <code className="rounded bg-muted px-1">|</code> in this order:{" "}
            <strong>{field.columns.join(" | ")}</strong>
          </p>
        )}
        {field.type === "list" && (
          <p className="mt-1.5 text-xs text-muted-foreground">One item per line.</p>
        )}
        {field.help && (
          <p className="mt-1.5 text-xs text-muted-foreground">{field.help}</p>
        )}
        {value.trim() === "" && (
          <p className="mt-1.5 text-xs text-amber-600">
            Empty — the built-in default will be shown on the site.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const { accessToken } = useAuthStore();

  const [data, setData] = useState<AdminContent | null>(null);
  const [activePage, setActivePage] = useState("global");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.adminGetContent(accessToken));
      setDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load content");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyKeys = useMemo(() => Object.keys(drafts), [drafts]);

  const sections = useMemo(() => {
    if (!data) return [];
    const onPage = data.fields.filter((f) => f.page === activePage);
    const grouped = new Map<string, ContentField[]>();
    for (const f of onPage) {
      if (!grouped.has(f.section)) grouped.set(f.section, []);
      grouped.get(f.section)!.push(f);
    }
    return [...grouped.entries()];
  }, [data, activePage]);

  async function save() {
    if (!accessToken || dirtyKeys.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      setData(await api.adminUpdateContent(accessToken, drafts));
      setDrafts({});
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save content");
    } finally {
      setSaving(false);
    }
  }

  async function resetPage() {
    if (!accessToken || !data) return;
    const page = data.pages.find((p) => p.id === activePage);
    if (
      !confirm(
        `Reset every field on "${page?.title}" back to the original text? This cannot be undone.`,
      )
    )
      return;

    setResetting(true);
    setError(null);
    try {
      setData(await api.adminResetContentPage(accessToken, activePage));
      setDrafts({});
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset page");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
        </div>
      </div>
    );
  }

  const currentPage = data?.pages.find((p) => p.id === activePage);
  const previewHref = PAGE_PREVIEW[activePage];

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Pencil className="h-5 w-5 text-primary" /> Website Content
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Edit the text shown across the public website. Changes go live
            immediately — no redeploy. Clear a field to restore the original
            wording.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                Preview <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </a>
          )}
          <button
            onClick={save}
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
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedAt && dirtyKeys.length === 0 && !error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          <Check className="h-4 w-4 shrink-0" /> Content saved and live on the site.
        </div>
      )}

      {/* Page tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {data?.pages.map((p) => {
          const dirtyOnPage = data.fields.some(
            (f) => f.page === p.id && f.key in drafts,
          );
          return (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                activePage === p.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.title}
              {dirtyOnPage && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
              )}
            </button>
          );
        })}
      </div>

      {currentPage && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">{currentPage.description}</p>
          <button
            onClick={resetPage}
            disabled={resetting}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            Reset page
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sections.map(([section, fields]) => (
          <section key={section} className="overflow-hidden rounded-2xl border bg-card">
            <header className="border-b bg-muted/30 px-5 py-3">
              <h2 className="text-sm font-bold">{section}</h2>
            </header>
            <div className="divide-y">
              {fields.map((f) => (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={f.key in drafts ? drafts[f.key] : f.value}
                  dirty={f.key in drafts}
                  onChange={(v) => setDrafts((d) => ({ ...d, [f.key]: v }))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Every change is written to the audit log with the admin who made it.
        Page layout and images are part of the design system and are not edited
        here — ask a developer if you need a section added or removed.
      </p>
    </div>
  );
}
