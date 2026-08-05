import Link from "next/link";
import { Sparkles, Mail, MapPin } from "lucide-react";
import { getSiteContent } from "@/lib/content";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { href: "/marketplace", label: "Creator marketplace" },
      { href: "/campaigns", label: "Open campaigns" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/for-brands", label: "For brands" },
      { href: "/for-creators", label: "For creators" },
      { href: "/for-agencies", label: "For agencies" },
      { href: "/case-studies", label: "Case studies" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/acceptable-use", label: "Acceptable use" },
      { href: "/security", label: "Security" },
    ],
  },
];

/** Server component so brand and contact details come from Admin → Content. */
export async function SiteFooter() {
  const c = await getSiteContent();
  const year = new Date().getFullYear();
  const brand = c["global.brandName"];

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">{brand}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {c["global.tagline"]}
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {c["global.address"]}
              </p>
              <a
                href={`mailto:${c["global.supportEmail"]}`}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> {c["global.supportEmail"]}
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground">
          <p>
            © {year} {brand}. All rights reserved.
          </p>
          <p>{c["global.footerNote"]}</p>
        </div>
      </div>
    </footer>
  );
}
