import Link from "next/link";
import { Sparkles, Mail, MapPin } from "lucide-react";

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
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/case-studies", label: "Case studies" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/register?role=BRAND", label: "For brands" },
      { href: "/register?role=CREATOR", label: "For creators" },
      { href: "/register?role=AGENCY", label: "For agencies" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cookies", label: "Cookie policy" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">
                InfluDubai <span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Creator intelligence and influencer marketing built for the UAE
              and wider MENA market.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Dubai, United Arab Emirates
              </p>
              <a
                href="mailto:hello@infludubai.com"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> hello@infludubai.com
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
          <p>© {year} InfluDubai AI. All rights reserved.</p>
          <p>Built for UAE &amp; MENA creators and brands.</p>
        </div>
      </div>
    </footer>
  );
}
