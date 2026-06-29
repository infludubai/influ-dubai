import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { publicApi } from '@/api/public'
import BuilderPageRenderer, { type BuilderLayout } from '@/components/builder/BuilderPageRenderer'
import { EditableSection, EditableText, LiveReactEditorProvider, useLiveEditor } from '@/components/live-editor/LiveReactEditor'
import { safeSessionStorage } from '@/utils/safeStorage'

const ROUTE_TO_SLUG: Record<string, string> = {
  '/': 'home', '/services': 'services', '/portfolio': 'portfolio',
  '/pricing': 'pricing', '/about': 'about', '/blog': 'blog',
  '/contact': 'contact', '/privacy': 'privacy', '/terms': 'terms',
}

/* ── Admin floating edit button ─────────────────────────────────────── */
/* ── Published builder sections — appended below core pages ─────────── */
// Always fetches fresh so published layout changes are immediately visible.
// No sessionStorage cache here — caching caused stale 'none' to block updates.
function PublishedSections({ slug }: { slug: string }) {
  const [layout, setLayout] = useState<BuilderLayout | null>(null)

  useEffect(() => {
    if (!slug) return
    setLayout(null)
    publicApi.page(slug)
      .then(r => {
        const l = r.data?.data?.layout
        if (l?.sections?.length) setLayout(l)
      })
      .catch(() => { /* no layout — silent */ })
  }, [slug])

  if (!layout?.sections?.length) return null
  return <BuilderPageRenderer layout={layout} />
}

/* ── Custom /p/:slug outlet ─────────────────────────────────────────── */
function LiveAddedSections({ slug }: { slug: string }) {
  const editor = useLiveEditor()
  const raw = editor.value(`page_live_sections_${slug}`, '[]')
  let sections: any[] = []
  try { sections = JSON.parse(raw) } catch { sections = [] }

  if (!sections.length) return null

  return (
    <div className="flex flex-col bg-background">
      {sections.map((section) => (
        <EditableSection key={section.id} sectionKey={`page_live_section_${section.id}`} label={section.title || 'Added section'}>
        <section key={section.id} className="border-t border-border py-16">
          <div className={`container mx-auto px-4 ${section.type === 'split' ? 'grid gap-10 lg:grid-cols-2 lg:items-center' : 'text-center'}`}>
            <div className={section.type === 'split' ? '' : 'mx-auto max-w-3xl'}>
              <EditableText fieldKey={`page_live_section_${section.id}_title`} label="Added section title" fallback={section.title || 'New website section'} as="h2" className="font-heading text-3xl font-bold text-foreground md:text-4xl" />
              <EditableText fieldKey={`page_live_section_${section.id}_subtitle`} label="Added section subtitle" fallback={section.subtitle || 'Edit this new section directly from the live builder.'} as="p" type="textarea" className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground" />
              <a href={editor.value(`page_live_section_${section.id}_url`, section.url || '/contact')} className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                <EditableText fieldKey={`page_live_section_${section.id}_button`} label="Added section button" fallback={section.button || 'Learn More'} relatedFields={[{ key: `page_live_section_${section.id}_url`, label: 'Button URL', type: 'url', fallback: section.url || '/contact' }]} />
              </a>
            </div>
            {section.type === 'features' && (
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {['Strategy', 'Design', 'Launch'].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-border bg-muted/50 p-6">
                    <EditableText fieldKey={`page_live_section_${section.id}_feature_${index}_title`} label={`Feature ${index + 1} title`} fallback={item} as="h3" className="font-heading text-lg font-bold text-foreground" />
                    <EditableText fieldKey={`page_live_section_${section.id}_feature_${index}_text`} label={`Feature ${index + 1} text`} fallback="Edit this feature from the live builder." as="p" type="textarea" className="mt-2 text-sm leading-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        </EditableSection>
      ))}
    </div>
  )
}

function CustomPageOutlet({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const slug = pathname.match(/^\/p\/([^/]+)$/)?.[1]
  const [layout, setLayout] = useState<BuilderLayout | null>(null)

  useEffect(() => {
    if (!slug) return
    const key = 'cbl_' + slug
    try {
      const c = safeSessionStorage.getItem(key)
      if (c && c !== 'none') { setLayout(JSON.parse(c)); return }
      if (c === 'none') return
    } catch { /* skip */ }

    publicApi.page(slug)
      .then(r => {
        const l = r.data?.data?.layout
        if (l?.sections?.length) {
          safeSessionStorage.setItem(key, JSON.stringify(l))
          setLayout(l)
        } else {
          safeSessionStorage.setItem(key, 'none')
        }
      })
      .catch(() => { /* no layout */ })
  }, [slug])

  if (layout?.sections?.length) return <BuilderPageRenderer layout={layout} />
  return <>{children}</>
}

/* ── Main public layout ─────────────────────────────────────────────── */
export default function PublicLayout() {
  const { pathname } = useLocation()
  const isCustomPage = pathname.startsWith('/p/')
  const coreSlug     = ROUTE_TO_SLUG[pathname] || ''

  return (
    <LiveReactEditorProvider>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {isCustomPage ? (
          <CustomPageOutlet><Outlet /></CustomPageOutlet>
        ) : (
          <>
            {/* Real page component — always renders with live data */}
            <Outlet />
            {coreSlug && <LiveAddedSections slug={coreSlug} />}
            {/* Published builder sections appear below the real page content */}
            {coreSlug && <PublishedSections slug={coreSlug} />}
          </>
        )}
      </main>
      <Footer />
    </div>
    </LiveReactEditorProvider>
  )
}
