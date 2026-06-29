/**
 * Builder Preview Page — loaded in the admin builder iframe at /preview/:slug
 * Shows the REAL page + live builder sections below it.
 * - Sends FRAME_READY so the parent builder knows the iframe is ready
 * - Listens for LAYOUT_UPDATE and renders those sections with click-to-edit
 * - Click on a section/block → postMessage back to parent → sidebar opens
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BUILDER_CHANNEL, type ParentToFrameMessage } from '@/components/builder/builderBridge'
import BuilderPageRenderer, { type BuilderLayout } from '@/components/builder/BuilderPageRenderer'

import Home          from './Home'
import Services      from './Services'
import Portfolio     from './Portfolio'
import Pricing       from './Pricing'
import About         from './About'
import Blog          from './Blog'
import Contact       from './Contact'
import PrivacyPolicy from './PrivacyPolicy'
import Terms         from './Terms'

const PAGE_MAP: Record<string, React.ComponentType> = {
  home: Home, services: Services, portfolio: Portfolio, pricing: Pricing,
  about: About, blog: Blog, contact: Contact, privacy: PrivacyPolicy, terms: Terms,
}

export default function BuilderPreview() {
  const { slug = 'home' } = useParams<{ slug: string }>()
  const [builderLayout, setBuilderLayout] = useState<BuilderLayout | null>(null)

  useEffect(() => {
    setBuilderLayout(null) // reset on slug change

    const signal = () => {
      if (window.parent !== window)
        window.parent.postMessage({ channel: BUILDER_CHANNEL, type: 'FRAME_READY' }, '*')
    }
    signal()

    const handler = (e: MessageEvent) => {
      if (e.data?.channel !== BUILDER_CHANNEL) return
      const msg = e.data as ParentToFrameMessage
      if (msg.type === 'LAYOUT_UPDATE') setBuilderLayout(msg.layout as BuilderLayout)
    }

    window.addEventListener('message', handler)
    window.addEventListener('load', signal)
    return () => {
      window.removeEventListener('message', handler)
      window.removeEventListener('load', signal)
    }
  }, [slug])

  const PageComponent = PAGE_MAP[slug]
  if (!PageComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Page "{slug}" not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Real live page content — exactly what visitors see */}
      <PageComponent />

      {/* Builder sections added via the Page tab — editable with click-to-edit */}
      {builderLayout?.sections && builderLayout.sections.length > 0 && (
        <div id="builder-sections" className="relative">
          {/* Divider showing where builder sections start */}
          <div className="sticky top-[68px] z-20 flex items-center gap-3 px-6 py-2 bg-indigo-600/95 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            Builder Sections — click any section or block to edit
          </div>
          <BuilderPageRenderer layout={builderLayout} builderMode />
        </div>
      )}

      {/* Empty state when no sections added yet */}
      {(!builderLayout?.sections || builderLayout.sections.length === 0) && (
        <div className="border-t-4 border-dashed border-indigo-300/40 bg-indigo-50/30 py-16 text-center">
          <p className="text-slate-400 text-sm font-medium">Add sections in the Page tab →</p>
          <p className="text-slate-300 text-xs mt-1">They'll appear here below the page content</p>
        </div>
      )}
    </div>
  )
}
