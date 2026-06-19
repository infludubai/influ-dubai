"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

type Status = "pending" | "verifying" | "verified" | "error";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const pendingEmail = params.get("pending");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  const resend = async () => {
    if (!pendingEmail) return;
    await api.resendVerification(pendingEmail);
    setResent(true);
  };

  if (status === "verified") {
    return (
      <AuthShell title="Email verified">
        <p className="text-sm text-muted-foreground">
          Your email is verified. You can now log in.
        </p>
        <Link href="/login">
          <Button className="w-full">Continue to log in</Button>
        </Link>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell title="Verification failed">
        <p className="text-sm text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">
          Links expire after 24 hours. Request a new one from the login page.
        </p>
      </AuthShell>
    );
  }

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying…">
        <p className="text-sm text-muted-foreground">Confirming your email address.</p>
      </AuthShell>
    );
  }

  // status === "pending" — just registered, waiting for the user to click the link.
  return (
    <AuthShell
      title="Check your inbox"
      description={pendingEmail ? `We sent a verification link to ${pendingEmail}.` : undefined}
      footer={
        <Link href="/login" className="font-medium text-foreground underline">
          Back to log in
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        In dev mode, no real email is sent — open the backend terminal and
        click/copy the verification link logged there.
      </p>
      {pendingEmail && (
        <Button variant="outline" className="w-full" onClick={resend} disabled={resent}>
          {resent ? "Verification email resent" : "Resend verification email"}
        </Button>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
