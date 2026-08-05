import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PageHero } from "@/components/marketing/Prose";
import { sortedPosts, formatDate } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog",
  path: "/blog",
  description:
    "Practical guidance on influencer marketing in the UAE and MENA — spotting fake audiences, setting rates, and writing briefs that don't spiral.",
});

export default function BlogIndexPage() {
  const posts = sortedPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notes on influencer marketing that actually works"
        subtitle="Practical, region-specific guidance for brands and creators working in the UAE and wider MENA market."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block">
            <article className="overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-2.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  Latest
                </span>
                <span className="text-xs text-muted-foreground">
                  {featured.category}
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-primary">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                  {featured.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <time dateTime={featured.publishedAt}>
                    {formatDate(featured.publishedAt)}
                  </time>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {featured.readingMinutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <article className="flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {post.category}
                  </p>
                  <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
