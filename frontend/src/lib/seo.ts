import type { Metadata } from "next";

/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL in the Vercel project —
 * without it, canonical tags and OG image URLs point at localhost, which
 * silently breaks link previews and canonicalisation in production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"
).replace(/\/$/, "");

export const SITE_NAME = "InfluDubai AI";

export const DEFAULT_DESCRIPTION =
  "Discover verified UAE and MENA creators, run influencer campaigns end to end, and measure real ROI — with AI matching and fraud detection built in.";

/**
 * Builds per-page metadata with sensible OG/Twitter defaults so every route
 * produces a decent link preview instead of inheriting one generic card.
 */
export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
  image = "/og.png",
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === "/" ? title : `${title} · ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: "en_AE",
      images: [{ url: `${SITE_URL}${image}`, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${SITE_URL}${image}`],
    },
  };
}

/** Organisation JSON-LD, rendered once in the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    sameAs: [] as string[],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}
