import Link from "next/link";
import { PageHero, Prose, LastUpdated } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie Policy",
  path: "/cookies",
  description:
    "The cookies and local storage InfluDubai AI uses, what each is for, and how to change your choice.",
});

const COOKIES = [
  {
    name: "Session / auth tokens",
    type: "Strictly necessary",
    purpose:
      "Keeps you signed in and authorises API requests. The site cannot function without these.",
    duration: "Access token 15 minutes; refresh token 30 days",
  },
  {
    name: "infludubai.cookie-consent",
    type: "Strictly necessary",
    purpose: "Remembers your cookie choice so we stop asking.",
    duration: "12 months",
  },
  {
    name: "theme",
    type: "Preference",
    purpose: "Remembers whether you chose light or dark mode.",
    duration: "12 months",
  },
  {
    name: "Analytics",
    type: "Optional",
    purpose:
      "Aggregated, non-identifying usage measurement to improve the product. Only set if you accept.",
    duration: "Up to 24 months",
  },
];

export default function CookiesPage() {
  return (
    <>
      <PageHero title="Cookie Policy" />
      <Prose>
        <LastUpdated date="5 August 2026" />

        <p>
          We use a small number of cookies and browser storage entries. Nothing
          beyond what is strictly necessary is set unless you actively accept.
        </p>

        <h2>What we use</h2>
        <div className="not-prose overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-4 py-3 text-xs font-semibold">Name</th>
                <th className="px-4 py-3 text-xs font-semibold">Type</th>
                <th className="px-4 py-3 text-xs font-semibold">Purpose</th>
                <th className="px-4 py-3 text-xs font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {COOKIES.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">{c.purpose}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Changing your mind</h2>
        <p>
          Clearing this site&apos;s data in your browser will reset your choice
          and the consent banner will appear again. You can also block cookies
          entirely in your browser settings, though sign-in will stop working.
        </p>

        <h2>Third parties</h2>
        <p>
          We do not run third-party advertising or tracking pixels. Payment pages
          hosted by our payment processor set their own cookies under their own
          policy.
        </p>

        <h2>More information</h2>
        <p>
          See our <Link href="/privacy">privacy policy</Link> for how we handle
          personal data, or <Link href="/contact">get in touch</Link>.
        </p>
      </Prose>
    </>
  );
}
