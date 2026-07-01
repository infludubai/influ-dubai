"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.forgotPassword(values.email);
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      description="We'll email you a secure link to reset it."
      footer={
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      }
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If an account exists for that email, a reset link is on its way.
                In dev mode, check the backend console for the link.
              </p>
            </div>
            <Link href="/login"
              className="mt-2 w-full rounded-2xl gradient-brand py-3 text-center text-sm font-semibold text-white hover:opacity-90 transition-all">
              Back to login
            </Link>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="input-glow w-full rounded-2xl border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-all">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
