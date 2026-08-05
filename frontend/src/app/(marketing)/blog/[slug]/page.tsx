import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, ArrowRight } from "lucide-react";
import { POSTS, getPost, formatDate, sortedPosts } from "@/lib/blog";
import { SITE_URL, pageMetadata } from "@/lib/seo";

// Every post is known at build time, so pre-render them all.
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return pageMetadata({ title: "Post not found", noIndex: true });

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = sortedPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author.name },
    publisher: { "@type": "Organization", name: "InfluDubai AI" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-5 py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> All posts
        </Link>

        <header className="mt-6 border-b pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {post.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min read
            </span>
            <span>{post.author.name}</span>
          </div>
        </header>

        <div className="mt-8 space-y-5">
          {post.body.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="!mt-10 text-xl font-bold tracking-tight">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-2 pl-5">
                  {block.items.map((item) => (
                    <li
                      key={item}
                      className="list-disc text-[15px] leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote
                  key={i}
                  className="!my-8 border-l-2 border-primary/40 bg-primary/5 px-5 py-4 text-[15px] font-medium italic leading-relaxed"
                >
                  {block.text}
                </blockquote>
              );
            }
            return (
              <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                {block.text}
              </p>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-semibold">Put this into practice</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Fraud scoring, agreed rates and structured briefs are built into the
            platform — free to start.
          </p>
          <Link href="/register?role=BRAND">
            <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {others.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Keep reading
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                  <div className="h-full rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {p.category}
                    </p>
                    <p className="mt-1.5 font-bold leading-snug transition-colors group-hover:text-primary">
                      {p.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
