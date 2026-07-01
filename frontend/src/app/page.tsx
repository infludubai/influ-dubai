"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Search, BarChart3, ShieldCheck, Users,
  Sparkles, Zap, CheckCircle2, Star, MessageSquare,
  TrendingUp, Globe, ChevronRight,
} from "lucide-react";

/* ── tiny helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ── data ── */
const STATS = [
  { value: "12,000+", label: "Verified Creators" },
  { value: "850+",    label: "Active Brands" },
  { value: "3,200+",  label: "Campaigns Launched" },
  { value: "AED 40M+",label: "Creator Earnings" },
];

const FEATURES = [
  { icon: Search,       color: "bg-violet-100 text-violet-600", title: "Creator Discovery",      desc: "Search 12,000+ verified UAE & MENA creators by niche, location, followers, and engagement rate." },
  { icon: Users,        color: "bg-blue-100 text-blue-600",     title: "AI Matching Engine",     desc: "GPT-4o powered matching recommends the most relevant creators for every campaign brief." },
  { icon: ShieldCheck,  color: "bg-emerald-100 text-emerald-600",title:"Fraud Detection",        desc: "Flag fake followers, bot engagement, and suspicious growth patterns before you spend." },
  { icon: BarChart3,    color: "bg-orange-100 text-orange-600", title: "Campaign Analytics",     desc: "Real-time dashboards tracking reach, engagement, conversions, and predicted ROI." },
  { icon: MessageSquare,color: "bg-pink-100 text-pink-600",     title: "Built-in Collaboration", desc: "Proposals, contracts, messaging and deliverable management all in one place." },
  { icon: Globe,        color: "bg-teal-100 text-teal-600",     title: "MENA-First Platform",    desc: "Built for UAE, KSA, Egypt and broader MENA. Arabic-ready with local market intelligence." },
];

const STEPS = [
  { n: "01", title: "Create your profile",       desc: "Brands set campaign goals. Creators add niche, rates and link socials in minutes." },
  { n: "02", title: "AI finds the right match",  desc: "Our engine scores and ranks creators against your brief using 20+ signals." },
  { n: "03", title: "Collaborate and grow",       desc: "Proposals, live performance tracking and payments — all inside the platform." },
];

const TESTIMONIALS = [
  { quote: "InfluDubai AI cut our influencer sourcing time by 70%. The fraud detection alone saved us from a costly mistake.", name: "Sarah Al-Mansoori", role: "CMO, Noon.com",          initials: "SA", color: "bg-violet-100 text-violet-700" },
  { quote: "We found three incredible UAE lifestyle creators in 20 minutes. The AI matching is genuinely impressive.",        name: "Ahmed Khalil",       role: "Marketing Dir., Careem",  initials: "AK", color: "bg-blue-100 text-blue-700" },
  { quote: "The analytics dashboard helped me understand my audience better and raise my rates confidently by 40%.",          name: "Layla Hassan",       role: "Fashion Creator, Dubai",  initials: "LH", color: "bg-emerald-100 text-emerald-700" },
];

const BRANDS = ["Noon","Emirates","Majid Al Futtaim","Talabat","Careem","ADNOC","Emaar","Etisalat"];
const CATEGORIES = ["Beauty","Fashion","Fitness","Food & Drink","Tech","Travel","Gaming","Finance","Lifestyle","Luxury"];

/* ── component ── */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">

      {/* ══ Navbar ══ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className={`text-[15px] font-bold tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
              InfluDubai <span className={scrolled ? "gradient-text" : "text-violet-400"}>AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[{ href: "/marketplace", label: "Marketplace" }, { href: "/pricing", label: "Pricing" }].map(({ href, label }) => (
              <Link key={href} href={href}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  scrolled ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" : "text-white/70 hover:text-white hover:bg-white/10"
                }`}>{label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                scrolled ? "text-gray-600 hover:bg-gray-50" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}>Sign in</button>
            </Link>
            <Link href="/register">
              <button className="btn-primary text-sm py-2 px-5">Get started free</button>
            </Link>
          </div>
        </div>
      </header>

      {/* ══ Hero — dark like a-mir.com ══ */}
      <section className="relative flex min-h-screen items-center justify-center bg-hero-dark overflow-hidden">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center pt-24">
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm"
          >
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            UAE &amp; MENA Creator Intelligence Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-bold leading-[1.06] text-white sm:text-6xl lg:text-7xl text-balance"
          >
            Discover. Match.{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">Run campaigns<br className="hidden sm:block" /> that perform.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/55"
          >
            AI-powered creator discovery, fraud detection and performance analytics
            for brands and agencies across the UAE and MENA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/register?role=BRAND">
              <button className="btn-primary text-base py-3 px-8">
                View Packages <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="btn-secondary text-base py-3 px-8">
                Browse Creators
              </button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-20 grid grid-cols-2 gap-px sm:grid-cols-4 border border-white/10 rounded-2xl overflow-hidden"
          >
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm px-6 py-6 text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-white/45">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
          <div className="h-10 w-px bg-gradient-to-b from-white/30 to-transparent" />
          <span className="text-[10px] tracking-widest uppercase">scroll</span>
        </div>
      </section>

      {/* ══ Brand trust bar ══ */}
      <section className="border-b border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Trusted by leading brands across UAE &amp; MENA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {BRANDS.map((b) => (
              <span key={b} className="text-sm font-bold tracking-wide text-gray-300 hover:text-gray-500 transition-colors">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Category chips ══ */}
      <section className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mr-1">Browse</span>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/marketplace?category=${c}`}>
                <span className="cursor-pointer rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">
                  {c}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Features ══ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <FadeSection className="mb-14 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Platform capabilities
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Everything you need to run<br className="hidden sm:block" /> creator campaigns
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-lg text-lg text-gray-500">
              From discovery to payment — one unified platform built for UAE and MENA.
            </motion.p>
          </FadeSection>

          <FadeSection className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className={`mb-5 icon-badge ${f.color} transition-transform group-hover:scale-110`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </FadeSection>
        </div>
      </section>

      {/* ══ How it works — dark bg like a-mir.com CTA ══ */}
      <section className="py-20 bg-gray-950">
        <div className="mx-auto max-w-7xl px-6">
          <FadeSection className="mb-14 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
              Simple by design
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-white sm:text-5xl">
              From brief to results in 3 steps
            </motion.h2>
          </FadeSection>

          <FadeSection className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i}
                className="relative rounded-2xl border border-white/8 bg-white/5 p-8 backdrop-blur-sm"
              >
                <p className="mb-4 text-5xl font-bold text-white/10">{s.n}</p>
                <h3 className="mb-2.5 text-lg font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{s.desc}</p>
              </motion.div>
            ))}
          </FadeSection>
        </div>
      </section>

      {/* ══ Testimonials ══ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <FadeSection className="mb-14 text-center">
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
              Trusted by leaders
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-gray-900 sm:text-5xl">
              What our customers say
            </motion.h2>
          </FadeSection>

          <FadeSection className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                className="rounded-2xl border border-gray-100 bg-white p-7"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </FadeSection>
        </div>
      </section>

      {/* ══ CTA — purple-to-blue gradient like a-mir.com ══ */}
      <section className="relative overflow-hidden bg-cta-gradient py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <FadeSection>
            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
              Ready to grow?
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold text-white sm:text-5xl text-balance">
              Join 12,000+ creators and 850+ brands running smarter campaigns.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-md text-lg text-white/60">
              Start free. No credit card required.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-violet-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl">
                  Get started free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/marketplace">
                <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/18">
                  Browse creators
                </button>
              </Link>
            </motion.div>
          </FadeSection>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer className="border-t border-gray-100 bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl grid gap-10 sm:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">InfluDubai <span className="gradient-text">AI</span></span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">Creator intelligence for the UAE &amp; MENA region.</p>
            <p className="mt-5 text-xs text-gray-400">© 2025 InfluDubai AI. All rights reserved.</p>
          </div>
          {[
            { heading: "Platform", links: [{ l: "Marketplace", h: "/marketplace" }, { l: "For Creators", h: "/register?role=CREATOR" }, { l: "For Brands", h: "/register?role=BRAND" }, { l: "Pricing", h: "/pricing" }] },
            { heading: "Company",  links: [{ l: "About", h: "#" }, { l: "Blog", h: "#" }, { l: "Careers", h: "#" }, { l: "Contact", h: "#" }] },
            { heading: "Legal",    links: [{ l: "Privacy Policy", h: "#" }, { l: "Terms of Service", h: "#" }, { l: "Cookie Policy", h: "#" }] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{col.heading}</p>
              <div className="space-y-3">
                {col.links.map((l) => (
                  <Link key={l.l} href={l.h} className="block text-sm text-gray-500 transition-colors hover:text-gray-900">{l.l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
