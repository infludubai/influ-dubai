"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Zap, Search, BarChart3, ShieldCheck, Users, Star,
  TrendingUp, CheckCircle2, Globe, Sparkles, Play, ChevronRight, Building2,
} from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: EASE } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function InView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

const CATEGORIES = ["Beauty", "Fashion", "Fitness", "Food", "Tech", "Travel", "Gaming", "Finance", "Lifestyle", "Luxury"];
const STATS = [
  { value: "12,000+", label: "Verified Creators" },
  { value: "850+", label: "Active Brands" },
  { value: "3,200+", label: "Campaigns Run" },
  { value: "AED 40M+", label: "Creator Earnings" },
];
const FEATURES = [
  { icon: Search, color: "bg-blue-50 text-blue-600", title: "Creator Discovery", desc: "Search 12,000+ verified UAE & MENA creators by niche, location, audience size, and engagement rate." },
  { icon: BarChart3, color: "bg-purple-50 text-purple-600", title: "Campaign Analytics", desc: "Real-time dashboards tracking reach, engagement, conversions and ROI across every campaign." },
  { icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600", title: "Fraud Detection", desc: "AI-powered authenticity scoring flags fake followers and suspicious engagement patterns automatically." },
  { icon: Users, color: "bg-orange-50 text-orange-600", title: "AI Matching Engine", desc: "Smart recommendations match brands with the most relevant creators for each campaign type." },
  { icon: Sparkles, color: "bg-pink-50 text-pink-600", title: "AI Insights", desc: "GPT-4o creator intelligence reports, audience summaries, and campaign performance predictions." },
  { icon: Globe, color: "bg-teal-50 text-teal-600", title: "MENA Coverage", desc: "Built specifically for UAE, Saudi Arabia, Egypt, and the broader MENA influencer market." },
];
const HOW_IT_WORKS = [
  { n: "01", title: "Create your profile", desc: "Creators add bio, rates, categories & link socials. Brands set up company profile and campaign goals.", icon: "✏️" },
  { n: "02", title: "Get matched by AI", desc: "Our GPT-4o matching engine recommends the perfect creators for each campaign based on 20+ criteria.", icon: "🤖" },
  { n: "03", title: "Collaborate & grow", desc: "Negotiate, send proposals, deliver content, track performance — all inside the platform.", icon: "🚀" },
];
const TESTIMONIALS = [
  { quote: "InfluDubai AI cut our influencer sourcing time by 70%. The AI matching is genuinely impressive.", name: "Sarah Al-Mansoori", role: "CMO, Noon.com", initials: "SM" },
  { quote: "We found three incredible UAE lifestyle creators in 20 minutes. The fraud detection saved us from a costly mistake.", name: "Ahmed Khalil", role: "Marketing Director, Careem", initials: "AK" },
  { quote: "The analytics and AI insights helped me understand my audience better and raise my rates confidently.", name: "Layla Hassan", role: "Fashion Creator, Dubai", initials: "LH" },
];
const BRANDS = ["Noon", "Emirates", "Majid Al Futtaim", "Talabat", "Careem", "ADNOC", "Emaar", "Etisalat"];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">InfluDubai <span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/marketplace" className="rounded-xl px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Marketplace</Link>
            <Link href="/pricing" className="rounded-xl px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground sm:inline">EN / AR</span>
            <Link href="/login"><button className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Log in</button></Link>
            <Link href="/register"><button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-opacity hover:opacity-90">Get started</button></Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-mesh pt-16 pb-24">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-purple-500/12 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-4xl">
            <motion.div variants={fadeUp} custom={0}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm text-primary shadow-sm">
              <Zap className="h-3.5 w-3.5" />
              <span>UAE &amp; MENA Creator Intelligence Platform</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Find the right creators.{" "}
              <span className="gradient-text">Launch campaigns<br />that perform.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              AI-powered discovery, fraud detection and analytics for brands, agencies and creators across UAE and MENA.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register?role=BRAND">
                <button className="gradient-brand flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:opacity-90 hover:-translate-y-0.5">
                  Start as a Brand <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/register?role=CREATOR">
                <button className="flex items-center gap-2 rounded-2xl border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5">
                  Join as Creator
                </button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4}
              className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold gradient-text">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────── */}
      <section className="border-y bg-muted/30 py-5">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browse</span>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/marketplace?category=${c}`}>
                <span className="cursor-pointer rounded-full border bg-background px-4 py-1.5 text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-sm">
                  {c}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <InView className="mb-14 text-center">
            <motion.p variants={fadeUp} custom={0} className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Platform capabilities</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-balance">Everything you need to run creator campaigns</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">From discovery to payment — one platform built for UAE and MENA.</motion.p>
          </InView>
          <InView className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group rounded-2xl border bg-card p-7 card-hover">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </InView>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <InView className="mb-14 text-center">
            <motion.p variants={fadeUp} custom={0} className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Simple process</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold">Get from brief to results in 3 steps</motion.h2>
          </InView>
          <InView className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.n} variants={fadeUp} custom={i}
                className="relative rounded-2xl border bg-card p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-4xl font-bold text-primary/15">{step.n}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </InView>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <InView className="mb-14 text-center">
            <motion.p variants={fadeUp} custom={0} className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Trusted by leaders</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold">What our customers say</motion.h2>
          </InView>
          <InView className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                className="rounded-2xl border bg-card p-6 card-hover">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </InView>
        </div>
      </section>

      {/* ── Brand logos ────────────────────────────────────────────── */}
      <section className="border-y bg-muted/20 py-8">
        <div className="container mx-auto px-6">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trusted by leading brands across the UAE</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {BRANDS.map((b) => (
              <span key={b} className="text-sm font-bold uppercase tracking-wide text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-default">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-auth-gradient py-24">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-15" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto px-6 text-center">
          <InView>
            <motion.div variants={fadeUp} custom={0}
              className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> Ready to grow with AI?
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="mt-4 text-4xl font-bold text-white text-balance">
              Join 12,000+ creators and 850+ brands<br className="hidden sm:block" /> running smarter campaigns.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-lg text-lg text-white/65">Start free. No credit card required.</motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <button className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-semibold text-primary shadow-xl transition-all hover:bg-white/95 hover:-translate-y-0.5">
                  Get started free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/marketplace">
                <button className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15">
                  Browse creators
                </button>
              </Link>
            </motion.div>
          </InView>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t bg-background px-6 py-14">
        <div className="container mx-auto grid gap-10 sm:grid-cols-4">
          <div>
            <Link href="/" className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
            </Link>
            <p className="text-sm text-muted-foreground">Creator intelligence for the UAE &amp; MENA region.</p>
            <p className="mt-4 text-xs text-muted-foreground">© 2025 InfluDubai AI. All rights reserved.</p>
          </div>
          {[
            { heading: "Platform", links: [{ l: "Marketplace", h: "/marketplace" }, { l: "For Creators", h: "/register?role=CREATOR" }, { l: "For Brands", h: "/register?role=BRAND" }, { l: "Pricing", h: "/pricing" }] },
            { heading: "Company",  links: [{ l: "About", h: "#" }, { l: "Blog", h: "#" }, { l: "Careers", h: "#" }, { l: "Contact", h: "#" }] },
            { heading: "Legal",    links: [{ l: "Privacy Policy", h: "#" }, { l: "Terms of Service", h: "#" }, { l: "Cookie Policy", h: "#" }] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider">{col.heading}</p>
              <div className="space-y-2.5">
                {col.links.map((l) => (
                  <Link key={l.l} href={l.h} className="block text-sm text-muted-foreground transition-colors hover:text-foreground">{l.l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
