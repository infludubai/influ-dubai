import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { text: "AI-powered creator matching for UAE & MENA campaigns" },
  { text: "Real-time analytics — reach, engagement, ROI in one dashboard" },
  { text: "Built-in messaging, proposals & contract management" },
  { text: "GPT-4o creator intelligence, fraud detection & predictions" },
];

const TESTIMONIAL = {
  quote: "InfluDubai AI cut our influencer sourcing time by 70%. The AI matching is genuinely impressive.",
  name: "Sarah Al-Mansoori",
  role: "CMO, Noon.com",
  initials: "SM",
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] bg-auth-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-white/3 blur-3xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">InfluDubai AI</span>
          </div>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 my-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            UAE & MENA Creator Intelligence Platform
          </div>
          <h2 className="mt-4 text-4xl font-bold text-white leading-tight">
            Connect brands with<br />
            <span className="text-white/70">the right creators.</span>
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed max-w-sm">
            AI-powered discovery, vetting and analytics for 12,000+ verified creators across the UAE and MENA.
          </p>

          {/* Features list */}
          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm text-white/80">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
            <p className="text-sm text-white/80 italic leading-relaxed">"{TESTIMONIAL.quote}"</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {TESTIMONIAL.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{TESTIMONIAL.name}</p>
                <p className="text-xs text-white/60">{TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/40">© 2025 InfluDubai AI. All rights reserved.</p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold">InfluDubai <span className="gradient-text">AI</span></span>
        </Link>

        <div className="w-full max-w-[400px] animate-scale-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
          </div>

          {/* Form content */}
          {children}

          {/* Footer link */}
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
