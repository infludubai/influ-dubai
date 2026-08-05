import Link from "next/link";
import { Megaphone, MapPin, Tag, DollarSign, ArrowRight, Building2 } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Open campaigns",
  path: "/campaigns",
  description:
    "Browse live influencer campaigns from UAE and MENA brands. Creators can apply directly with a proposal and rate.",
});

// Server-rendered against the public campaigns endpoint. Kept dynamic so the
// list reflects what brands published rather than a stale build snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api/v1";

type PublicCampaign = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  budgetUsd: number;
  targetLocations: string[];
  targetCategories: string[];
  deadline: string | null;
  brand?: { companyName: string; logoUrl: string | null };
};

const TYPE_LABEL: Record<string, string> = {
  AWARENESS: "Awareness",
  ENGAGEMENT: "Engagement",
  LEAD_GENERATION: "Lead generation",
  SALES: "Sales",
};

async function getCampaigns(): Promise<PublicCampaign[]> {
  try {
    const res = await fetch(`${API_URL}/campaigns?limit=24`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    // The endpoint may return a bare array or a paginated envelope.
    return Array.isArray(data) ? data : (data.items ?? data.campaigns ?? []);
  } catch {
    // The marketing page must still render if the API is briefly unavailable.
    return [];
  }
}

export default async function OpenCampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <>
      <PageHero
        eyebrow="Open campaigns"
        title="Live briefs from UAE & MENA brands"
        subtitle="Campaigns currently accepting creator applications. Sign in as a creator to apply with your rate and a short pitch."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <Megaphone className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-semibold">No open campaigns right now</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              New briefs are posted regularly. Create a creator profile so brands
              can find you in the meantime.
            </p>
            <Link href="/register?role=CREATOR">
              <button className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
                Create your profile
              </button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              {campaigns.length} open {campaigns.length === 1 ? "campaign" : "campaigns"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {campaigns.map((c) => (
                <article
                  key={c.id}
                  className="flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {TYPE_LABEL[c.type] ?? c.type}
                    </span>
                    {c.brand?.companyName && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {c.brand.companyName}
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold leading-snug">{c.title}</h2>
                  {c.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      {c.budgetUsd.toLocaleString()}
                    </span>
                    {c.targetLocations?.[0] && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {c.targetLocations[0]}
                      </span>
                    )}
                    {c.targetCategories?.[0] && (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> {c.targetCategories[0]}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/register?role=CREATOR"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Apply as a creator <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
