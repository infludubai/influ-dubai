import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { text: "AI-powered creator matching for UAE & MENA campaigns" },
  { text: "Real-time analytics — reach, engagement, ROI in one view" },
  { text: "Built-in messaging, proposals & contract management" },
  { text: "GPT-4o intelligence, fraud detection & predictions" },
];

const TESTIMONIAL = {
  quote: "InfluDubai AI cut our influencer sourcing time by 70%. The AI matching is genuinely impressive.",
  name: "Sarah Al-Mansoori",
  role: "CMO, Noon.com",
  initials: "SA",
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
      {/* ── Left — dark panel like a-mir.com hero ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-[#0a0a0a] flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">InfluDubai <span className="text-violet-400">AI</span></span>
          </div>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 my-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            UAE &amp; MENA Creator Intelligence Platform
          </div>
          <h2 className="mt-5 text-4xl font-bold text-white leading-tight">
            Connect brands with<br />
            <span className="text-violet-400">the right creators.</span>
          </h2>
          <p className="mt-4 text-white/45 leading-relaxed max-w-sm">
            AI-powered discovery, vetting and analytics for 12,000+ verified creators across the UAE and MENA.
          </p>

          <div className="mt-8 space-y-3.5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-violet-400" />
                <p className="text-sm text-white/65">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-10 rounded-2xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/65 italic leading-relaxed">"{TESTIMONIAL.quote}"</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/40 border border-violet-500/30 text-xs font-bold text-white">
                {TESTIMONIAL.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{TESTIMONIAL.name}</p>
                <p className="text-xs text-white/45">{TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/25">© 2025 InfluDubai AI. All rights reserved.</p>
      </div>

      {/* ── Right — form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">InfluDubai <span className="gradient-text">AI</span></span>
        </Link>

        <div className="w-full max-w-[400px] animate-scale-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
          </div>

          {children}

          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
