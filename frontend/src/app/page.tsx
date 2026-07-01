"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Users,
  Sparkles, Zap, CheckCircle2, Star, MessageSquare, Globe, ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ─── data ─── */
const STATS = [
  { value: "12,000+",  label: "Verified Creators" },
  { value: "850+",     label: "Active Brands" },
  { value: "3,200+",   label: "Campaigns" },
  { value: "AED 40M+", label: "Creator Earnings" },
];

const FEATURES = [
  { icon: Search,        bg: "#f5f3ff", fg: "#7c3aed", title: "Creator Discovery",      body: "Search 12,000+ verified UAE & MENA creators by niche, location, followers, and engagement." },
  { icon: Users,         bg: "#eff6ff", fg: "#2563eb", title: "AI Matching Engine",      body: "GPT-4o powered matching recommends the best creators for every campaign brief automatically." },
  { icon: ShieldCheck,   bg: "#f0fdf4", fg: "#16a34a", title: "Fraud Detection",         body: "Flag fake followers, bot engagement, and suspicious growth patterns before you spend." },
  { icon: BarChart3,     bg: "#fff7ed", fg: "#ea580c", title: "Campaign Analytics",      body: "Real-time dashboards: reach, engagement, conversions, ROI — all in one view." },
  { icon: MessageSquare, bg: "#fdf4ff", fg: "#a21caf", title: "Built-in Collaboration",  body: "Proposals, contracts, messaging and deliverable tracking all inside the platform." },
  { icon: Globe,         bg: "#f0fdfa", fg: "#0f766e", title: "MENA-First Platform",     body: "Built for UAE, KSA, Egypt and MENA. Arabic-ready with local market intelligence." },
];

const STEPS = [
  { n: "01", title: "Create your profile",       body: "Brands set campaign goals. Creators add niche, rates and link social accounts in minutes." },
  { n: "02", title: "AI finds the right match",  body: "Our engine scores and ranks creators against your brief using 20+ audience signals." },
  { n: "03", title: "Collaborate and launch",    body: "Proposals, live tracking, payments — all handled inside the platform from day one." },
];

const TESTIMONIALS = [
  { q: "InfluDubai AI cut our influencer sourcing time by 70%. The fraud detection alone saved us from a costly mistake.", name: "Sarah Al-Mansoori", role: "CMO, Noon.com",         init: "SA" },
  { q: "We found three incredible UAE lifestyle creators in 20 minutes. The AI matching is genuinely impressive.",        name: "Ahmed Khalil",       role: "Marketing Dir., Careem", init: "AK" },
  { q: "The analytics dashboard helped me understand my audience and confidently raise my rates by 40%.",                 name: "Layla Hassan",       role: "Fashion Creator, Dubai", init: "LH" },
];

const BRANDS = ["Noon", "Emirates", "Majid Al Futtaim", "Talabat", "Careem", "ADNOC", "Emaar", "Etisalat"];

/* ─── reveal wrapper — valid hook usage ─── */
function Reveal({ children, delay = 0, className = "", style: extraStyle }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

/* ─── feature card ─── */
function FeatureCard({ f, delay }: { f: typeof FEATURES[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <div
      ref={ref}
      style={{
        background: "#fff",
        border: "1px solid #e4e4e7",
        borderRadius: 20,
        padding: 32,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "default",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s, box-shadow 0.2s, border-color 0.2s`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(124,58,237,0.12)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#e4e4e7";
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <f.icon size={20} color={f.fg} strokeWidth={1.8} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#09090b", marginBottom: 8 }}>{f.title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "#71717a" }}>{f.body}</p>
    </div>
  );
}

/* ─── testimonial card ─── */
function TestiCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <div ref={ref} style={{
      background: "#fff", border: "1px solid #f4f4f5", borderRadius: 20, padding: 32,
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
    }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} style={{ fill: "#f59e0b", color: "#f59e0b" }} />)}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "#52525b" }}>"{t.q}"</p>
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.init}</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#09090b" }}>{t.name}</p>
          <p style={{ fontSize: 12, color: "#a1a1aa" }}>{t.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── step card ─── */
function StepCard({ s, delay }: { s: typeof STEPS[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <div ref={ref} style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 32,
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
    }}>
      <p style={{ fontSize: 72, fontWeight: 900, color: "rgba(139,92,246,0.15)", lineHeight: 1, marginBottom: 16 }}>{s.n}</p>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 10 }}>{s.title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>{s.body}</p>
    </div>
  );
}

/* ─── main page ─── */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflowX: "hidden", minHeight: "100vh" }}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 24px",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #f4f4f5" : "none",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: scrolled ? "#09090b" : "#fff", letterSpacing: "-0.02em" }}>
              InfluDubai <span style={{ color: scrolled ? "#7c3aed" : "#a78bfa" }}>AI</span>
            </span>
          </Link>

          <nav style={{ display: "flex", gap: 4 }}>
            {[{ href: "/marketplace", l: "Marketplace" }, { href: "/pricing", l: "Pricing" }].map(({ href, l }) => (
              <Link key={href} href={href} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: scrolled ? "#71717a" : "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.15s" }}>{l}</Link>
            ))}
          </nav>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ThemeToggle variant={scrolled ? "default" : "ghost-white"} />
            <Link href="/login" style={{ padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, color: scrolled ? "#71717a" : "rgba(255,255,255,0.8)", textDecoration: "none" }}>Sign in</Link>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}>Get started free</button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ background: "#08060f", minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.28) 0%,transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: 0, right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.18) 0%,transparent 70%)", filter: "blur(60px)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.035 }}>
            <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0L0 0 0 60" fill="none" stroke="#fff" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "128px 24px 80px", textAlign: "center", width: "100%" }}>
          {/* badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 32 }}>
            <Zap size={14} color="#a78bfa" strokeWidth={2} />
            UAE &amp; MENA Creator Intelligence Platform
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", marginLeft: 4 }} />
          </div>

          {/* headline — no animation on opacity so always visible */}
          <h1 style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-0.03em", marginBottom: 24, textWrap: "balance" } as React.CSSProperties}>
            Discover. Match.{" "}
            <span style={{ background: "linear-gradient(135deg,#8b5cf6,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Run campaigns that perform.
            </span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.52)", maxWidth: 560, margin: "0 auto 40px" }}>
            AI-powered creator discovery, fraud detection and live analytics for brands and agencies across the UAE and MENA.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register?role=BRAND" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.45)" }}>
                Start as a Brand <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/marketplace" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
                Browse Creators
              </button>
            </Link>
          </div>

          {/* stats */}
          <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 48 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{s.value}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BRANDS ═══════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #f4f4f5", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 28 }}>Trusted by leading brands across UAE &amp; MENA</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px 40px" }}>
            {BRANDS.map(b => <span key={b} style={{ fontSize: 14, fontWeight: 700, color: "#d4d4d8", letterSpacing: "0.02em" }}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal className="text-center" style={{ marginBottom: 56 } as React.CSSProperties}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 12 }}>Platform capabilities</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#09090b", letterSpacing: "-0.03em", marginBottom: 16 }}>
              Everything to run<br />creator campaigns
            </h2>
            <p style={{ fontSize: 17, color: "#71717a", maxWidth: 480, margin: "0 auto" }}>From discovery to payment — one unified platform built for MENA.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} delay={i * 0.07} />)}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ background: "#08060f", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal className="text-center" style={{ marginBottom: 56 } as React.CSSProperties}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: 12 }}>Simple by design</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>From brief to results in 3 steps</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {STEPS.map((s, i) => <StepCard key={s.n} s={s} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section style={{ background: "#fafafa", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal className="text-center" style={{ marginBottom: 56 } as React.CSSProperties}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 12 }}>Social proof</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#09090b", letterSpacing: "-0.03em" }}>Loved by brands and creators alike</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => <TestiCard key={t.name} t={t} delay={i * 0.09} />)}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#2563eb 100%)", padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-40%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.07)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "-40%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(60px)" }} />
        </div>
        <Reveal className="relative z-10 text-center" style={{ maxWidth: 600, margin: "0 auto" } as React.CSSProperties}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Ready to grow?</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16, textWrap: "balance" } as React.CSSProperties}>
            Join 12,000+ creators and 850+ brands running smarter campaigns.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", marginBottom: 40 }}>Start free. No credit card required.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#7c3aed", border: "none", borderRadius: 999, padding: "14px 40px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
                Get started free <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/marketplace" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "14px 40px", fontSize: 15, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
                Browse creators
              </button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ background: "#fff", borderTop: "1px solid #f4f4f5", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={14} color="#fff" strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#09090b" }}>InfluDubai <span style={{ color: "#7c3aed" }}>AI</span></span>
            </Link>
            <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.65, maxWidth: 220 }}>Creator intelligence for the UAE &amp; MENA region.</p>
            <p style={{ fontSize: 12, color: "#d4d4d8", marginTop: 20 }}>© 2025 InfluDubai AI. All rights reserved.</p>
          </div>
          {[
            { h: "Platform", links: [["Marketplace","/marketplace"],["For Creators","/register?role=CREATOR"],["For Brands","/register?role=BRAND"],["Pricing","/pricing"]] },
            { h: "Company",  links: [["About","#"],["Blog","#"],["Careers","#"],["Contact","#"]] },
            { h: "Legal",    links: [["Privacy","#"],["Terms","#"],["Cookies","#"]] },
          ].map(col => (
            <div key={col.h}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 16 }}>{col.h}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map(([l, h]) => (
                  <Link key={l} href={h} style={{ fontSize: 14, color: "#71717a", textDecoration: "none" }}>{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
