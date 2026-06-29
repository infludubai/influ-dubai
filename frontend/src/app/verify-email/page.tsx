"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheck, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { api, ApiError } from "@/lib/api";

type Status = "pending" | "verifying" | "verified" | "error";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const pendingEmail = params.get("pending");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch(err => {
        setError(err instanceof ApiError ? err.message : "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  const resend = async () => {
    if (!pendingEmail || resending) return;
    setResending(true);
    await api.resendVerification(pendingEmail).catch(() => {});
    setResent(true);
    setResending(false);
  };

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying your email…" description="Confirming your email address, just a moment.">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Checking your verification link…</p>
        </div>
      </AuthShell>
    );
  }

  if (status === "verified") {
    return (
      <AuthShell title="Email verified!">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-4 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <div>
            <p className="font-semibold">Your email is confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">You can now log in and start using InfluDubai AI.</p>
          </div>
          <Link href="/login" className="w-full">
            <button className="w-full rounded-2xl gradient-brand py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all">
              Continue to login
            </button>
          </Link>
        </motion.div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell title="Verification failed" description="This link may have expired or already been used.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Links expire after 24 hours. Request a new one from the login page.</p>
          <Link href="/login" className="w-full">
            <button className="w-full rounded-2xl border py-3 text-sm font-medium hover:bg-muted transition-all">
              Back to login
            </button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  // pending — just registered
  return (
    <AuthShell
      title="Check your inbox"
      description={pendingEmail ? `We sent a verification link to ${pendingEmail}.` : "We sent you a verification email."}
      footer={
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← Back to login
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-2xl bg-muted/40 border px-4 py-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            In dev mode no real email is sent — open the backend terminal and copy the verification link logged there.
          </p>
        </div>

        {pendingEmail && (
          <button onClick={resend} disabled={resent || resending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium hover:bg-muted disabled:opacity-60 transition-all">
            {resending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              : resent ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resent!</>
              : <><RefreshCw className="h-4 w-4" /> Resend verification email</>}
          </button>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}
