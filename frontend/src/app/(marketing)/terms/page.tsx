import Link from "next/link";
import { PageHero, Prose, LastUpdated } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  path: "/terms",
  description:
    "The terms governing use of the InfluDubai AI platform by brands, agencies and creators.",
});

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms of Service" />
      <Prose>
        <LastUpdated date="5 August 2026" />

        <p>
          These terms govern your use of the InfluDubai AI platform. By creating
          an account you agree to them. If you are accepting on behalf of a
          company, you confirm you have authority to bind that company.
        </p>

        <h2>1. Who we are and what we do</h2>
        <p>
          InfluDubai AI operates a marketplace connecting brands and agencies
          with content creators, together with tools for campaign management,
          deliverable review, analytics and payment processing. We are a
          facilitator: the commercial agreement for any campaign is between the
          brand and the creator.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide accurate information and keep it current.</li>
          <li>
            You are responsible for activity under your account and for keeping
            your credentials secure.
          </li>
          <li>
            You must be at least 18 years old, or the age of majority in your
            jurisdiction, whichever is higher.
          </li>
          <li>
            One person or entity per account. Workspace seats exist for teams —
            do not share login credentials.
          </li>
        </ul>

        <h2>3. Creator obligations</h2>
        <ul>
          <li>
            Audience metrics you publish must be accurate and must not be
            artificially inflated through purchased followers or engagement.
          </li>
          <li>
            Deliverables must be your original work, must comply with applicable
            advertising disclosure rules, and must meet the agreed brief.
          </li>
          <li>
            You must comply with UAE advertising regulations, including
            influencer licensing requirements where they apply to you.
          </li>
        </ul>

        <h2>4. Brand obligations</h2>
        <ul>
          <li>
            Briefs must be lawful, accurate and must not require content that is
            misleading or that breaches platform policies.
          </li>
          <li>
            Rates agreed on a deliverable are binding once the creator begins
            work in reliance on them.
          </li>
          <li>
            Approval must not be unreasonably withheld. Where changes are
            requested, they must relate to the agreed brief.
          </li>
        </ul>

        <h2>5. Fees and payment</h2>
        <p>
          Subscription fees are billed in advance and are non-refundable except
          where required by law. We deduct a platform fee from creator payouts;
          the applicable percentage is displayed before work is accepted and is
          fixed at the time a payout is created. Payouts are released after a
          brand approves the relevant deliverable.
        </p>

        <h2>6. Intellectual property</h2>
        <p>
          Creators retain ownership of their content unless a campaign brief
          expressly assigns or licenses rights, in which case those terms apply.
          You grant us a limited licence to display your profile, portfolio and
          campaign content for the purpose of operating and promoting the
          platform.
        </p>

        <h2>7. Prohibited conduct</h2>
        <ul>
          <li>Misrepresenting audience size, engagement or identity.</li>
          <li>Circumventing the platform to avoid fees after being introduced through it.</li>
          <li>Scraping, reverse engineering, or automated bulk access.</li>
          <li>Harassment, discrimination, or unlawful content.</li>
        </ul>

        <h2>8. Suspension and termination</h2>
        <p>
          We may suspend or terminate an account that breaches these terms, that
          presents a fraud or security risk, or where required by law. You may
          close your account at any time from your settings; outstanding payout
          obligations survive closure.
        </p>

        <h2>9. Disclaimers and liability</h2>
        <p>
          The platform is provided &ldquo;as is&rdquo;. AI-generated insights,
          matching scores and fraud-risk indicators are decision-support signals,
          not guarantees, and should not be your only basis for a commercial
          decision. To the maximum extent permitted by law, our aggregate
          liability is limited to the fees you paid us in the twelve months
          preceding the claim.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the laws of the United Arab Emirates, and
          the courts of Dubai have exclusive jurisdiction.
        </p>

        <h2>11. Changes</h2>
        <p>
          We may update these terms. Material changes will be notified in-app or
          by email at least 14 days before taking effect. Continued use after
          that date constitutes acceptance.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <Link href="/contact">contact us</Link> or email
          legal@infludubai.com.
        </p>
      </Prose>
    </>
  );
}
