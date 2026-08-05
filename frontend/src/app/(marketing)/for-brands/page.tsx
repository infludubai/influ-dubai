import {
  Search, ShieldCheck, Sparkles, ClipboardList, BarChart3, Wallet,
} from "lucide-react";
import {
  SegmentHero, StatBand, FeatureGrid, CheckList, Quote, CTASection,
} from "@/components/marketing/Sections";
import { pageMetadata } from "@/lib/seo";

const ACCENT = "#7c3aed";

export const metadata = pageMetadata({
  title: "For brands",
  path: "/for-brands",
  description:
    "Find verified UAE and MENA creators, vet their audiences before you spend, and run campaigns from brief to payout in one platform.",
});

const FEATURES = [
  {
    icon: Search,
    title: "Search that respects a brief",
    body: "Filter by niche, city, follower band, engagement rate, language and budget — then narrow further with AI ranking against your actual campaign objective.",
  },
  {
    icon: ShieldCheck,
    title: "Vet before you spend",
    body: "Every creator carries a fraud-risk score built from engagement anomalies and follower-growth patterns, so bought audiences surface before the budget does.",
  },
  {
    icon: Sparkles,
    title: "AI shortlisting",
    body: "Paste your brief and get a ranked shortlist with the reasoning behind each match and a suggested rate range.",
  },
  {
    icon: ClipboardList,
    title: "Deliverables, not vibes",
    body: "Break a campaign into concrete pieces of work with rates and deadlines. Creators submit, you approve or request changes — with full revision history.",
  },
  {
    icon: BarChart3,
    title: "ROI you can defend",
    body: "Reach, engagement, conversions and cost-per-engagement per campaign and per creator, ready to put in front of a CFO.",
  },
  {
    icon: Wallet,
    title: "Payment tied to approval",
    body: "A payout is only created when you approve work. No prepaying, no chasing, no invoices lost in an inbox.",
  },
];

export default function ForBrandsPage() {
  return (
    <>
      <SegmentHero
        accent={ACCENT}
        eyebrow="For brands"
        title={
          <>
            Stop guessing which creators
            <br className="hidden sm:block" /> are worth the budget
          </>
        }
        subtitle="Search vetted UAE and MENA creators, check audience authenticity before you commit, and run the whole campaign — brief, deliverables, approval, payment — in one place."
        primary={{ label: "Start free", href: "/register?role=BRAND" }}
        secondary={{ label: "Browse creators", href: "/marketplace" }}
      />

      <StatBand
        stats={[
          { value: "7", label: "search filters" },
          { value: "5", label: "platforms covered" },
          { value: "0%", label: "markup on creator rates" },
          { value: "Free", label: "to start" },
        ]}
      />

      <FeatureGrid
        accent={ACCENT}
        title="Everything a campaign actually needs"
        subtitle="Built around the way influencer campaigns really run, not the way a generic CRM assumes they do."
        features={FEATURES}
      />

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <CheckList
              accent={ACCENT}
              title="What you get on day one"
              items={[
                "Full marketplace search across verified creators",
                "Fraud-risk scoring on every profile you view",
                "Campaign briefs with budget, audience and deliverables",
                "Invitations, proposals and in-platform messaging",
                "Shortlists your whole team can see",
                "Deliverable review queue with revision history",
              ]}
            />
            <CheckList
              accent={ACCENT}
              title="What you stop dealing with"
              items={[
                "Spreadsheets tracking who agreed to what",
                "DM threads as your only record of a deal",
                "Paying upfront and hoping the content lands",
                "Creators chasing you for invoice status",
                "Screenshot-based reporting at the end of a quarter",
                "Discovering a bought audience after the fact",
              ]}
            />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Quote
              quote="The fraud detection paid for itself on the first campaign — we dropped two creators whose engagement didn't hold up."
              name="Marketing Director"
              role="UAE retail group"
            />
            <Quote
              quote="Having the brief, the deliverables and the approval trail in one place ended the 'who agreed to what' argument entirely."
              name="Head of Brand"
              role="Regional F&B chain"
            />
          </div>
        </div>
      </section>

      <CTASection
        accent={ACCENT}
        title="Run your first campaign free"
        subtitle="No card required. Build a brief, see who matches, and only commit budget when you're ready."
        primary={{ label: "Create a brand account", href: "/register?role=BRAND" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}
