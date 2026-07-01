"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Users,
  Sparkles, ChevronRight, Globe, Zap, CheckCircle2,
  TrendingUp, Star, MessageSquare,
} from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07, ease: EASE } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

const STATS = [
  { value: "12,000+", label: "Verified Creators" },
  { value: "850+", label: "Active Brands" },
  { value: "3,200+", label: "Campaigns Launched" },
  { value: "AED 40M+", label: "Creator Earnings" },
];

const FEATURES = [
  {
    icon: Search,
    color: "bg-violet-50 text-violet-600",
    title: "Creator Discovery",
    desc: "Search 12,000+ verified UAE & MENA creators by niche, location, follower count, and engagement rate with powerful filters.",
  },
  {
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    title: "AI Matching Engine",
    desc: "Our GPT-4o matching engine recommends the most relevant creators for every campaign based on 20+ audience and content signals.",
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    title: "Fraud Detection",
    desc: "Automatically flag fake followers, bot engagement, and suspicious growth patterns before you commit your budget.",
  },
  {
    icon: BarChart3,
    color: "bg-orange-50 text-orange-600",
    title: "Campaign Analytics",
    desc: "Real-time dashboards tracking reach, engagement, conversions, and ROI. Predict results before you launch.",
  },
  {
    icon: MessageSquare,
    color: "bg-pink-50 text-pink-600",
    title: "Built-in Collaboration",
    desc: "Invite creators, review proposals, negotiate rates, and manage deliverables — all in one workspace.",
  },
  {
    icon: Globe,
    color: "bg-teal-50 text-teal-600",
    title: "MENA-First Platform",
    desc: "Built for UAE, Saudi Arabia, Egypt and the broader MENA market. Arabic-ready with local market intelligence.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create your profile",
    desc: "Brands set campaign goals. Creators add their niche, rates, and link social accounts in minutes.",
  },
  {
    n: "2",
    title: "AI finds the right match",
    desc: "Our matching engine scores and ranks creators against your campaign brief using 20+ signals.",
  },
  {
    n: "3",
    title: "Collaborate and grow",
    desc: "Proposals, contracts, messaging, and live performance tracking — handled inside the platform.",
  },
];

const TESTIMONIALS = [
  {
    quote: "InfluDubai AI cut our influencer sourcing time by 70%. The fraud detection alone saved us from a costly mistake.",
    name: "Sarah Al-Mansoori",
    role: "CMO, Noon.com",
    initials: "SA",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote: "We found three incredible UAE lifestyle creators in 20 minutes. The AI matching is genuinely impressive.",
    name: "Ahmed Khalil",
    role: "Marketing Director, Careem",
    initials: "AK",
    color: "bg-blue-100 text-blue-700",
  },
  {
    quote: "The analytics dashboard helped me understand my audience better and confidently raise my rates by 40%.",
    name: "Layla Hassan",
    role: "Fashion Creator, Dubai",
    initials: "LH",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const CATEGORIES = ["Beauty", "Fashion", "Fitness", "Food & Drink", "Tech", "Travel", "Gaming", "Finance", "Lifestyle", "Luxury"];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-zinc-900">
              InfluDubai <span className="gradient-text">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "/marketplace", label: "Marketplace" },
              { href: "/pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
                Sign in
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-primary rounded-lg px-4 py-2 text-sm">
                Get started free
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-hero pt-20 pb-28">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-64 top-0 h-[600px] w-[600px] rounded-full bg-violet-400/8 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-400/6 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700"
          >
            <Zap className="h-3.5 w-3.5" />
            UAE &amp; MENA Creator Intelligence Platform
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl text-balance"
          >
            Find the right creators.{" "}
            <span className="gradient-text">Run campaigns<br className="hidden sm:block" /> that perform.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-500"
          >
            AI-powered creator discovery, fraud detection and performance analytics
            for brands and agencies across the UAE and MENA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/register?role=BRAND">
              <button className="btn-primary flex items-center gap-2 rounded-xl px-7 py-3.5 text-base">
                Start as a Brand <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/register?role=CREATOR">
              <button className="btn-secondary flex items-center gap-2 rounded-xl px-7 py-3.5 text-base">
                Join as Creator
              </button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-100 bg-white px-4 py-5 text-center shadow-sm">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Category chips ── */}
      <section className="border-b border-t border-zinc-100 bg-zinc-50/70 py-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mr-1">Browse</span>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/marketplace?category=${c}`}>
                <span className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">
                  {c}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <Section className="mb-16 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Platform capabilities
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-zinc-900">
              Everything you need to run<br className="hidden sm:block" /> creator campaigns
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">
              From discovery to payment — one unified platform built for UAE and MENA.
            </motion.p>
          </Section>

          <Section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group rounded-2xl border border-zinc-100 bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 bg-zinc-50">
        <div className="container mx-auto max-w-7xl px-6">
          <Section className="mb-16 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Simple by design
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-zinc-900">
              From brief to results in 3 steps
            </motion.h2>
          </Section>

          <Section className="relative grid gap-6 sm:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-12 mx-auto hidden h-px max-w-lg bg-gradient-to-r from-transparent via-violet-200 to-transparent sm:block" />

            {STEPS.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i}
                className="relative rounded-2xl border border-zinc-100 bg-white p-8 text-center"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white text-lg font-bold shadow-md shadow-violet-300/30">
                  {s.n}
                </div>
                <h3 className="mb-2.5 text-lg font-semibold text-zinc-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{s.desc}</p>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-28 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <Section className="mb-16 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Trusted by leaders
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-zinc-900">
              What our customers say
            </motion.h2>
          </Section>

          <Section className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                className="rounded-2xl border border-zinc-100 bg-white p-7"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── Brand trust bar ── */}
      <section className="border-t border-b border-zinc-100 bg-zinc-50/80 py-10">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <p className="mb-7 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Trusted by leading brands across UAE &amp; MENA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["Noon", "Emirates", "Majid Al Futtaim", "Talabat", "Careem", "ADNOC", "Emaar", "Etisalat"].map((b) => (
              <span key={b} className="text-sm font-bold tracking-wide text-zinc-300 transition-colors hover:text-zinc-500">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-auth-gradient py-28">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-10" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Section>
            <motion.div variants={fadeUp}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/85">
              <Sparkles className="h-3.5 w-3.5" /> Ready to grow with AI?
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="mt-4 text-4xl font-bold text-white text-balance leading-tight">
              Join 12,000+ creators and 850+ brands<br className="hidden sm:block" /> running smarter campaigns.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-md text-lg text-white/60">
              Start free. No credit card required.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <button className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-violet-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-2xl">
                  Get started free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/marketplace">
                <button className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15">
                  Browse creators
                </button>
              </Link>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 bg-white px-6 py-16">
        <div className="container mx-auto max-w-7xl grid gap-10 sm:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-zinc-900">InfluDubai <span className="gradient-text">AI</span></span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">Creator intelligence for the UAE &amp; MENA region.</p>
            <p className="mt-5 text-xs text-zinc-400">© 2025 InfluDubai AI. All rights reserved.</p>
          </div>

          {[
            { heading: "Platform", links: [{ l: "Marketplace", h: "/marketplace" }, { l: "For Creators", h: "/register?role=CREATOR" }, { l: "For Brands", h: "/register?role=BRAND" }, { l: "Pricing", h: "/pricing" }] },
            { heading: "Company",  links: [{ l: "About", h: "#" }, { l: "Blog", h: "#" }, { l: "Careers", h: "#" }, { l: "Contact", h: "#" }] },
            { heading: "Legal",    links: [{ l: "Privacy Policy", h: "#" }, { l: "Terms of Service", h: "#" }, { l: "Cookie Policy", h: "#" }] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">{col.heading}</p>
              <div className="space-y-3">
                {col.links.map((l) => (
                  <Link key={l.l} href={l.h} className="block text-sm text-zinc-500 transition-colors hover:text-zinc-900">{l.l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
