"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles, Building2, Briefcase } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { api, ApiError } from "@/lib/api";

const ROLES = [
  { value: "CREATOR", label: "Creator", desc: "I create content & collaborate with brands", icon: Sparkles, color: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-50" },
  { value: "BRAND",   label: "Brand",   desc: "I want to run influencer campaigns", icon: Building2, color: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-50" },
  { value: "AGENCY",  label: "Agency",  desc: "I manage campaigns for multiple brands", icon: Briefcase, color: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50" },
] as const;

const schema = z.object({
  displayName: z.string().min(2, "Tell us your name or brand."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(["CREATOR", "BRAND", "AGENCY"], { message: "Select an account type." }),
});
type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const defaultRole = ROLES.some((r) => r.value === requestedRole) ? (requestedRole as FormValues["role"]) : undefined;
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });
  const selectedRole = watch("role");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.register(values);
      router.push(`/verify-email?pending=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Join 12,000+ creators and 850+ brands on InfluDubai AI."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">I am a…</label>
          <Controller
            name="role"
            control={control}
            render={() => (
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, desc, icon: Icon, color }) => {
                  const active = selectedRole === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("role", value, { shouldValidate: true })}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                        active
                          ? `${color} ring-2 ring-primary/30 shadow-sm`
                          : "border-border bg-background hover:border-border/60 hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-semibold ${active ? "" : "text-muted-foreground"}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {selectedRole && (
            <p className="text-xs text-muted-foreground animate-fade-in">
              {ROLES.find(r => r.value === selectedRole)?.desc}
            </p>
          )}
          {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="displayName">Name / Brand name</label>
          <input
            id="displayName"
            autoComplete="name"
            placeholder={selectedRole === "BRAND" ? "Noon, Talabat, ADNOC…" : selectedRole === "AGENCY" ? "Agency name" : "Your creator name"}
            className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-all input-glow placeholder:text-muted-foreground ${errors.displayName ? "border-destructive" : "border-border"}`}
            {...register("displayName")}
          />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-all input-glow placeholder:text-muted-foreground ${errors.email ? "border-destructive" : "border-border"}`}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={`w-full rounded-xl border bg-background px-4 py-2.5 pr-11 text-sm outline-none transition-all input-glow placeholder:text-muted-foreground ${errors.password ? "border-destructive" : "border-border"}`}
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="#" className="underline hover:text-foreground">Terms of Service</Link> &amp;{" "}
          <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
