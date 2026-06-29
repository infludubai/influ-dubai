"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Sparkles, MapPin, Globe, Tag, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";

const CATEGORIES = ["Beauty", "Fashion", "Fitness", "Food", "Tech", "Travel", "Family", "Finance", "Lifestyle", "Education", "Entertainment", "Sports"];
const LANGUAGES  = ["English", "Arabic", "French", "Hindi", "Urdu", "Filipino", "Russian"];
const COUNTRIES  = ["United Arab Emirates", "Saudi Arabia", "Egypt", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan"];

interface FormValues { bio: string; country: string; city: string; }

const STEPS = [
  { id: "location", label: "Location" },
  { id: "interests", label: "Interests" },
  { id: "done", label: "Done" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { bio: "", country: COUNTRIES[0], city: "" },
  });

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  const onSubmit = async (values: FormValues) => {
    if (!accessToken) return;
    setServerError(null);
    setSubmitting(true);
    try {
      await api.updateProfile(accessToken, { ...values, languages, categories });
      setStep(2);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (!accessToken) return null;

  const role = user?.role ?? "CREATOR";
  const roleColor = role === "CREATOR" ? "from-violet-500 to-purple-600" : role === "BRAND" ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-teal-600";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-lg font-bold">InfluDubai <span className="gradient-text">AI</span></span>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip for now →
        </Link>
      </header>

      <div className="mx-auto max-w-lg px-6 py-12">
        {/* Step indicator */}
        <div className="mb-10 flex items-center justify-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i < step ? `bg-gradient-to-br ${roleColor} text-white` :
                i === step ? "border-2 border-primary text-primary" :
                "border border-muted-foreground/30 text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0 — Location + Bio */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8 text-center">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColor}`}>
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Welcome, {user?.displayName ?? "there"}!</h1>
                <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about yourself — it only takes a minute.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Short bio</label>
                  <textarea {...register("bio")} rows={3}
                    placeholder={role === "CREATOR" ? "Dubai-based lifestyle creator passionate about beauty and travel…" : "We're a UAE brand looking for authentic creators to partner with…"}
                    className="input-glow w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Country</label>
                    <select {...register("country")}
                      className="w-full rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">City</label>
                    <input {...register("city")} placeholder="Dubai"
                      className="input-glow w-full rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button onClick={() => setStep(1)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${roleColor} py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all`}>
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Languages + Categories */}
          {step === 1 && (
            <motion.form key="step1" onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8 text-center">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColor}`}>
                  <Tag className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Your interests</h2>
                <p className="mt-1 text-sm text-muted-foreground">Help us match you with the right opportunities.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button key={lang} type="button" onClick={() => toggle(languages, setLanguages, lang)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          languages.includes(lang)
                            ? `border-transparent bg-gradient-to-r ${roleColor} text-white shadow-sm`
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" /> {role === "CREATOR" ? "Content niches" : "Industry categories"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => toggle(categories, setCategories, cat)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          categories.includes(cat)
                            ? `border-transparent bg-gradient-to-r ${roleColor} text-white shadow-sm`
                            : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {serverError && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{serverError}</div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)}
                    className="flex-1 rounded-2xl border py-3 text-sm font-medium hover:bg-muted transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={submitting}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${roleColor} py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all`}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Finish setup <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {/* Step 2 — Success */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${roleColor} shadow-xl`}>
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold">You're all set!</h2>
              <p className="mt-2 text-muted-foreground">Taking you to your dashboard…</p>
              <div className="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <motion.div className={`h-1.5 rounded-full bg-gradient-to-r ${roleColor}`}
                  initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
