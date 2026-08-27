import "server-only";
import { SERVER_API_URL } from "./server-api";

/**
 * Server-side access to admin-editable website copy.
 *
 * Every value has a built-in fallback, so the site renders correctly even if
 * the API is unreachable — marketing pages must never go blank because a
 * content request failed.
 */



export type SiteContent = Record<string, string>;

/** Mirrors the backend catalog defaults for the keys the frontend reads. */
const FALLBACK: SiteContent = {
  "global.brandName": "InfluDubai AI",
  "global.tagline":
    "Creator intelligence and influencer marketing built for the UAE and wider MENA market.",
  "global.supportEmail": "hello@infludubai.com",
  "global.salesEmail": "sales@infludubai.com",
  "global.phone": "+971 54 318 6934",
  "global.whatsappUrl": "https://wa.me/971543186934",
  "global.address": "Dubai, United Arab Emirates",
  "global.footerNote": "Built for UAE & MENA creators and brands.",
  "pricing.currency": "AED",
  "pricing.period": "/month",
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${SERVER_API_URL}/content`, { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as SiteContent;
    return { ...FALLBACK, ...data };
  } catch {
    return FALLBACK;
  }
}

/** Reader with a per-call default, for keys not in the fallback map. */
export function reader(content: SiteContent) {
  return (key: string, fallback = ""): string => content[key] ?? fallback;
}

/** Splits a `list` field into trimmed, non-empty entries. */
export function toList(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Splits a `rows` field into columns. Rows with the wrong column count are
 * dropped rather than rendered half-empty — the admin API validates on save,
 * so this only guards against data written before a schema change.
 */
export function toRows(value: string | undefined, columns: number): string[][] {
  return toList(value)
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((cells) => cells.length === columns);
}
