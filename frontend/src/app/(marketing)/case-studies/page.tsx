import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Target } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Case studies",
  path: "/case-studies",
  description:
    "Illustrative campaign scenarios showing how brands use InfluDubai AI across retail, F&B and travel in the UAE.",
});

const STUDIES = [
  {
    sector: "Retail & fashion",
    title: "Ramadan capsule launch across 12 micro-creators",
    challenge:
      "A UAE fashion label needed regional reach for a two-week Ramadan drop without the cost of a single macro-influencer.",
    approach:
      "Filtered the marketplace to Dubai and Abu Dhabi creators in fashion and lifestyle with 20K–80K followers and above-average engagement, then used AI matching to rank them against the brief. Fraud scoring removed three profiles with anomalous engagement before any budget was committed.",
    outcome: [
      { metric: "12", label: "creators engaged" },
      { metric: "1.4M", label: "combined reach" },
      { metric: "4.8%", label: "average engagement" },
    ],
  },
  {
    sector: "Food & beverage",
    title: "New delivery category, launched in one week",
    challenge:
      "A delivery platform was adding a new cuisine category and wanted authentic local coverage fast, in both Arabic and English.",
    approach:
      "Posted an open campaign so creators applied directly rather than being cold-invited. Deliverables were split into one reel plus two stories each, with rates agreed up front and deadlines tracked in-platform.",
    outcome: [
      { metric: "6 days", label: "brief to live content" },
      { metric: "31", label: "deliverables approved" },
      { metric: "2", label: "languages covered" },
    ],
  },
  {
    sector: "Travel & hospitality",
    title: "Agency running four hotel clients from one login",
    challenge:
      "A Dubai agency managed influencer programmes for four hospitality clients and was losing time to separate spreadsheets and inboxes per client.",
    approach:
      "Each client became its own workspace with separate campaigns, creators and budgets. Account managers were invited with scoped roles, and the agency switched between clients without logging out.",
    outcome: [
      { metric: "4", label: "client workspaces" },
      { metric: "1", label: "shared review queue" },
      { metric: "70%", label: "less admin time" },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Case studies"
        title="How campaigns run in practice"
        subtitle="Representative scenarios drawn from common UAE campaign patterns, showing how the platform is used end to end."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
          These are illustrative scenarios showing platform capability, not
          audited results from named clients. Figures are representative of
          typical campaigns in these categories.
        </div>

        <div className="space-y-6">
          {STUDIES.map((s) => (
            <article key={s.title} className="rounded-2xl border bg-card p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {s.sector}
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">{s.title}</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Target className="h-3.5 w-3.5" /> Challenge
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.challenge}
                  </p>
                </div>
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Approach
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.approach}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t pt-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" /> Outcome
                </h3>
                <div className="flex flex-wrap gap-8">
                  {s.outcome.map((o) => (
                    <div key={o.label}>
                      <p className="text-2xl font-bold tracking-tight">{o.metric}</p>
                      <p className="text-xs text-muted-foreground">{o.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight">
            Run your own campaign
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start free — build a brief, see matched creators, and only commit
            budget when you&apos;re ready.
          </p>
          <Link href="/register?role=BRAND">
            <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
