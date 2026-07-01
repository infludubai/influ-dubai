"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Users,
  Sparkles, Zap, CheckCircle2, Star, MessageSquare, Globe, ChevronRight,
} from "lucide-react";

/* ---------- animation helpers ---------- */
function useFade() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return { ref, inView };
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
});

/* ---------- data ---------- */
const STATS = [
  { value: "12,000+",  label: "Verified Creators" },
  { value: "850+",     label: "Active Brands" },
  { value: "3,200+",   label: "Campaigns" },
  { value: "AED 40M+", label: "Creator Earnings" },
];

const FEATURES = [
  { icon: Search,        bg: "#f5f3ff", fg: "#7c3aed", title: "Creator Discovery",      body: "Search 12,000+ verified UAE & MENA creators by niche, location, followers, and engagement." },
  { icon: Users,         bg: "#eff6ff", fg: "#2563eb", title: "AI Matching Engine",      body: "GPT-4o powered matching recommends the best creators for every campaign brief automatically." },
  { icon: ShieldCheck,   bg: "#f0fdf4", fg: "#16a34a", title: "Fraud Detection",         body: "Flag fake followers, bot engagement, and suspicious growth patterns before you spend a dirham." },
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

/* ---------- sub-components ---------- */
function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const { ref, inView } = useFade();
  return (
    <motion.div ref={ref} {...up(i * 0.07)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      className="group relative rounded-[20px] border border-zinc-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100/60"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: f.bg }}>
        <f.icon className="h-5 w-5" style={{ color: f.fg }} strokeWidth={1.8} />
      </div>
      <h3 className="mb-2 text-base font-semibold text-zinc-900">{f.title}</h3>
      <p className="text-sm leading-relaxed text-zinc-500">{f.body}</p>
      <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Learn more <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </motion.div>
  );
}

function Stat({ s, i }: { s: typeof STATS[0]; i: number }) {
  const { ref, inView } = useFade();
  return (
    <motion.div ref={ref} {...up(i * 0.08)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      className="text-center">
      <p className="text-4xl font-bold text-white">{s.value}</p>
      <p className="mt-1 text-sm text-white/50">{s.label}</p>
    </motion.div>
  );
}

/* ---------- page ---------- */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ════════════════ NAVBAR ════════════════ */}
      <header
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={scrolled
          ? { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f4f4f5", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }
          : { background: "transparent" }
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)" }}>
              <Sparkles className="h-4 w-4 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[15px] font-bold" style={{ color: scrolled ? "#09090b" : "#fff" }}>
              InfluDubai{" "}
              <span style={{ color: scrolled ? "#7c3aed" : "#a78bfa" }}>AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[{ href: "/marketplace", l: "Marketplace" }, { href: "/pricing", l: "Pricing" }].map(({ href, l }) => (
              <Link key={href} href={href}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: scrolled ? "#71717a" : "rgba(255,255,255,0.7)" }}
                onMouseEnter={e => (e.currentTarget.style.color = scrolled ? "#09090b" : "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? "#71717a" : "rgba(255,255,255,0.7)")}
              >{l}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                style={{ color: scrolled ? "#71717a" : "rgba(255,255,255,0.8)", background: "transparent" }}
              >Sign in</button>
            </Link>
            <Link href="/register">
              <button className="btn-primary py-2.5 px-5 text-sm">Get started free</button>
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════ HERO ════════════════ */}
      <section style={{ background: "#08060f", minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* mesh background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: 0, right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: "30%", left: "-5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
          {/* grid lines */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center">
          {/* badge */}
          <motion.div {...up(0)} className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}
          >
            <Zap className="h-3.5 w-3.5 text-violet-400" strokeWidth={2} />
            UAE &amp; MENA Creator Intelligence Platform
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </motion.div>

          {/* headline */}
          <motion.h1 {...up(0.1)} className="mb-6 text-5xl font-bold leading-[1.07] sm:text-6xl lg:text-[76px]" style={{ color: "#fff", textWrap: "balance" }}>
            Discover. Match.{" "}
            <span style={{ background: "linear-gradient(135deg,#8b5cf6,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Run campaigns that perform.
            </span>
          </motion.h1>

          {/* sub */}
          <motion.p {...up(0.18)} className="mx-auto mb-10 max-w-xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            AI-powered creator discovery, fraud detection and live analytics for brands and agencies across the UAE and MENA.
          </motion.p>

          {/* CTAs */}
          <motion.div {...up(0.25)} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register?role=BRAND">
              <button className="btn-primary text-base py-3.5 px-9">
                Start as a Brand <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="btn-ghost-white text-base py-3.5 px-9">
                Browse Creators
              </button>
            </Link>
          </motion.div>

          {/* stats */}
          <motion.div {...up(0.33)} className="mt-24 grid grid-cols-2 gap-8 sm:grid-cols-4 pt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {STATS.map((s, i) => <Stat key={s.label} s={s} i={i} />)}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ BRAND LOGOS ════════════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #f4f4f5", padding: "40px 24px" }}>
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-7 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "#a1a1aa" }}>
            Trusted by leading brands across UAE &amp; MENA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {BRANDS.map(b => (
              <span key={b} className="text-sm font-bold tracking-wide transition-colors" style={{ color: "#d4d4d8" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#71717a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#d4d4d8")}
              >{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES ════════════════ */}
      <section style={{ background: "#fff", padding: "100px 24px" }}>
        <div className="mx-auto max-w-7xl">
          {/* section header */}
          {(() => {
            const { ref, inView } = useFade();
            return (
              <div ref={ref} className="mb-16 text-center">
                <motion.p {...up(0)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="mb-3 text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#7c3aed" }}>
                  Platform capabilities
                </motion.p>
                <motion.h2 {...up(0.08)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="text-4xl font-bold sm:text-5xl" style={{ color: "#09090b" }}>
                  Everything to run<br className="hidden sm:block" /> creator campaigns
                </motion.h2>
                <motion.p {...up(0.14)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="mx-auto mt-4 max-w-lg text-lg" style={{ color: "#71717a" }}>
                  From discovery to payment — one unified platform built for MENA.
                </motion.p>
              </div>
            );
          })()}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section style={{ background: "#08060f", padding: "100px 24px" }}>
        <div className="mx-auto max-w-6xl">
          {(() => {
            const { ref, inView } = useFade();
            return (
              <div ref={ref} className="mb-16 text-center">
                <motion.p {...up(0)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="mb-3 text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#8b5cf6" }}>
                  Simple by design
                </motion.p>
                <motion.h2 {...up(0.08)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="text-4xl font-bold sm:text-5xl" style={{ color: "#fff" }}>
                  From brief to results<br className="hidden sm:block" /> in 3 steps
                </motion.h2>
              </div>
            );
          })()}

          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => {
              const { ref, inView } = useFade();
              return (
                <motion.div key={s.n} ref={ref} {...up(i * 0.1)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                  className="rounded-[20px] p-8"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="mb-5 text-6xl font-black" style={{ color: "rgba(139,92,246,0.18)", lineHeight: 1 }}>{s.n}</p>
                  <h3 className="mb-3 text-lg font-semibold" style={{ color: "#fff" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section style={{ background: "#fafafa", padding: "100px 24px" }}>
        <div className="mx-auto max-w-6xl">
          {(() => {
            const { ref, inView } = useFade();
            return (
              <div ref={ref} className="mb-14 text-center">
                <motion.p {...up(0)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="mb-3 text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#7c3aed" }}>
                  Social proof
                </motion.p>
                <motion.h2 {...up(0.08)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  className="text-4xl font-bold sm:text-5xl" style={{ color: "#09090b" }}>
                  Loved by brands<br className="hidden sm:block" /> and creators alike
                </motion.h2>
              </div>
            );
          })()}
          <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => {
              const { ref, inView } = useFade();
              return (
                <motion.div key={t.name} ref={ref} {...up(i * 0.09)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                  className="rounded-[20px] bg-white p-8"
                  style={{ border: "1px solid #f4f4f5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                >
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#52525b" }}>"{t.q}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                      {t.init}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#09090b" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "#a1a1aa" }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA ════════════════ */}
      <section style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#2563eb 100%)", padding: "100px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.04)", filter: "blur(60px)" }} />
        </div>
        {(() => {
          const { ref, inView } = useFade();
          return (
            <div ref={ref} className="relative z-10 mx-auto max-w-2xl text-center">
              <motion.p {...up(0)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className="mb-3 text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Ready to grow?
              </motion.p>
              <motion.h2 {...up(0.08)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className="text-4xl font-bold sm:text-5xl" style={{ color: "#fff", textWrap: "balance" }}>
                Join 12,000+ creators and 850+ brands running smarter campaigns.
              </motion.h2>
              <motion.p {...up(0.14)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className="mx-auto mt-4 max-w-sm text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
                Start free. No credit card required.
              </motion.p>
              <motion.div {...up(0.2)} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <button className="btn-white text-base py-3.5 px-10">
                    Get started free <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/marketplace">
                  <button className="btn-ghost-white text-base py-3.5 px-10">
                    Browse creators
                  </button>
                </Link>
              </motion.div>
            </div>
          );
        })()}
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ background: "#fff", borderTop: "1px solid #f4f4f5", padding: "64px 24px" }}>
        <div className="mx-auto max-w-7xl grid gap-10 sm:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)" }}>
                <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#09090b" }}>
                InfluDubai <span style={{ color: "#7c3aed" }}>AI</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>Creator intelligence for the UAE &amp; MENA region.</p>
            <p className="mt-5 text-xs" style={{ color: "#d4d4d8" }}>© 2025 InfluDubai AI. All rights reserved.</p>
          </div>
          {[
            { h: "Platform", links: [["Marketplace","/marketplace"],["For Creators","/register?role=CREATOR"],["For Brands","/register?role=BRAND"],["Pricing","/pricing"]] },
            { h: "Company",  links: [["About","#"],["Blog","#"],["Careers","#"],["Contact","#"]] },
            { h: "Legal",    links: [["Privacy Policy","#"],["Terms of Service","#"],["Cookie Policy","#"]] },
          ].map(col => (
            <div key={col.h}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#a1a1aa" }}>{col.h}</p>
              <div className="space-y-3">
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href}
                    className="block text-sm transition-colors"
                    style={{ color: "#71717a" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#09090b")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
