"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Users,
  Sparkles, Zap, CheckCircle2, Star, MessageSquare, Globe, ChevronRight, Mail,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function WhatsAppIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.48 14.8L2 22l5.34-1.52A9.95 9.95 0 1 0 12.04 2Zm0 17.9a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.17.9.92-3.08-.2-.32a8.03 8.03 0 1 1 6.88 3.81Zm4.42-6.02c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.27 7.27 0 0 1-1.34-1.67c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

/* ─── content helpers ─────────────────────────────────────────────────────
   All copy comes from Admin → Content. Icons and colours stay in code and
   cycle by position, so an admin can add or remove a card without needing to
   pick an icon or break the palette. */

const FEATURE_STYLES = [
  { icon: Search,        bg: "#f5f3ff", fg: "#7c3aed" },
  { icon: Users,         bg: "#eff6ff", fg: "#2563eb" },
  { icon: ShieldCheck,   bg: "#f0fdf4", fg: "#16a34a" },
  { icon: BarChart3,     bg: "#fff7ed", fg: "#ea580c" },
  { icon: MessageSquare, bg: "#fdf4ff", fg: "#a21caf" },
  { icon: Globe,         bg: "#f0fdfa", fg: "#0f766e" },
];

function splitList(value: string | undefined): string[] {
  return (value ?? "").split("\n").map(l => l.trim()).filter(Boolean);
}

function splitRows(value: string | undefined, columns: number): string[][] {
  return splitList(value)
    .map(line => line.split("|").map(c => c.trim()))
    .filter(cells => cells.length === columns);
}

function initialsOf(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

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
type Feature = { icon: React.ElementType; bg: string; fg: string; title: string; body: string };
function FeatureCard({ f, delay }: { f: Feature; delay: number }) {
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
type Testimonial = { q: string; name: string; role: string; init: string };
function TestiCard({ t, delay }: { t: Testimonial; delay: number }) {
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
type Step = { n: string; title: string; body: string };
function StepCard({ s, delay }: { s: Step; delay: number }) {
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
export function HomeClient({ content }: { content: Record<string, string> }) {
  const c = (k: string, fallback = "") => content[k] ?? fallback;

  const STATS = splitRows(c("home.stats"), 2).map(([value, label]) => ({ value, label }));
  const FEATURES: Feature[] = splitRows(c("home.features"), 2).map(([title, body], i) => ({
    ...FEATURE_STYLES[i % FEATURE_STYLES.length], title, body,
  }));
  const STEPS: Step[] = splitRows(c("home.steps"), 2).map(([title, body], i) => ({
    n: String(i + 1).padStart(2, "0"), title, body,
  }));
  const TESTIMONIALS: Testimonial[] = splitRows(c("home.testimonials"), 3).map(([q, name, role]) => ({
    q, name, role, init: initialsOf(name),
  }));
  const BRANDS = splitList(c("home.brands"));

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflowX: "hidden", minHeight: "100vh" }}>
      <style jsx>{`
        @media (max-width: 900px) {
          .home-nav,
          .header-sign-in,
          .header-register {
            display: none !important;
          }
        }
        @media (max-width: 520px) {
          .home-header {
            padding: 0 14px !important;
          }
          .header-theme-toggle {
            display: none;
          }
          .header-contact {
            padding: 7px 10px !important;
            font-size: 12px !important;
          }
          .header-wordmark {
            display: none;
          }
        }
      `}</style>

      {/* ═══════════ NAVBAR ═══════════ */}
      <header className="home-header" style={{
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
            {c("global.logoUrl") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c("global.logoUrl")} alt={c("global.brandName")} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
            ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" strokeWidth={1.8} />
            </div>
            )}
            <span className="header-wordmark" style={{ fontSize: 15, fontWeight: 700, color: scrolled ? "#09090b" : "#fff", letterSpacing: "-0.02em" }}>
              {c("global.brandName")}
            </span>
          </Link>

          <nav className="home-nav" style={{ display: "flex", gap: 4 }}>
            {[{ href: "/for-brands", l: "For Brands" }, { href: "/for-creators", l: "For Creators" }, { href: "/marketplace", l: "Marketplace" }, { href: "/pricing", l: "Pricing" }].map(({ href, l }) => (
              <Link key={href} href={href} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: scrolled ? "#71717a" : "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.15s" }}>{l}</Link>
            ))}
          </nav>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              className="header-contact"
              href={c("global.whatsappUrl")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with us on WhatsApp at ${c("global.phone")}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px",
                borderRadius: 999, background: scrolled ? "#ecfdf5" : "rgba(37,211,102,0.14)",
                border: scrolled ? "1px solid #bbf7d0" : "1px solid rgba(74,222,128,0.32)",
                color: scrolled ? "#15803d" : "#86efac", fontSize: 13, fontWeight: 650,
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              <WhatsAppIcon />
              <span>+971 54 318 6934</span>
            </a>
            <a
              className="header-contact"
              href="mailto:infludubai@gmail.com"
              aria-label="Email us at infludubai@gmail.com"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px",
                borderRadius: 999, background: scrolled ? "#f5f3ff" : "rgba(139,92,246,0.14)",
                border: scrolled ? "1px solid #ddd6fe" : "1px solid rgba(196,181,253,0.32)",
                color: scrolled ? "#6d28d9" : "#c4b5fd", fontSize: 13, fontWeight: 650,
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              <Mail size={17} strokeWidth={2} />
              <span>{c("global.supportEmail")}</span>
            </a>
            <span className="header-theme-toggle"><ThemeToggle variant={scrolled ? "default" : "ghost-white"} /></span>
            <Link className="header-sign-in" href="/login" style={{ padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, color: scrolled ? "#71717a" : "rgba(255,255,255,0.8)", textDecoration: "none" }}>Sign in</Link>
            <Link className="header-register" href="/register" style={{ textDecoration: "none" }}>
              <button style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}>Get started free</button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ background: "#08060f", minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {c("home.hero.imageUrl") && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c("home.hero.imageUrl")} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(9,9,11,0.78)" }} />
            </>
          )}
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
            {c("home.hero.badge")}
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", marginLeft: 4 }} />
          </div>

          {/* headline — no animation on opacity so always visible */}
          <h1 style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-0.03em", marginBottom: 24, textWrap: "balance" } as React.CSSProperties}>
            <span style={{ background: "linear-gradient(135deg,#8b5cf6,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {c("home.hero.title")}
            </span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.52)", maxWidth: 560, margin: "0 auto 40px" }}>
            {c("home.hero.subtitle")}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href={c("home.hero.primaryCtaHref", "/register?role=BRAND")} style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.45)" }}>
                {c("home.hero.primaryCta")} <ArrowRight size={16} />
              </button>
            </Link>
            <Link href={c("home.hero.secondaryCtaHref", "/marketplace")} style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
                {c("home.hero.secondaryCta")}
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
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 28 }}>{c("home.testimonials.title", "Trusted by leading brands")}</p>
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
              {c("home.features.title")}
            </h2>
            <p style={{ fontSize: 17, color: "#71717a", maxWidth: 480, margin: "0 auto" }}>{c("home.features.subtitle")}</p>
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
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{c("home.steps.title")}</h2>
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
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#09090b", letterSpacing: "-0.03em" }}>{c("home.testimonials.title")}</h2>
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
            {c("home.cta.title")}
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", marginBottom: 40 }}>{c("home.cta.subtitle")}</p>
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
    </div>
  );
}
