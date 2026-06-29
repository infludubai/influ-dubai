import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ExternalLink, FileText, Loader2, Plus, Save, Search, Trash2, Type } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/client'
import AdminLayout from '@/components/admin/AdminLayout'
import BuilderEditor from '@/components/builder/BuilderEditor'

type BuilderPage = {
  id: number
  slug: string
  title: string
  meta_title?: string
  meta_description?: string
  is_active?: boolean
  published_layout?: unknown
  draft_layout?: unknown
  publishedLayout?: unknown
  draftLayout?: unknown
}

const CORE_PAGES = [
  { slug: 'home', title: 'Home', path: '/' },
  { slug: 'services', title: 'Services', path: '/services' },
  { slug: 'portfolio', title: 'Portfolio', path: '/portfolio' },
  { slug: 'pricing', title: 'Pricing', path: '/pricing' },
  { slug: 'about', title: 'About', path: '/about' },
  { slug: 'blog', title: 'Blog', path: '/blog' },
  { slug: 'contact', title: 'Contact', path: '/contact' },
  { slug: 'privacy', title: 'Privacy Policy', path: '/privacy' },
  { slug: 'terms', title: 'Terms', path: '/terms' },
]

function publicPath(slug: string) {
  const core = CORE_PAGES.find((page) => page.slug === slug)
  return core?.path || `/p/${slug}`
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminBuilder() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()

  // If editing a specific page, show the full-screen editor
  if (slug) {
    return <BuilderEditor slug={slug} />
  }

  const [pages, setPages] = useState<BuilderPage[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const [siteName, setSiteName] = useState('')
  const [siteTagline, setSiteTagline] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  const loadSiteInfo = async () => {
    try {
      const r = await api.get('/admin/settings')
      const map: Record<string, string> = {}
      ;(r.data.data ?? []).forEach((item: any) => { map[item.key] = item.value })
      setSiteName(map.site_name ?? '')
      setSiteTagline(map.site_tagline ?? '')
    } catch { /* noop */ }
  }

  const saveSiteInfo = async () => {
    setSavingInfo(true)
    try {
      await api.put('/admin/settings', { settings: { site_name: siteName, site_tagline: siteTagline } })
      toast.success('Site info saved!')
    } catch {
      toast.error('Failed to save site info.')
    } finally {
      setSavingInfo(false)
    }
  }

  const loadPages = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/builder/pages')
      setPages(response.data.data || [])
    } catch {
      toast.error('Could not load pages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
    loadSiteInfo()
  }, [])

  const mergedPages = useMemo(() => {
    const map = new Map<string, BuilderPage>()
    CORE_PAGES.forEach((page, index) => {
      map.set(page.slug, {
        id: -index - 1,
        slug: page.slug,
        title: page.title,
        is_active: true,
      })
    })
    pages.forEach((page) => map.set(page.slug, { ...map.get(page.slug), ...page }))
    return Array.from(map.values()).filter((page) => {
      const search = `${page.title} ${page.slug}`.toLowerCase()
      return search.includes(query.toLowerCase())
    })
  }, [pages, query])

  const openEditor = (pageSlug: string) => {
    navigate(`/admin/builder/${pageSlug}`)
  }

  const deletePage = async (page: BuilderPage) => {
    const isCoreSlug = CORE_PAGES.some(p => p.slug === page.slug)
    const label = isCoreSlug ? `Clear all layouts for "${page.title || page.slug}"` : `Delete page "${page.title || page.slug}"`
    if (!window.confirm(`${label}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/builder/${page.slug}`)
      await loadPages()
      toast.success(isCoreSlug ? 'Page layouts cleared.' : 'Page deleted.')
    } catch {
      toast.error('Failed to delete page.')
    }
  }

  const addPage = () => {
    const pageSlug = cleanSlug(newSlug || newTitle)
    if (!pageSlug) {
      toast.error('Add a page title or slug first.')
      return
    }
    setNewTitle('')
    setNewSlug('')
    navigate(`/admin/builder/${pageSlug}`)
  }

  return (
    <AdminLayout title="Pages">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Website Control Center</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">Pages, layout, header, and footer</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/55">
                Manage your public pages from one place. Open a page to edit content, images, sections, responsive preview, header, and footer in the front-of-site builder.
              </p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" /> Visit Website
            </a>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-border bg-background">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search pages..."
                  className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                />
              </div>
              <span className="text-sm text-muted-foreground">{mergedPages.length} pages</span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading pages...
              </div>
            ) : (
              <div className="divide-y divide-border">
                {mergedPages.map((page) => {
                  const hasDraft = Boolean(page.draft_layout || page.draftLayout)
                  const hasPublished = Boolean(page.published_layout || page.publishedLayout)
                  return (
                    <div key={page.slug} className="flex flex-col gap-4 p-4 transition hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading font-semibold text-foreground">{page.title || page.slug}</h3>
                            {hasDraft && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-300">Draft</span>}
                            {hasPublished && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">Published</span>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{publicPath(page.slug)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={publicPath(page.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" /> View
                        </a>
                        <button
                          onClick={() => openEditor(page.slug)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/90"
                        >
                          Edit Live
                        </button>
                        {page.id > 0 && (
                          <button
                            onClick={() => deletePage(page)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-500/20 px-3 py-2 text-red-400 hover:bg-red-500/10 transition"
                            title="Delete page"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {/* Site Info */}
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Site Info</h3>
                  <p className="text-xs text-muted-foreground">Title & tagline shown on the homepage.</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Site Name</span>
                  <input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="Amir Nazir"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Tagline</span>
                  <input
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="Premium Digital Services"
                  />
                </label>
                <button
                  onClick={saveSiteInfo}
                  disabled={savingInfo}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Site Info
                </button>
              </div>
            </div>

            {/* Add Page */}
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Add Page</h3>
                  <p className="text-xs text-muted-foreground">Creates a custom `/p/page-slug` page.</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Page Title</span>
                  <input value={newTitle} onChange={(event) => { setNewTitle(event.target.value); if (!newSlug) setNewSlug(cleanSlug(event.target.value)) }} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Landing Page" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Slug</span>
                  <input value={newSlug} onChange={(event) => setNewSlug(cleanSlug(event.target.value))} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="landing-page" />
                </label>
                <button onClick={addPage} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                  <Plus className="h-4 w-4" /> Open New Page Editor
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminLayout>
  )
}
