import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const wireframes = [
  {
    href: "/wireframes/homepage",
    title: "Homepage",
    description: "Public marketing page: hero, search, categories, how-it-works, featured creators.",
  },
  {
    href: "/wireframes/creator-dashboard",
    title: "Creator Dashboard",
    description: "Creator's home: profile completion, stats, campaign invites, messages, performance.",
  },
  {
    href: "/wireframes/brand-dashboard",
    title: "Brand Dashboard",
    description: "Brand/agency home: campaign stats, recommended creators, recent activity.",
  },
  {
    href: "/wireframes/marketplace",
    title: "Marketplace",
    description: "Creator discovery: filters, search, sortable/filterable creator grid.",
  },
  {
    href: "/wireframes/campaigns",
    title: "Campaign Management",
    description: "Single campaign view: brief, budget/timeline, invited creators, deliverables.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 space-y-3">
        <Badge variant="secondary">Phase 1 — Discovery &amp; System Architecture</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">InfluDubai AI</h1>
        <p className="max-w-2xl text-muted-foreground">
          Low-fidelity wireframes for the five core screens defined in Phase 1.
          These are structural layouts, not final visual design — purpose is to
          validate information architecture and user flows before Phase 2 build.
          Written deliverables (business requirements &amp; system architecture)
          live in <code className="rounded bg-muted px-1 py-0.5 text-sm">/docs</code>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {wireframes.map((w) => (
          <Link key={w.href} href={w.href}>
            <Card className="h-full transition-colors hover:border-foreground/40">
              <CardHeader>
                <CardTitle>{w.title}</CardTitle>
                <CardDescription>{w.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-muted-foreground">
                View wireframe →
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Next steps</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Review wireframes &amp; flag changes to layout/IA.</li>
          <li>Review <code className="rounded bg-muted px-1 py-0.5">docs/01-business-requirements.md</code></li>
          <li>Review <code className="rounded bg-muted px-1 py-0.5">docs/02-architecture.md</code></li>
          <li>Approve to proceed to Phase 2 (auth, onboarding, real pages).</li>
        </ul>
      </div>
    </main>
  );
}
