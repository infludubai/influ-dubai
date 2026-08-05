import Link from "next/link";
import {
  Search, Sparkles, ClipboardList, BarChart3, Wallet, ShieldCheck,
  UserPlus, BadgeCheck, Send, ArrowRight,
} from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How it works",
  path: "/how-it-works",
  description:
    "From brief to payout: how brands find verified UAE creators, run campaigns, approve deliverables and measure ROI on InfluDubai AI.",
});

const BRAND_STEPS = [
  {
    icon: ClipboardList,
    title: "Write the brief",
    body: "Set your objective, budget, target markets and the content you need. Takes about five minutes.",
  },
  {
    icon: Sparkles,
    title: "Get matched",
    body: "Our engine ranks creators against your brief using audience, engagement quality and category fit — then you invite the ones you like.",
  },
  {
    icon: ShieldCheck,
    title: "Check authenticity",
    body: "Every shortlisted creator carries a fraud-risk score built from engagement and follower-growth anomalies, so you spot bought audiences before you spend.",
  },
  {
    icon: Send,
    title: "Assign deliverables",
    body: "Break the campaign into concrete pieces of work with rates and deadlines. Creators submit, you approve or request changes.",
  },
  {
    icon: BarChart3,
    title: "Measure and pay",
    body: "Track reach, engagement and ROI as results land. Approving a deliverable releases the creator's payout automatically.",
  },
];

const CREATOR_STEPS = [
  {
    icon: UserPlus,
    title: "Build your profile",
    body: "Add your niche, languages, rate card and portfolio. Link your Instagram, TikTok, YouTube, LinkedIn or X accounts.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified",
    body: "Submit your platform insights for review. A verified badge lifts you in search and signals authenticity to brands.",
  },
  {
    icon: Search,
    title: "Get discovered",
    body: "Brands find you through search and AI recommendations, or you apply directly to open campaigns that fit.",
  },
  {
    icon: ClipboardList,
    title: "Deliver the work",
    body: "Everything lives in one place: the brief, the deadline, your submissions and the brand's feedback.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    body: "Once the brand approves, your payout is queued automatically with the platform fee shown up front — no chasing invoices.",
  },
];

function Track({
  label,
  accent,
  steps,
  cta,
  href,
}: {
  label: string;
  accent: string;
  steps: typeof BRAND_STEPS;
  cta: string;
  href: string;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {label}
        </span>
      </div>

      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-2xl border bg-card p-5">
            <div className="flex flex-col items-center">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}1a`, color: accent }}
              >
                <s.icon className="h-4.5 w-4.5" />
              </div>
              {i < steps.length - 1 && (
                <div className="mt-2 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h3 className="text-sm font-bold">
                <span className="mr-2 text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Link href={href}>
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
          {cta} <ArrowRight className="h-4 w-4" />
        </button>
      </Link>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From brief to payout, in one place"
        subtitle="InfluDubai AI handles discovery, vetting, collaboration, approval and payment — so campaigns don't live across spreadsheets, DMs and invoices."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Track
            label="For brands & agencies"
            accent="#7c3aed"
            steps={BRAND_STEPS}
            cta="Start a campaign"
            href="/register?role=BRAND"
          />
          <Track
            label="For creators"
            accent="#0f766e"
            steps={CREATOR_STEPS}
            cta="Create your profile"
            href="/register?role=CREATOR"
          />
        </div>
      </section>

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Still deciding?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Browse the marketplace before you sign up — creator profiles,
            audience sizes and rate ranges are public.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/marketplace">
              <button className="rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                Browse creators
              </button>
            </Link>
            <Link href="/pricing">
              <button className="rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                See pricing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
