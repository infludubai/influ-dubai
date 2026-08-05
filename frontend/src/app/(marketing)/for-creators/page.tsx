import {
  BadgeCheck, Wallet, Megaphone, LineChart, MessagesSquare, FileText,
} from "lucide-react";
import {
  SegmentHero, StatBand, FeatureGrid, CheckList, Quote, CTASection,
} from "@/components/marketing/Sections";
import { pageMetadata } from "@/lib/seo";

const ACCENT = "#0f766e";

export const metadata = pageMetadata({
  title: "For creators",
  path: "/for-creators",
  description:
    "Get discovered by UAE and MENA brands, set your own rates, and get paid automatically when your work is approved. Free to join.",
});

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "A badge that means something",
    body: "Verification is a real review of your platform insights, not a paid tick. Verified profiles rank higher and convert far better with serious buyers.",
  },
  {
    icon: Megaphone,
    title: "Inbound, not cold outreach",
    body: "Brands find you through search and AI recommendations. You can also apply directly to open briefs that actually fit your niche.",
  },
  {
    icon: Wallet,
    title: "Paid on approval",
    body: "A payout is queued the moment a brand approves your work, with the platform fee shown up front. No invoices, no sixty-day chases.",
  },
  {
    icon: FileText,
    title: "Rates agreed in writing",
    body: "Every deliverable carries an agreed rate and deadline before you start. The brief, your submission and their feedback all live in one thread.",
  },
  {
    icon: LineChart,
    title: "Know your own numbers",
    body: "See how your audience, engagement and earnings trend over time — and use AI insights to understand how brands read your profile.",
  },
  {
    icon: MessagesSquare,
    title: "Talk directly to brands",
    body: "In-platform messaging keeps negotiation on the record, so what was agreed is never a matter of memory.",
  },
];

export default function ForCreatorsPage() {
  return (
    <>
      <SegmentHero
        accent={ACCENT}
        eyebrow="For creators"
        title={
          <>
            Get discovered. Get paid.
            <br className="hidden sm:block" /> Without the chasing.
          </>
        }
        subtitle="Build a professional profile, get verified, and let UAE and MENA brands come to you — with rates agreed up front and payment released the moment your work is approved."
        primary={{ label: "Join free", href: "/register?role=CREATOR" }}
        secondary={{ label: "See open campaigns", href: "/campaigns" }}
      />

      <StatBand
        stats={[
          { value: "Free", label: "to join and get verified" },
          { value: "5", label: "platforms you can link" },
          { value: "0", label: "invoices to chase" },
          { value: "1–2 days", label: "typical verification time" },
        ]}
      />

      <FeatureGrid
        accent={ACCENT}
        title="Built around how creators actually work"
        subtitle="The admin side of brand deals is the part nobody signed up for. This handles it."
        features={FEATURES}
      />

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <CheckList
              accent={ACCENT}
              title="What's free, always"
              items={[
                "Creating and hosting your profile",
                "Linking your social accounts",
                "Applying for verification",
                "Receiving campaign invitations",
                "Applying to open briefs",
                "In-platform messaging with brands",
              ]}
            />
            <CheckList
              accent={ACCENT}
              title="How payment works"
              items={[
                "You agree a rate per deliverable before starting",
                "You submit your published content for review",
                "The brand approves, or asks for one clear revision",
                "Approval instantly queues your payout",
                "The platform fee is shown before you accept anything",
                "Track pending and released payments on your Earnings page",
              ]}
            />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Quote
              quote="The analytics helped me understand my own audience well enough to raise my rates — and actually justify it."
              name="Lifestyle creator"
              role="Dubai, 84K followers"
            />
            <Quote
              quote="Getting verified changed the quality of the briefs I receive. Fewer messages, better ones."
              name="Food creator"
              role="Abu Dhabi, 31K followers"
            />
          </div>
        </div>
      </section>

      <CTASection
        accent={ACCENT}
        title="Your next brand deal starts here"
        subtitle="Set up your profile in under ten minutes. It's free, and it stays free."
        primary={{ label: "Create a creator profile", href: "/register?role=CREATOR" }}
        secondary={{ label: "How it works", href: "/how-it-works" }}
      />
    </>
  );
}
