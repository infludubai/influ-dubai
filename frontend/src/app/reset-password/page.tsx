"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { api, ApiError } from "@/lib/api";

const schema = z.object({
  newPassword: z.string().min(8, "Use at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) { setServerError("Missing or invalid reset token."); return; }
    setServerError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(token, values.newPassword);
      router.push("/login?reset=1");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      description="Choose a strong password for your account."
      footer={
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      }
    >
      {!token ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          This link is invalid or expired.{" "}
          <Link href="/forgot-password" className="font-semibold underline">Request a new one.</Link>
        </motion.div>
      ) : (
        <motion.form onSubmit={handleSubmit(onSubmit)} className="space-y-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                {...register("newPassword")}
                className="input-glow w-full rounded-2xl border bg-background py-3 pl-10 pr-12 text-sm outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{serverError}</div>
          )}

          <button type="submit" disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : "Reset password"}
          </button>
        </motion.form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
