import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2, Globe, MapPin, Megaphone, DollarSign, Tag, ArrowRight, Star,
} from "lucide-react";
import { SITE_URL, pageMetadata } from "@/lib/seo";
import type { BrandProfile, Review } from "@/lib/api";

// Brand profiles change independently of deploys, so render on demand.
export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api/v1";

async function getBrand(id: string): Promise<BrandProfile | null> {
  try {
    const res = await fetch(`${API_URL}/brands/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getReviews(id: string): Promise<Review[]> {
  try {
    const res = await fetch(`${API_URL}/brands/${id}/reviews`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) return pageMetadata({ title: "Brand not found", noIndex: true });

  return pageMetadata({
    title: `${brand.companyName} — brand profile`,
    description:
      brand.description ??
      `${brand.companyName} runs influencer campaigns on InfluDubai AI. See their open campaigns and creator reviews.`,
    path: `/brands/${brand.id}`,
  });
}

const TYPE_LABEL: Record<string, string> = {
  AWARENESS: "Awareness",
  ENGAGEMENT: "Engagement",
  LEAD_GENERATION: "Lead generation",
  SALES: "Sales",
};

function Stars({ value, count }: { value?: number | null; count?: number }) {
  if (value == null || !count) {
    return <span className="text-sm text-muted-foreground">No reviews yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold">{value.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({count} creator {count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

export default async function PublicBrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();

  const reviews = await getReviews(id);
  const openCampaigns = (brand.campaigns ?? []).filter(
    (c) => c.status === "ACTIVE",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.companyName,
    description: brand.description ?? undefined,
    url: brand.website ?? `${SITE_URL}/brands/${brand.id}`,
    logo: brand.logoUrl ?? undefined,
    ...(brand.ratingAvg && brand.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: brand.ratingAvg,
            reviewCount: brand.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-5 py-14">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoUrl}
                alt={`${brand.companyName} logo`}
                className="h-16 w-16 object-cover"
              />
            ) : (
              <Building2 className="h-7 w-7" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {brand.companyName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {brand.industry && (
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> {brand.industry}
                </span>
              )}
              {brand.country && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {brand.country}
                </span>
              )}
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
            </div>
            <div className="mt-2.5">
              <Stars value={brand.ratingAvg} count={brand.ratingCount} />
            </div>
          </div>
        </div>

        {brand.description && (
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
            {brand.description}
          </p>
        )}

        {/* Open campaigns */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Open campaigns
          </h2>
          {openCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <Megaphone className="mx-auto mb-2.5 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-semibold">
                No campaigns accepting applications right now
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Create a creator profile so {brand.companyName} can find you when
                they next brief a campaign.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {openCampaigns.map((c) => (
                <article key={c.id} className="rounded-2xl border bg-card p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {TYPE_LABEL[c.type] ?? c.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      {c.budgetUsd.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold">{c.title}</h3>
                  {c.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Creator reviews */}
        {reviews.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              What creators say about working with them
            </h2>
            <div className="divide-y overflow-hidden rounded-2xl border bg-card">
              {reviews.map((r) => (
                <div key={r.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {r.creatorProfile?.user?.profile?.displayName ?? "Creator"}
                    </p>
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.campaign?.title}
                  </p>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      “{r.comment}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-semibold">Want to work with brands like this?</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Build a verified creator profile and get discovered by UAE and MENA
            brands.
          </p>
          <Link href="/register?role=CREATOR">
            <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
              Create a creator profile <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
