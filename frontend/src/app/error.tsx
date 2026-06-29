"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero-mesh px-6 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
      </Link>

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5">
        <span className="text-3xl">⚡</span>
      </div>

      <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        An unexpected error occurred. This has been noted and our team will look into it.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-2xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/">
          <button className="flex items-center gap-2 rounded-2xl border bg-card px-6 py-3 text-sm font-medium hover:bg-muted transition-all">
            <ArrowLeft className="h-4 w-4" /> Go home
          </button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground/50 font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
