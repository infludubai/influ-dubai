"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  Loader2, Save, RotateCcw, Check, ExternalLink, DollarSign, Star,
} from "lucide-react";

/**
 * A structured editor over the same pricing.* content keys the raw Website
 * Content page exposes — one card per plan instead of a wall of fields.
 * Saving writes through the identical API, so the two editors can never
 * disagree about what the site shows.
 */

const PLANS = [
  { slug: "free", title: "Free" },
  { slug: "professional", title: "Professional" },
  { slug: "enterprise", title: "Enterprise" },
] as const;

const PLAN_KEYS = ["name", "tagline", "price", "features"] as const;

const PAGE_KEYS = [
  { key: "pricing.title", label: "Page title" },
  { key: "pricing.subtitle", label: "Page subtitle" },
  { key: "pricing.currency", label: "Currency", short: true },
  { key: "pricing.period", label: "Billing period", short: true },
  { key: "pricing.footnote", label: "Footnote" },
];

export default function AdminPricingPage() {
  const { accessToken } = useAuthStore();
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await api.adminGetContent(accessToken);
      const v: Record<string, string> = {};
      const d: Record<string, string> = {};
      for (const f of data.fields) {
        if (!f.key.startsWith("pricing.")) continue;
        v[f.key] = f.value;
        d[f.key] = f.defaultValue;
      }
      setValues(v);
      setInitial(v);
      setDefaults(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pricing.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [accessToken]);

  const dirty = useMemo(
    () => Object.keys(values).filter((k) => values[k] !== initial[k]),
    [values, initial],
  );

  const set = (key: string, v: string) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  async function save() {
    if (!accessToken || dirty.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {};
      for (const k of dirty) payload[k] = values[k];
      await api.adminUpdateContent(accessToken, payload);
      setInitial(values);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
    setSaving(false);
  }

  async function reset() {
    if (!accessToken || !confirm("Reset ALL pricing content to the shipped defaults?")) return;
    setSaving(true);
    try {
      await api.adminResetContentPage(accessToken, "pricing");
      await load();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    }
    setSaving(false);
  }

  const val = (key: string) => values[key] || defaults[key] || "";
  const input =
    "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/15 border-border";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading pricing…
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="h-5 w-5 text-primary" /> Pricing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            What each plan costs and includes. Changes go live on the pricing
            page and in checkout the moment you save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={reset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset all
          </button>
          <button
            onClick={save}
            disabled={saving || dirty.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved && dirty.length === 0 ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : saved && dirty.length === 0 ? "Saved" : `Save${dirty.length ? ` (${dirty.length})` : ""}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Page-level settings */}
      <div className="mb-6 rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Page settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAGE_KEYS.map(({ key, label, short }) => (
            <div key={key} className={short ? "" : "sm:col-span-2"}>
              <label className="mb-1.5 block text-sm font-medium">{label}</label>
              <input
                value={val(key)}
                onChange={(e) => set(key, e.target.value)}
                className={input}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map(({ slug, title }) => {
          const highlighted = val("pricing.highlight") === slug;
          return (
            <div
              key={slug}
              className={`rounded-2xl border bg-card p-5 ${highlighted ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {title} plan
                </h2>
                <button
                  onClick={() => set("pricing.highlight", slug)}
                  title="Mark as the recommended plan"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    highlighted
                      ? "bg-primary/15 text-primary"
                      : "border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Star className={`h-3 w-3 ${highlighted ? "fill-current" : ""}`} />
                  {highlighted ? "Recommended" : "Recommend"}
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name</label>
                  <input value={val(`pricing.${slug}.name`)} onChange={(e) => set(`pricing.${slug}.name`, e.target.value)} className={input} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tagline</label>
                  <input value={val(`pricing.${slug}.tagline`)} onChange={(e) => set(`pricing.${slug}.tagline`, e.target.value)} className={input} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Price <span className="font-normal text-muted-foreground">({val("pricing.currency") || "AED"}{val("pricing.period") || "/month"})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={val(`pricing.${slug}.price`)}
                    onChange={(e) => set(`pricing.${slug}.price`, e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Features <span className="font-normal text-muted-foreground">(one per line)</span>
                  </label>
                  <textarea
                    rows={7}
                    value={val(`pricing.${slug}.features`)}
                    onChange={(e) => set(`pricing.${slug}.features`, e.target.value)}
                    className={`${input} resize-y font-mono text-[13px] leading-relaxed`}
                  />
                </div>
              </div>

              {/* Mini preview of how the card reads */}
              <div className="mt-4 rounded-xl border border-dashed p-3.5 text-center">
                <p className="text-sm font-bold">{val(`pricing.${slug}.name`) || title}</p>
                <p className="mt-0.5 text-2xl font-extrabold">
                  {val(`pricing.${slug}.price`) || "0"}
                  <span className="text-xs font-medium text-muted-foreground"> {val("pricing.currency") || "AED"}{val("pricing.period") || "/month"}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {(val(`pricing.${slug}.features`) || "").split("\n").filter(Boolean).length} features listed
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
