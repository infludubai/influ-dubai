import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, ArrowRight, BookOpen } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import PageLoader from '@/components/shared/PageLoader'
import { publicApi } from '@/api/public'
import { staggerContainer, fadeUp } from '@/utils/motion'
import { EditableSection, EditableText } from '@/components/live-editor/LiveReactEditor'
import { assetUrl } from '@/utils/assets'

function fixImageUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  if (/^https?:\/\//.test(raw)) return assetUrl(raw)
  if (raw.startsWith('/storage/')) return assetUrl(raw)
  return assetUrl('/storage/' + raw.replace(/^\//, ''))
}

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [active, setActive] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>(null)

  const load = (cat = '', pg = 1) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (cat) params.category = cat
    publicApi.blog(params).then((r) => {
      setPosts(pg === 1 ? r.data.data : (prev: any[]) => [...prev, ...r.data.data])
      setMeta(r.data.meta)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    publicApi.blogCategories().then((r) => setCategories(r.data.data ?? []))
    load()
  }, [])

  return (
    <div className="flex flex-col pb-24">
      <EditableSection sectionKey="page_blog_hero_section" label="Blog hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-20 text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <EditableText fieldKey="page_blog_hero_eyebrow" label="Blog hero eyebrow" fallback="Knowledge & Insights" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_blog_hero_title" label="Blog hero title" fallback="Blog" as="h1" className="font-heading font-bold text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-xl mx-auto">
              <EditableText fieldKey="page_blog_hero_subtitle" label="Blog hero subtitle" fallback="Tips, strategies, and insights on web design, development, SEO, and digital marketing." type="textarea" />
            </p>
          </motion.div>
        </div>
      </section>
      </EditableSection>

      <EditableSection sectionKey="page_blog_posts_section" label="Blog posts">
      <div className="container mx-auto px-4 py-16">
        {categories.length > 0 && (
          <AnimatedSection className="flex flex-wrap gap-2 mb-12">
            <button onClick={() => handleCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!active ? 'gradient-brand text-white' : 'bg-card border border-border hover:border-primary/30'}`}>
              <EditableText fieldKey="page_blog_all_posts_label" label="All posts filter label" fallback="All Posts" />
            </button>
            {categories.map((c) => (
              <button key={c.slug} onClick={() => handleCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${active === c.slug ? 'gradient-brand text-white' : 'bg-card border border-border hover:border-primary/30'}`}>
                {c.name}
                <span className="ml-1.5 text-xs opacity-60">({c.posts_count})</span>
              </button>
            ))}
          </AnimatedSection>
        )}

        {loading && posts.length === 0 ? <PageLoader /> : posts.length === 0 ? (
          <AnimatedSection className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-14 h-14 text-slate-200 mb-5" />
            <EditableText fieldKey="page_blog_empty_title" label="Blog empty title" fallback="No posts yet" as="h3" className="font-heading font-semibold text-xl text-slate-700 mb-2" />
            <p className="text-slate-400 text-sm max-w-sm">Check back soon — articles will appear here once published.</p>
          </AnimatedSection>
        ) : (
          <>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article key={post.id} variants={fadeUp} custom={i}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {post.featured_image ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={fixImageUrl(post.featured_image)} alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-blue-200" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    {post.category && (
                      <span className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-full mb-3 inline-block w-fit">
                        {post.category.name}
                      </span>
                    )}
                    <h2 className="font-heading font-semibold text-lg mb-2 line-clamp-2">{post.title}</h2>
                    <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Link to={`/blog/${post.slug}`} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                        <EditableText fieldKey="page_blog_read_button_text" label="Blog read button text" fallback="Read" /> <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {meta && meta.current_page < meta.last_page && (
              <div className="text-center mt-10">
                <button onClick={() => { setPage(page + 1); load(active, page + 1) }}
                  className="border border-border px-6 py-3 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                  <EditableText fieldKey="page_blog_load_more_text" label="Blog load more button text" fallback="Load More Posts" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </EditableSection>
    </div>
  )

  function handleCategory(slug: string) {
    setActive(slug)
    setPage(1)
    load(slug, 1)
  }
}
