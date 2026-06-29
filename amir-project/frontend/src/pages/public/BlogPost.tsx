import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight } from 'lucide-react'
import PageLoader from '@/components/shared/PageLoader'
import { publicApi } from '@/api/public'
import { assetUrl } from '@/utils/assets'

function readTime(html: string) {
  const words = html.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function fixImageUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  // Already a full URL — pass through assetUrl to fix localhost
  if (/^https?:\/\//.test(raw)) return assetUrl(raw)
  // Relative path that already starts with /storage/
  if (raw.startsWith('/storage/')) return assetUrl(raw)
  // Plain filename or partial path — prepend /storage/
  return assetUrl('/storage/' + raw.replace(/^\//, ''))
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<any[]>([])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    publicApi.blogPost(slug)
      .then(r => {
        const p = r.data.data
        setPost(p)
        // Load related posts from same category
        publicApi.blog({ category: p?.category?.slug, per_page: '3' })
          .then(r2 => setRelated((r2.data.data ?? []).filter((x: any) => x.slug !== slug).slice(0, 3)))
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="pt-20"><PageLoader /></div>
  if (!post) return (
    <div className="pt-32 pb-24 text-center">
      <p className="text-muted-foreground mb-4">Post not found.</p>
      <Link to="/blog" className="text-primary hover:underline font-medium">← Back to Blog</Link>
    </div>
  )

  const featuredImage = fixImageUrl(post.featured_image)
  const mins = readTime(post.body || '')

  return (
    <div className="bg-background">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className={`pt-28 pb-12 ${featuredImage ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-950 to-slate-900'}`}>
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>

          {post.category && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/15 px-3 py-1 rounded-full mb-4 border border-primary/20">
              {post.category.name}
            </span>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-5"
          >
            {post.title}
          </motion.h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/45">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {post.author && (
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-white text-[10px] font-bold">
                  {post.author.name?.[0]}
                </div>
                <span>by <span className="text-white/70 font-medium">{post.author.name}</span></span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {mins} min read
            </span>
          </div>
        </div>
      </div>

      {/* ── Featured image ─────────────────────────────────────────── */}
      {featuredImage && (
        <div className="container mx-auto px-4 max-w-4xl -mt-6 mb-0">
          <img
            src={featuredImage}
            alt={post.title}
            className="w-full rounded-2xl shadow-2xl shadow-black/20 aspect-[2/1] object-cover border border-slate-200"
          />
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-3xl py-14">
        <div
          className="
            text-foreground/80 leading-relaxed text-[17px]
            [&>h1]:font-heading [&>h1]:font-bold [&>h1]:text-3xl [&>h1]:text-foreground [&>h1]:mt-10 [&>h1]:mb-4
            [&>h2]:font-heading [&>h2]:font-bold [&>h2]:text-2xl [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-3
            [&>h3]:font-heading [&>h3]:font-bold [&>h3]:text-xl [&>h3]:text-foreground [&>h3]:mt-8 [&>h3]:mb-3
            [&>h4]:font-heading [&>h4]:font-semibold [&>h4]:text-lg [&>h4]:text-foreground [&>h4]:mt-6 [&>h4]:mb-2
            [&>p]:mb-5 [&>p]:leading-8
            [&>ul]:mb-5 [&>ul]:pl-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul>li]:text-foreground/80 [&>ul>li]:leading-7
            [&>ol]:mb-5 [&>ol]:pl-6 [&>ol]:list-decimal [&>ol]:space-y-2 [&>ol>li]:text-foreground/80 [&>ol>li]:leading-7
            [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:bg-primary/5 [&>blockquote]:rounded-r-xl [&>blockquote]:pl-5 [&>blockquote]:pr-4 [&>blockquote]:py-3 [&>blockquote]:my-6 [&>blockquote]:text-muted-foreground [&>blockquote]:italic
            [&>pre]:bg-slate-950 [&>pre]:rounded-xl [&>pre]:p-5 [&>pre]:text-sm [&>pre]:text-green-400 [&>pre]:overflow-x-auto [&>pre]:my-6
            [&>code]:bg-muted [&>code]:text-primary [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
            [&>img]:rounded-xl [&>img]:w-full [&>img]:my-6 [&>img]:shadow-md
            [&>hr]:border-border [&>hr]:my-8
            [&>strong]:text-foreground [&>strong]:font-semibold
            [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-2 [&>a:hover]:text-primary/80
          "
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
            <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author card */}
        {post.author && (
          <div className="mt-10 p-6 rounded-2xl bg-muted/40 border border-border flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-white text-xl font-bold shrink-0">
              {post.author.name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">{post.author.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Digital Services Professional · Web Design, SEO & Marketing</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Related posts ─────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="border-t border-border bg-muted/40 py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-6">More Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(r => (
                <Link key={r.slug} to={`/blog/${r.slug}`}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
                  {r.featured_image && (
                    <img src={fixImageUrl(r.featured_image)} alt={r.title}
                      className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      Read more <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 py-14">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="font-heading font-bold text-2xl text-white mb-3">Need a professional website?</h2>
          <p className="text-white/70 mb-6 text-sm">Get a fast, clean, mobile-ready website that grows your business.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/pricing" className="bg-white text-primary font-semibold px-6 py-2.5 rounded-xl hover:bg-white/95 transition text-sm">
              View Packages
            </Link>
            <Link to="/contact" className="bg-white/10 border border-white/20 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-white/20 transition text-sm">
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
