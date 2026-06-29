import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { publicApi } from '@/api/public'
import BuilderPageRenderer, { type BuilderLayout } from './BuilderPageRenderer'
import { safeSessionStorage } from '@/utils/safeStorage'

const ROUTE_TO_SLUG: Record<string, string> = {
  '/':          'home',
  '/services':  'services',
  '/portfolio': 'portfolio',
  '/pricing':   'pricing',
  '/about':     'about',
  '/blog':      'blog',
  '/contact':   'contact',
  '/privacy':   'privacy',
  '/terms':     'terms',
}

const SS = 'bl_'

function readCache(slug: string): BuilderLayout | 'none' | null {
  try {
    const v = safeSessionStorage.getItem(SS + slug)
    if (!v) return null
    if (v === 'none') return 'none'
    return JSON.parse(v) as BuilderLayout
  } catch { return null }
}

function writeCache(slug: string, value: BuilderLayout | 'none') {
  try {
    safeSessionStorage.setItem(SS + slug, value === 'none' ? 'none' : JSON.stringify(value))
  } catch { /* quota exceeded */ }
}

// Tell main.tsx to fade out the splash screen — called once we know what to render.
function signalReady() {
  ;(window as any).__appReady?.()
  ;(window as any).__appReady = null // only fire once
}

export default function PublishedBuilderOutlet({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const slug = useMemo(() => ROUTE_TO_SLUG[pathname], [pathname])

  // Synchronously try sessionStorage so cached users get instant content on first render
  const [layout, setLayout] = useState<BuilderLayout | null>(() => {
    if (!slug) return null
    const cached = readCache(slug)
    return cached && cached !== 'none' ? cached : null
  })

  const [ready, setReady] = useState<boolean>(() => {
    // If we already have a cached answer, we're immediately ready
    if (!slug) return true
    const cached = readCache(slug)
    return cached !== null // null means "unknown" → not ready yet
  })

  useEffect(() => {
    if (!slug) {
      setReady(true)
      return
    }

    const cached = readCache(slug)

    if (cached === 'none') {
      // Known: no layout
      setReady(true)
      return
    }

    if (cached) {
      // Known: has layout (already set in useState, just mark ready)
      setLayout(prev => prev ?? cached)
      setReady(true)
      return
    }

    // Unknown — fetch from API
    publicApi.page(slug)
      .then(res => {
        const l: BuilderLayout | null = res.data?.data?.layout ?? null
        if (l?.sections?.length) {
          writeCache(slug, l)
          setLayout(l)
        } else {
          writeCache(slug, 'none')
        }
      })
      .catch(() => writeCache(slug, 'none'))
      .finally(() => setReady(true))
  }, [slug])

  // Signal the splash to hide as soon as we know what content to show
  useEffect(() => {
    if (ready) signalReady()
  }, [ready])

  // Not ready yet → keep the splash visible (returns null = empty main area)
  if (!ready) return null

  if (layout?.sections?.length) {
    return (
      <div className="builder-page-enter">
        <BuilderPageRenderer layout={layout} />
      </div>
    )
  }

  return <>{children}</>
}
