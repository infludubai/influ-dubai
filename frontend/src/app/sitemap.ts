import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { POSTS } from "@/lib/blog";

/**
 * Only public, indexable marketing routes belong here. Dashboard, admin and
 * auth pages are deliberately excluded — they're gated and would be crawl
 * waste at best, an information leak at worst.
 */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/for-brands", priority: 0.9, changeFrequency: "monthly" },
  { path: "/for-creators", priority: 0.9, changeFrequency: "monthly" },
  { path: "/for-agencies", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" },
  { path: "/marketplace", priority: 0.9, changeFrequency: "daily" },
  { path: "/campaigns", priority: 0.8, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/case-studies", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/security", priority: 0.5, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.5, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/acceptable-use", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Each post carries its own publish date so crawlers see real freshness
  // rather than every URL claiming to have changed at build time.
  const postRoutes = POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
