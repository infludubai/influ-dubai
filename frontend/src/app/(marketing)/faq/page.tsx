import Link from "next/link";
import { PageHero } from "@/components/marketing/Prose";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  path: "/faq",
  description:
    "Answers on pricing, creator verification, payments, platform fees and how campaigns run on InfluDubai AI.",
});

const GROUPS: { title: string; items: { question: string; answer: string }[] }[] = [
  {
    title: "For brands",
    items: [
      {
        question: "How much does it cost to get started?",
        answer:
          "Creating an account, building a profile and browsing the marketplace are free. The Free plan covers one active campaign and five creator engagements; paid plans lift those limits and add analytics depth and team seats.",
      },
      {
        question: "How do you know a creator's audience is real?",
        answer:
          "Every creator profile carries a fraud-risk score derived from engagement-rate anomalies, follower-to-engagement ratios and growth patterns. Creators can additionally apply for manual verification, where our team checks platform insights against reported figures before granting a verified badge.",
      },
      {
        question: "What happens if a creator doesn't deliver?",
        answer:
          "Payment is tied to approval, not to the invitation. A payout is only created once you approve a deliverable, and you can request changes as many times as needed — each revision is kept as an auditable history.",
      },
      {
        question: "Can my whole team use one account?",
        answer:
          "Yes. Invite colleagues to your workspace with Admin, Member or Viewer roles. Seats are included with your plan. Agencies can run a separate workspace per client and switch between them.",
      },
    ],
  },
  {
    title: "For creators",
    items: [
      {
        question: "Does it cost anything to join?",
        answer:
          "No. Creating a profile, getting verified and receiving campaign invitations are free. We take a transparent platform fee from each payout, shown before you accept any work.",
      },
      {
        question: "How do I get verified?",
        answer:
          "Link at least one social account, then submit a verification request from your profile with supporting evidence such as platform insights screenshots. Our team reviews it, usually within one to two business days.",
      },
      {
        question: "When do I get paid?",
        answer:
          "A payout is queued the moment a brand approves your deliverable, with the net amount and platform fee shown up front. You can track pending and released payments on your Earnings page.",
      },
      {
        question: "Can I set my own rates?",
        answer:
          "Yes. Your profile carries a rate range, and each deliverable has an agreed rate confirmed before you start work.",
      },
    ],
  },
  {
    title: "Platform & data",
    items: [
      {
        question: "Which countries do you cover?",
        answer:
          "We're UAE-first with active coverage across the GCC and wider MENA region, including Saudi Arabia and Egypt. Creators outside the region can still join, but discovery is optimised for MENA audiences.",
      },
      {
        question: "Can I export or delete my data?",
        answer:
          "Yes. You can export everything we hold about you as JSON, or delete your account entirely, from your account settings at any time.",
      },
    ],
  },
];

export default function FaqPage() {
  const allItems = GROUPS.flatMap((g) => g.items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(allItems)) }}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        subtitle="If something isn't covered here, get in touch — we answer every message."
      />

      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {group.title}
              </h2>
              <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                {group.items.map((item) => (
                  <details key={item.question} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold transition-colors hover:bg-muted/40">
                      {item.question}
                      <span className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-semibold">Didn&apos;t find what you needed?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send us a message and we&apos;ll come back to you.
          </p>
          <Link href="/contact">
            <button className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
              Contact us
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
