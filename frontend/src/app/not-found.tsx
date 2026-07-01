import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
      </Link>

      <div className="relative mb-6">
        <p className="text-[120px] font-black leading-none tracking-tighter text-muted/20 select-none">404</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-6xl font-black gradient-text">404</p>
        </div>
      </div>

      <h1 className="mb-3 text-2xl font-bold">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        This page doesn&apos;t exist or has been moved. Head back to the dashboard or explore the creator marketplace.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <button className="flex items-center gap-2 rounded-2xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
        </Link>
        <Link href="/marketplace">
          <button className="rounded-2xl border bg-card px-6 py-3 text-sm font-medium hover:bg-muted transition-all">
            Browse marketplace
          </button>
        </Link>
      </div>
    </div>
  );
}
