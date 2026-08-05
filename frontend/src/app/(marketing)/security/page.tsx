import Link from "next/link";
import {
  Lock, KeyRound, Database, ScrollText, ServerCog, UserCheck, Mail,
} from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Security",
  path: "/security",
  description:
    "How InfluDubai AI protects accounts, payment data and administrator credentials — encryption, access control, auditing and data residency.",
});

const CONTROLS = [
  {
    icon: Lock,
    title: "Credentials",
    points: [
      "Passwords hashed with bcrypt — never stored or logged in plain text",
      "Access tokens are short-lived JWTs; refresh tokens are opaque, stored hashed, and rotate on every use",
      "Sign-in endpoints are rate limited to blunt credential-stuffing attempts",
    ],
  },
  {
    icon: KeyRound,
    title: "Administrator API keys",
    points: [
      "Third-party keys entered in the admin panel are encrypted with AES-256-GCM before storage",
      "The encryption key lives only in the process environment, never in the database",
      "Keys are masked in every API response — the full value is never returned to a browser",
      "GCM authentication tags mean tampering is detected rather than silently decrypted",
    ],
  },
  {
    icon: Database,
    title: "Payment data",
    points: [
      "Card details are handled entirely by our payment processor and never touch our servers",
      "Stripe webhooks are signature-verified; unverified webhooks are refused outright",
      "Payout records are immutable once marked paid, so the ledger cannot be quietly rewritten",
    ],
  },
  {
    icon: UserCheck,
    title: "Access control",
    points: [
      "Role-based access across creator, brand, agency and admin",
      "Workspace scoping enforced at the query layer, not in the interface",
      "Team seats carry granular roles — viewers cannot invite, members cannot touch billing",
      "Removing a team member revokes access immediately across every surface",
    ],
  },
  {
    icon: ScrollText,
    title: "Auditing",
    points: [
      "Security-relevant actions are written to an append-only audit log",
      "Settings changes record who and when — never the secret value itself",
      "Unhandled errors return a reference id instead of a stack trace, so diagnosis never requires leaking internals",
    ],
  },
  {
    icon: ServerCog,
    title: "Infrastructure",
    points: [
      "Hosted in the EU (Frankfurt) with encryption in transit throughout",
      "HSTS, X-Frame-Options, nosniff and a restrictive permissions policy on all responses",
      "Database migrations run at deploy time so schema and code never drift apart",
      "Health and readiness checks let a bad deploy fail fast instead of serving errors",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="How we protect your data"
        subtitle="A plain summary of the controls in place. If you need something more formal for a procurement review, get in touch."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTROLS.map((c) => (
            <div key={c.title} className="rounded-2xl border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-bold">{c.title}</h2>
              </div>
              <ul className="space-y-2">
                {c.points.map((p) => (
                  <li
                    key={p}
                    className="ml-4 list-disc text-sm leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Mail className="h-4 w-4 text-primary" /> Reporting a vulnerability
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            If you believe you have found a security issue, email{" "}
            <a
              href="mailto:security@infludubai.com"
              className="text-primary hover:underline"
            >
              security@infludubai.com
            </a>{" "}
            with enough detail to reproduce it. We aim to acknowledge within one
            business day and will keep you updated until it is resolved. Please
            do not publicly disclose an issue before we have had a chance to fix
            it, and please do not access, modify or delete data belonging to
            anyone other than yourself while testing.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
          This page describes controls that are implemented in the product today.
          It is not a certification claim — we do not currently hold SOC 2 or
          ISO 27001. If a formal attestation is required for your procurement
          process, contact us and we will tell you honestly where we stand.
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            See also our <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>{" "}
            and <Link href="/acceptable-use" className="text-primary hover:underline">acceptable use policy</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
