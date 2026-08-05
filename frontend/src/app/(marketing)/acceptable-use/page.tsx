import Link from "next/link";
import { PageHero, Prose, LastUpdated } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Acceptable Use Policy",
  path: "/acceptable-use",
  description:
    "What is and isn't allowed on InfluDubai AI, and what happens when the rules are broken.",
});

export default function AcceptableUsePage() {
  return (
    <>
      <PageHero title="Acceptable Use Policy" />
      <Prose>
        <LastUpdated date="5 August 2026" />

        <p>
          This policy sits alongside our{" "}
          <Link href="/terms">Terms of Service</Link> and sets out what is not
          allowed on the platform. It applies to everyone — creators, brands,
          agencies and their team members.
        </p>

        <h2>1. Audience integrity</h2>
        <p>
          The value of this marketplace rests entirely on audience metrics being
          honest. The following will result in removal:
        </p>
        <ul>
          <li>Purchasing followers, likes, views, comments or saves</li>
          <li>Using engagement pods or reciprocal-engagement schemes</li>
          <li>Editing or fabricating platform insights screenshots</li>
          <li>Misrepresenting audience geography, age or gender breakdown</li>
          <li>Operating multiple creator profiles for the same person</li>
        </ul>

        <h2>2. Content standards</h2>
        <p>Content produced or published through the platform must not:</p>
        <ul>
          <li>Breach UAE advertising, media or content regulations</li>
          <li>Omit required paid-partnership disclosure</li>
          <li>Make health, financial or performance claims that cannot be substantiated</li>
          <li>Infringe anyone&apos;s copyright, trademark or likeness rights</li>
          <li>Contain hate speech, harassment, or sexual content involving minors</li>
          <li>Promote illegal goods or services</li>
        </ul>

        <h2>3. Commercial conduct</h2>
        <ul>
          <li>
            Do not circumvent the platform to avoid fees after being introduced
            through it.
          </li>
          <li>
            Do not agree a rate and then withhold delivery to renegotiate it.
          </li>
          <li>
            Do not withhold approval of work that meets the agreed brief in
            order to avoid paying for it.
          </li>
          <li>
            Do not leave reviews in exchange for payment, discounts or
            reciprocal ratings.
          </li>
        </ul>

        <h2>4. Platform integrity</h2>
        <ul>
          <li>No scraping, crawling or automated bulk extraction of profiles</li>
          <li>No reverse engineering, or probing for vulnerabilities outside our disclosure process</li>
          <li>No sharing login credentials — use team seats instead</li>
          <li>No uploading malware, or content designed to compromise other users</li>
          <li>No attempting to access workspaces, campaigns or messages you were not granted access to</li>
        </ul>

        <h2>5. Reporting a violation</h2>
        <p>
          If you encounter any of the above, email abuse@infludubai.com with the
          profile or campaign involved and any evidence you have. Reports are
          reviewed by a human, and the reporter&apos;s identity is not shared
          with the reported party.
        </p>

        <h2>6. Enforcement</h2>
        <p>
          Depending on severity and history, we may issue a warning, remove
          content, withhold a payout pending investigation, suspend an account,
          or terminate it permanently. Audience-integrity violations and
          anything involving minors are grounds for immediate termination
          without warning.
        </p>
        <p>
          Where a payout is withheld pending investigation, we will tell you why
          and give you a chance to respond before any final decision.
        </p>

        <h2>7. Appeals</h2>
        <p>
          If you believe an enforcement decision was wrong, reply to the
          notification you received or{" "}
          <Link href="/contact">contact us</Link>. Appeals are reviewed by
          someone who was not involved in the original decision.
        </p>
      </Prose>
    </>
  );
}
