import Link from "next/link";
import { PageHero, Prose, LastUpdated } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  path: "/privacy",
  description:
    "What data InfluDubai AI collects, why, how long we keep it, and how to export or delete it.",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" />
      <Prose>
        <LastUpdated date="5 August 2026" />

        <p>
          This policy explains what personal data we collect, why we collect it,
          and what control you have over it. It applies to everyone who uses
          InfluDubai AI.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — name, email, password hash, role and
            account status.
          </li>
          <li>
            <strong>Profile data</strong> — for creators: bio, location,
            languages, categories, rate card, linked social handles and publicly
            reported audience metrics. For brands: company name, industry,
            website and logo.
          </li>
          <li>
            <strong>Campaign data</strong> — briefs, invitations, proposals,
            messages, deliverables and their revision history.
          </li>
          <li>
            <strong>Financial data</strong> — payout amounts, platform fees and
            payment status. Card details are handled by our payment processor
            and never reach our servers.
          </li>
          <li>
            <strong>Technical data</strong> — IP address and audit records of
            security-relevant actions such as sign-in and administrative changes.
          </li>
        </ul>

        <h2>2. Why we process it</h2>
        <ul>
          <li>To provide the service you signed up for (contract).</li>
          <li>
            To detect fraudulent or inauthentic audiences and protect brands from
            wasted spend (legitimate interest).
          </li>
          <li>To meet accounting, tax and anti-fraud obligations (legal obligation).</li>
          <li>
            To send optional product updates, where you have consented — you can
            withdraw at any time.
          </li>
        </ul>

        <h2>3. AI processing</h2>
        <p>
          Profile analysis, campaign matching and fraud scoring may be processed
          by a third-party large language model provider. We send only the
          profile and campaign fields needed for the analysis, never your
          password, payment details or private messages. These features are
          optional at the platform level and fall back to rule-based logic when
          disabled.
        </p>

        <h2>4. Who we share with</h2>
        <p>
          We do not sell personal data. We share it only with processors that
          help us run the service — cloud hosting, database and file storage,
          payment processing, email delivery and AI analysis — each bound by a
          data processing agreement. Public creator profiles are, by design,
          visible to anyone.
        </p>

        <h2>5. International transfers</h2>
        <p>
          Our infrastructure is hosted in the EU and the data is processed there
          and in the UAE. Where data moves outside these regions, we rely on
          standard contractual clauses or an equivalent safeguard.
        </p>

        <h2>6. How long we keep it</h2>
        <ul>
          <li>Account and profile data: while your account is open.</li>
          <li>
            Campaign, deliverable and payout records: seven years after
            completion, to meet financial record-keeping obligations.
          </li>
          <li>Audit logs: two years.</li>
          <li>
            After account deletion, remaining data is removed within 30 days
            except where retention is legally required.
          </li>
        </ul>

        <h2>7. Your rights</h2>
        <p>
          You can access, correct, export or delete your data. Export and
          deletion are available directly in your account settings — export
          returns everything we hold about you as JSON. You may also object to
          processing based on legitimate interest, or lodge a complaint with your
          local data protection authority.
        </p>

        <h2>8. Security</h2>
        <p>
          Passwords are hashed with bcrypt. Refresh tokens are stored hashed and
          rotate on use. API credentials configured by administrators are
          encrypted at rest with AES-256-GCM. Access to production data is
          restricted and audit-logged.
        </p>

        <h2>9. Cookies</h2>
        <p>
          We use strictly-necessary cookies for authentication, and optional
          analytics cookies only with your consent. See our{" "}
          <Link href="/cookies">cookie policy</Link>.
        </p>

        <h2>10. Contact</h2>
        <p>
          Privacy questions or requests: privacy@infludubai.com, or{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Prose>
    </>
  );
}
