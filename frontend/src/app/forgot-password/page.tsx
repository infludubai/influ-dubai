"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.forgotPassword(values.email);
    } finally {
      // Always show the same confirmation, regardless of whether the
      // email is registered — avoids leaking account existence.
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      description="We'll email you a link to reset it."
      footer={
        <Link href="/login" className="font-medium text-foreground underline">
          Back to log in
        </Link>
      }
    >
      {submitted ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way.
          Check the backend console (dev mode) for the link.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
