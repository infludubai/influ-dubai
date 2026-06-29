import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Layers } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import PageLoader from '@/components/shared/PageLoader'
import { publicApi } from '@/api/public'
import { staggerContainer, scaleIn } from '@/utils/motion'
import { EditableSection, EditableText } from '@/components/live-editor/LiveReactEditor'
import { assetUrl } from '@/utils/assets'

function fixImageUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  if (/^https?:\/\//.test(raw)) return assetUrl(raw)
  if (raw.startsWith('/storage/')) return assetUrl(raw)
  return assetUrl('/storage/' + raw.replace(/^\//, ''))
}

export default function Portfolio() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [active, setActive] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.portfolio().then((r) => {
      setItems(r.data.data ?? [])
      setCategories(['All', ...(r.data.categories ?? [])])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = active === 'All' ? items : items.filter((i) => i.category === active)

  if (loading) return <div className="pt-16"><PageLoader /></div>

  return (
    <div className="flex flex-col pb-24">
      <EditableSection sectionKey="page_portfolio_hero_section" label="Portfolio hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-20 text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <EditableText fieldKey="page_portfolio_hero_eyebrow" label="Portfolio hero eyebrow" fallback="My Work" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_portfolio_hero_title" label="Portfolio hero title" fallback="Portfolio" as="h1" className="font-heading font-bold text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-xl mx-auto">
              <EditableText fieldKey="page_portfolio_hero_subtitle" label="Portfolio hero subtitle" fallback="A selection of projects that showcase my design, development, and marketing expertise." type="textarea" />
            </p>
          </motion.div>
        </div>
      </section>
      </EditableSection>

      <EditableSection sectionKey="page_portfolio_grid_section" label="Portfolio grid">
      <div className="container mx-auto px-4 py-16">
        {items.length === 0 ? (
          <AnimatedSection className="flex flex-col items-center justify-center py-24 text-center">
            <Layers className="w-14 h-14 text-slate-200 mb-5" />
            <EditableText fieldKey="page_portfolio_empty_title" label="Portfolio empty title" fallback="No projects yet" as="h3" className="font-heading font-semibold text-xl text-slate-700 mb-2" />
            <EditableText fieldKey="page_portfolio_empty_text" label="Portfolio empty text" fallback="Portfolio items added from the admin dashboard will appear here." as="p" className="text-slate-400 text-sm max-w-sm" />
          </AnimatedSection>
        ) : (
          <>
            {categories.length > 1 && (
              <AnimatedSection className="flex flex-wrap gap-2 justify-center mb-12">
                {categories.map((c) => (
                  <button key={c} onClick={() => setActive(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      active === c ? 'gradient-brand text-white shadow-md' : 'bg-card border border-border hover:border-primary/30 hover:bg-accent'
                    }`}>
                    {c}
                  </button>
                ))}
              </AnimatedSection>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <EditableText fieldKey="page_portfolio_empty_category_text" label="Portfolio empty category text" fallback="No projects in this category yet." as="p" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={active} variants={staggerContainer} initial="hidden" animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} variants={scaleIn} custom={i}
                      className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        {item.thumbnail ? (
                          <img src={fixImageUrl(item.thumbnail)} alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 text-center">
                            <Layers className="w-10 h-10 mb-3 text-blue-300" />
                            <span className="text-sm font-semibold text-white/80">{item.category}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                          {item.live_url && (
                            <a href={item.live_url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 bg-card text-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> <EditableText fieldKey="page_portfolio_live_button_text" label="Portfolio live button text" fallback="View Live" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="p-5">
                        {item.category && <span className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-full">{item.category}</span>}
                        <h3 className="font-heading font-semibold text-base mt-2 mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{item.short_description}</p>
                        {item.tech_stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {item.tech_stack.slice(0, 4).map((t: string) => (
                              <span key={t} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
      </EditableSection>
    </div>
  )
}
