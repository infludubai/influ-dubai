"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Globe, MapPin, Tag, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const INDUSTRIES = [
  "Fashion & Apparel", "Food & Beverage", "Technology", "Travel & Tourism",
  "Health & Wellness", "Beauty & Cosmetics", "Real Estate", "Automotive",
  "Finance", "Education", "Entertainment", "Retail", "Other",
];

const COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Egypt", "Qatar",
  "Kuwait", "Bahrain", "Oman", "Jordan", "Lebanon", "Morocco",
];

export default function BrandProfilePage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.role !== "BRAND" && user?.role !== "AGENCY") { router.replace("/dashboard"); return; }
    api.getMyBrandProfile(accessToken).then(p => {
      if (p) {
        setCompanyName(p.companyName);
        setIndustry(p.industry ?? "");
        setWebsite(p.website ?? "");
        setDescription(p.description ?? "");
        setCountry(p.country ?? "");
      }
    }).catch(() => {});
  }, [accessToken]);

  async function save() {
    if (!companyName.trim()) { setError("Company name is required."); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.upsertBrandProfile(accessToken!, {
        companyName,
        industry: industry || undefined,
        website: website || undefined,
        description: description || undefined,
        country: country || undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); router.push("/dashboard/brand"); }, 1500);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  const role = user?.role ?? "BRAND";

  return (
    <DashboardShell title={role === "AGENCY" ? "Agency Profile" : "Brand Profile"}>
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{role === "AGENCY" ? "Agency" : "Brand"} Profile</h1>
              <p className="text-sm text-muted-foreground">Shown to creators when they view your campaigns</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-3 text-sm text-destructive">
            {error}
          </motion.div>
        )}
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Profile saved — redirecting to dashboard…
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="rounded-2xl border bg-card p-6 space-y-5">

          {/* Company name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Company name <span className="text-destructive">*</span>
            </label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Noon Fashion"
              className="input-glow w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Industry
            </label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Select industry…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Website */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
              </label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="input-glow w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Country */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Country
              </label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Select country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">About your {role === "AGENCY" ? "agency" : "brand"}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Tell creators what your brand stands for, the kind of content you love, and what makes a great collaboration partner…"
              rows={5}
              className="input-glow w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="mt-4">
          <button onClick={save} disabled={saving || saved}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</>
              : <><Save className="h-4 w-4" /> Save profile</>}
          </button>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
