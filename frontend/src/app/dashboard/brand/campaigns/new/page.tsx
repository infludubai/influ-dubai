"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const CAMPAIGN_TYPES = [
  { value: "AWARENESS",       label: "Awareness",    desc: "Grow brand recognition and reach new audiences." },
  { value: "ENGAGEMENT",      label: "Engagement",   desc: "Drive likes, comments, shares and interaction." },
  { value: "LEAD_GENERATION", label: "Lead Gen",     desc: "Capture potential customer contact info." },
  { value: "SALES",           label: "Sales",        desc: "Drive direct purchases or conversions." },
] as const;

const LOCATIONS = ["UAE", "Saudi Arabia", "Egypt", "Kuwait", "Qatar", "Bahrain", "Oman", "Jordan", "Lebanon", "Morocco"];
const CATEGORIES = ["Fashion", "Beauty", "Tech", "Travel", "Food", "Fitness", "Gaming", "Finance", "Education", "Lifestyle", "Business", "Entertainment"];

const STEPS = ["Campaign Type", "Details", "Targeting", "Review"];

export default function NewCampaignPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [type, setType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "BRAND" && user?.role !== "AGENCY") { router.replace("/dashboard"); }
  }, [accessToken]);

  function toggleItem(list: string[], set: (v: string[]) => void, item: string) {
    set(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  function canNext() {
    if (step === 0) return !!type;
    if (step === 1) return !!title && !!budget && Number(budget) > 0;
    return true;
  }

  async function submit() {
    setSaving(true); setError("");
    try {
      const campaign = await api.createCampaign(accessToken!, {
        type: type as any,
        title,
        description: description || undefined,
        budgetUsd: Number(budget),
        deadline: deadline || undefined,
        requirements: requirements || undefined,
        targetAudience: targetAudience || undefined,
        targetLocations: locations,
        targetCategories: categories,
      });
      router.push(`/dashboard/brand/campaigns/${campaign.id}`);
    } catch (e: any) { setError(e.message); setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/" className="text-lg font-bold">InfluDubai <span className="gradient-text">AI</span></Link>
        <Link href="/dashboard/brand"><button className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</button></Link>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-6 text-2xl font-bold">Create Campaign</h1>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < step ? "gradient-brand text-white" : i === step ? "border-2 border-primary text-primary" : "border border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >

            {/* Step 0 — Campaign type */}
            {step === 0 && (
              <div className="space-y-3">
                <h2 className="mb-4 text-lg font-semibold">What is your campaign goal?</h2>
                {CAMPAIGN_TYPES.map(t => (
                  <button key={t.value} onClick={() => setType(t.value)}
                    className={`w-full rounded-2xl border p-5 text-left transition-all ${
                      type === t.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full border-2 ${type === t.value ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <div>
                        <div className="font-semibold">{t.label}</div>
                        <div className="text-sm text-muted-foreground">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1 — Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="mb-4 text-lg font-semibold">Campaign details</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Campaign title <span className="text-destructive">*</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Ramadan Fashion Collection 2025"
                    className="input-glow w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="What is this campaign about? What content do you expect creators to produce?"
                    rows={4}
                    className="input-glow w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Budget (USD) <span className="text-destructive">*</span></label>
                    <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                      placeholder="5000"
                      className="input-glow w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Deadline</label>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                      className="input-glow w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Creator requirements</label>
                  <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
                    placeholder="Minimum followers, content style, language preferences..."
                    rows={3}
                    className="input-glow w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Targeting */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="mb-4 text-lg font-semibold">Target audience & creators</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Target audience description</label>
                  <textarea value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                    placeholder="Describe who you want to reach: age range, interests, demographics..."
                    rows={3}
                    className="input-glow w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Target locations</label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATIONS.map(l => (
                      <button key={l} type="button" onClick={() => toggleItem(locations, setLocations, l)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          locations.includes(l)
                            ? "border-transparent gradient-brand text-white shadow-sm"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Creator niches / categories</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => toggleItem(categories, setCategories, c)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          categories.includes(c)
                            ? "border-transparent gradient-brand text-white shadow-sm"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="mb-4 text-lg font-semibold">Review your campaign</h2>
                <div className="rounded-2xl border bg-card p-6 space-y-3">
                  <Row label="Campaign type" value={CAMPAIGN_TYPES.find(t => t.value === type)?.label ?? ""} />
                  <Row label="Title" value={title} />
                  {description && <Row label="Description" value={description} />}
                  <Row label="Budget" value={`$${Number(budget).toLocaleString()} USD`} />
                  {deadline && <Row label="Deadline" value={new Date(deadline).toLocaleDateString()} />}
                  {locations.length > 0 && <Row label="Locations" value={locations.join(", ")} />}
                  {categories.length > 0 && <Row label="Creator niches" value={categories.join(", ")} />}
                  {requirements && <Row label="Requirements" value={requirements} />}
                </div>
                <p className="text-sm text-muted-foreground">Campaign will be saved as a <strong>Draft</strong>. Activate it after review.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 rounded-xl border px-5 py-2.5 font-medium hover:bg-muted">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="gradient-brand ml-auto flex items-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              className="gradient-brand ml-auto rounded-xl px-8 py-2.5 font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
              {saving ? "Creating..." : "Create Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-xs">{value}</span>
    </div>
  );
}
