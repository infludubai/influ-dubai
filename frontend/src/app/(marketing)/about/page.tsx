import Link from "next/link";
import { Globe, ShieldCheck, Sparkles, Target, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  path: "/about",
  description:
    "Why InfluDubai AI exists: a MENA-first influencer marketing platform built around verified audiences, transparent pricing and measurable outcomes.",
});

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Authenticity over vanity",
    body: "Follower counts are easy to buy. We score engagement quality and growth patterns, and put a fraud-risk signal in front of brands before they commit budget.",
  },
  {
    icon: Globe,
    title: "Built for this region",
    body: "Arabic and English audiences, Gulf market context, UAE-first launch. Not a Western platform with a currency toggle bolted on.",
  },
  {
    icon: Target,
    title: "Outcomes, not impressions",
    body: "Campaigns are broken into deliverables with agreed rates. Approval releases payment. Analytics tie spend back to reach, engagement and return.",
  },
  {
    icon: Sparkles,
    title: "AI where it earns its place",
    body: "Matching, profile analysis and fraud scoring use AI — but every one degrades to rule-based logic. The platform works when the model isn't available.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Influencer marketing the region can actually trust"
        subtitle="The UAE creator economy grew faster than the tooling around it. Brands still source creators through DMs and spreadsheets, and still can't tell a real audience from a purchased one."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            InfluDubai AI was built to close that gap. Brands and agencies get a
            searchable, vetted marketplace of UAE and MENA creators, AI-assisted
            matching against a real brief, and a workflow that carries a campaign
            from invitation through deliverable approval to payout.
          </p>
          <p>
            Creators get something equally overdue: a professional profile that
            surfaces them to serious buyers, a verification badge that means
            something, clear rates agreed up front, and payment that is released
            automatically when work is approved — not sixty days later after a
            chase.
          </p>
          <p>
            We take a transparent platform fee on creator payouts and offer
            subscription tiers for teams that need more campaigns, seats and
            analytics depth. There are no hidden markups on creator rates.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-sm font-bold">{v.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Work with us
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Whether you&apos;re running campaigns or creating the content,
            it&apos;s free to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register?role=BRAND">
              <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
                I&apos;m a brand <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/register?role=CREATOR">
              <button className="rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                I&apos;m a creator
              </button>
            </Link>
            <Link href="/contact">
              <button className="rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                Talk to us
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
