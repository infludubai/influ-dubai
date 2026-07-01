"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Zap, Building2, ArrowRight, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08 } }),
};

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: 0,
    period: "forever",
    desc: "Perfect for getting started. No credit card required.",
    icon: Zap,
    iconColor: "text-gray-600 bg-gray-100",
    highlight: false,
    features: [
      "1 active campaign",
      "Up to 5 creator profiles",
      "Basic search & discovery",
      "Community support",
      "Platform messaging",
    ],
    missing: ["AI insights", "Advanced analytics", "Priority support"],
    cta: "Start for free",
    href: "/register",
  },
  {
    key: "PROFESSIONAL",
    name: "Professional",
    price: 99,
    period: "per month",
    desc: "For growing brands running regular influencer campaigns.",
    icon: Sparkles,
    iconColor: "text-primary bg-primary/10",
    highlight: true,
    features: [
      "10 active campaigns",
      "Up to 100 creator profiles",
      "Advanced search & filters",
      "AI creator insights & scoring",
      "Full analytics dashboard",
      "Email support",
      "Campaign ROI tracking",
      "Proposal management",
    ],
    missing: [],
    cta: "Start Professional",
    href: null,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: 299,
    period: "per month",
    desc: "For agencies and large brands with unlimited needs.",
    icon: Building2,
    iconColor: "text-purple-600 bg-purple-100",
    highlight: false,
    features: [
      "Unlimited campaigns",
      "Unlimited creator profiles",
      "Dedicated account manager",
      "AI insights & predictions",
      "Custom analytics & exports",
      "Priority 24/7 support",
      "White-label options",
      "API access",
      "Custom contracts",
    ],
    missing: [],
    cta: "Start Enterprise",
    href: null,
  },
];

const FAQS = [
  { q: "Is there a free trial?", a: "The Free plan is unlimited — use it as long as you need. Professional and Enterprise plans can be cancelled anytime." },
  { q: "How does AI matching work?", a: "Our GPT-4o powered engine analyzes 20+ criteria including niche alignment, audience demographics, engagement authenticity, and past campaign performance." },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes. Upgrades are effective immediately; downgrades take effect at the end of your billing period." },
  { q: "How is billing handled?", a: "Payments are processed securely via Stripe. You can manage your subscription, download invoices, and update payment methods from your billing dashboard." },
  { q: "What payment methods do you accept?", a: "All major credit/debit cards, and corporate invoicing is available for Enterprise plans." },
];

export default function PricingPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleUpgrade(planKey: string) {
    if (!accessToken) { router.push(`/register`); return; }
    setUpgrading(planKey);
    try {
      const res = await api.createCheckout(accessToken, planKey as "PROFESSIONAL" | "ENTERPRISE");
      if (res.mock) { router.push("/dashboard/billing?success=1"); }
      else if (res.url) { window.location.href = res.url; }
    } catch { /* ignore */ }
    setUpgrading(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {accessToken
              ? <Link href="/dashboard"><button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90">Dashboard</button></Link>
              : <><Link href="/login"><button className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Log in</button></Link>
                  <Link href="/register"><button className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90">Get started</button></Link></>
            }
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mb-16 text-center">
          <motion.div variants={fadeUp} custom={0}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Simple, transparent pricing
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-bold text-balance">
            Choose your plan
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free, scale as you grow. All plans include our core discovery tools.
          </motion.p>
        </motion.div>

        {/* Plans */}
        <div className="mb-20 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                plan.highlight
                  ? "border-primary bg-primary/3 shadow-2xl shadow-primary/15 ring-2 ring-primary/20"
                  : "bg-card hover:border-border/80"
              } transition-all`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full gradient-brand px-4 py-1 text-xs font-bold text-white shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${plan.iconColor}`}>
                  <plan.icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/{plan.period}</span>
                </div>
              </div>

              {/* CTA */}
              {plan.href ? (
                <Link href={plan.href}>
                  <button className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "gradient-brand text-white shadow-md shadow-primary/25 hover:opacity-90"
                      : "border hover:bg-muted"
                  }`}>
                    {plan.cta} <ArrowRight className="inline h-4 w-4 ml-1" />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={upgrading === plan.key}
                  className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all disabled:opacity-60 ${
                    plan.highlight
                      ? "gradient-brand text-white shadow-md shadow-primary/25 hover:opacity-90"
                      : "border hover:bg-muted"
                  }`}
                >
                  {upgrading === plan.key ? "Processing…" : <>{plan.cta} <ArrowRight className="inline h-4 w-4 ml-1" /></>}
                </button>
              )}

              {/* Features */}
              <div className="mt-7 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature comparison table */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mb-20 overflow-hidden rounded-3xl border bg-card">
          <div className="border-b px-6 py-5">
            <h3 className="text-lg font-semibold">Full feature comparison</h3>
          </div>
          <div className="divide-y text-sm">
            {[
              { feature: "Active campaigns", free: "1", pro: "10", ent: "Unlimited" },
              { feature: "Creator profiles", free: "5", pro: "100", ent: "Unlimited" },
              { feature: "AI creator insights", free: "—", pro: "✓", ent: "✓" },
              { feature: "Analytics dashboard", free: "Basic", pro: "Full", ent: "Custom" },
              { feature: "AI matching engine", free: "✓", pro: "✓", ent: "✓" },
              { feature: "Messaging & proposals", free: "✓", pro: "✓", ent: "✓" },
              { feature: "Fraud detection", free: "—", pro: "✓", ent: "✓" },
              { feature: "API access", free: "—", pro: "—", ent: "✓" },
              { feature: "Support", free: "Community", pro: "Email", ent: "Dedicated 24/7" },
            ].map((row) => (
              <div key={row.feature} className="grid grid-cols-4 items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">{row.feature}</span>
                {[row.free, row.pro, row.ent].map((val, i) => (
                  <div key={i} className="text-center">
                    <span className={val === "✓" ? "text-emerald-600 font-semibold" : val === "—" ? "text-muted-foreground" : "font-medium"}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span></span>
              <span className="text-center">Free</span>
              <span className="text-center text-primary">Professional</span>
              <span className="text-center">Enterprise</span>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="mb-8 text-center text-2xl font-bold">Frequently asked questions</h3>
          <div className="mx-auto max-w-2xl space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  <HelpCircle className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t px-5 py-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-20 rounded-3xl bg-auth-gradient p-10 text-center">
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">Still not sure?</p>
          <h3 className="text-2xl font-bold text-white">Start free — no credit card needed</h3>
          <p className="mt-2 text-white/65">Upgrade anytime as your campaigns grow.</p>
          <Link href="/register">
            <button className="mt-6 rounded-2xl bg-white px-8 py-3 font-semibold text-primary shadow-xl hover:bg-white/95 transition-all hover:-translate-y-0.5">
              Create free account
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
