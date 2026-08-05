import Link from "next/link";
import { MapPin, Clock, ArrowRight, Heart, Zap, Globe2, Scale } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Careers",
  path: "/careers",
  description:
    "Join InfluDubai AI — building the creator economy infrastructure for the UAE and MENA. Open roles in engineering, growth and creator operations.",
});

const VALUES = [
  {
    icon: Zap,
    title: "Ship, then refine",
    body: "We would rather put something real in front of a creator this week than perfect it in a doc for a month.",
  },
  {
    icon: Heart,
    title: "Both sides matter",
    body: "A marketplace fails the moment one side is treated as inventory. Creators are customers, not supply.",
  },
  {
    icon: Globe2,
    title: "Regional by default",
    body: "Arabic and English, Gulf market context, local regulation. Not a Western product with a currency switcher.",
  },
  {
    icon: Scale,
    title: "Honest numbers",
    body: "We publish real fee percentages and real fraud signals. If a metric flatters us but misleads a customer, it doesn't ship.",
  },
];

const ROLES = [
  {
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Dubai / Remote (GST ±3)",
    type: "Full-time",
    summary:
      "TypeScript across NestJS and Next.js. You'll own features end to end, from Prisma schema through to the interface a creator actually touches.",
  },
  {
    title: "Creator Operations Lead",
    team: "Operations",
    location: "Dubai",
    type: "Full-time",
    summary:
      "Own creator verification and quality. You'll review audience authenticity, shape the vetting bar, and be the human creators talk to.",
  },
  {
    title: "Growth Marketer — MENA",
    team: "Growth",
    location: "Dubai / Remote",
    type: "Full-time",
    summary:
      "Bilingual Arabic/English. Own acquisition on both sides of the marketplace, from SEO and content through to brand partnerships.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote (GST ±3)",
    type: "Contract",
    summary:
      "Interface design for a product used daily by creators, brand marketers and agency teams — three very different levels of tolerance for complexity.",
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build the infrastructure the regional creator economy is missing"
        subtitle="Small team, early stage, based in Dubai. If you want scope and would rather own an area than a ticket queue, this is the right size of company."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          How we work
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mb-6 mt-14 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Open roles
        </h2>
        <div className="space-y-3">
          {ROLES.map((r) => (
            <article
              key={r.title}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                    {r.team}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {r.type}
                  </span>
                </div>
                <h3 className="text-base font-bold">{r.title}</h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {r.summary}
                </p>
              </div>
              <a
                href={`mailto:careers@infludubai.com?subject=${encodeURIComponent(
                  `Application: ${r.title}`,
                )}`}
                className="shrink-0"
              >
                <button className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted">
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-semibold">Nothing quite fits?</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            We read speculative applications properly. Tell us what you would
            own and why it matters for this market.
          </p>
          <a href="mailto:careers@infludubai.com">
            <button className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
              careers@infludubai.com
            </button>
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          We hire without regard to nationality, gender, age, religion or
          disability. If you need an adjustment at any stage of the process,{" "}
          <Link href="/contact" className="text-primary hover:underline">
            tell us
          </Link>{" "}
          and we&apos;ll make it.
        </p>
      </section>
    </>
  );
}
