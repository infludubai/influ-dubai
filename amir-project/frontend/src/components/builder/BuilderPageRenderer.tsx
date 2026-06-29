import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { publicApi } from '@/api/public'
import { packagesApi } from '@/api/packages'
import { BUILDER_CHANNEL, type FrameToParentMessage, type ParentToFrameMessage } from './builderBridge'
import { assetUrl } from '@/utils/assets'

type BuilderBlock = {
  id: string
  type: string
  props?: Record<string, any>
}

type BuilderSection = {
  id: string
  type: string
  label?: string
  bg?: string
  textColor?: string
  padding?: string
  maxWidth?: string
  columns?: string
  gap?: string
  minHeight?: string
  animation?: string
  hidden?: boolean
  design?: Record<string, any>
  blocks?: BuilderBlock[]
}

export type BuilderLayout = {
  sections?: BuilderSection[]
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/800x400/1e293b/64748b?text=Image'

function safeUrl(value?: string, fallback = '#') {
  const url = String(value || '').trim()
  if (!url) return fallback
  if (url.startsWith('/') || url.startsWith('#')) return url
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? url : fallback
  } catch {
    return fallback
  }
}

function safeImageSrc(value?: string) {
  const url = String(value || '').trim()
  if (!url) return PLACEHOLDER_IMAGE
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) return assetUrl(url)
  return PLACEHOLDER_IMAGE
}

function safeBackground(value?: string, fallback = '#0f172a') {
  const bg = String(value || '').trim()
  if (!bg) return fallback
  if (/^#[0-9a-f]{3,8}$/i.test(bg)) return bg
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(bg)) return bg
  if (/^(linear-gradient|radial-gradient)\(/i.test(bg)) return bg
  return fallback
}

function safeCssValue(value?: any) {
  const css = String(value ?? '').trim()
  if (!css) return undefined
  if (css.length > 120) return undefined
  if (/[;{}<>]/.test(css)) return undefined
  return css
}

function safeOpacity(value?: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.min(1, Math.max(0, n))
}

function currentDevice() {
  if (typeof window === 'undefined') return 'desktop'
  if (window.innerWidth < 640) return 'mobile'
  if (window.innerWidth < 1024) return 'tablet'
  return 'desktop'
}

function useDeviceMode() {
  const [device, setDevice] = useState(currentDevice)
  useEffect(() => {
    const onResize = () => setDevice(currentDevice())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return device
}

function responsiveDesignValue(design: Record<string, any> | undefined, device: string, key: string) {
  return design?.responsive?.[device]?.[key] ?? design?.responsive?.desktop?.[key] ?? design?.[key]
}

function shadowValue(value?: any) {
  if (value === 'sm') return '0 8px 18px rgba(15,23,42,0.08)'
  if (value === 'md') return '0 16px 34px rgba(15,23,42,0.12)'
  if (value === 'lg') return '0 24px 56px rgba(15,23,42,0.16)'
  if (value === 'xl') return '0 32px 80px rgba(15,23,42,0.22)'
  return undefined
}

function designStyle(design: Record<string, any> | undefined, device: string): React.CSSProperties {
  if (!design || typeof design !== 'object') return {}
  const background = design.background ? safeBackground(design.background, '') : undefined
  const color = design.color ? safeBackground(design.color, '') : undefined
  const opacity = safeOpacity(responsiveDesignValue(design, device, 'opacity'))
  const zIndexRaw = responsiveDesignValue(design, device, 'zIndex')
  const zIndex = zIndexRaw === undefined || zIndexRaw === '' ? undefined : Number(zIndexRaw)

  return {
    width: safeCssValue(responsiveDesignValue(design, device, 'width')),
    height: safeCssValue(responsiveDesignValue(design, device, 'height')),
    padding: safeCssValue(responsiveDesignValue(design, device, 'padding')),
    margin: safeCssValue(responsiveDesignValue(design, device, 'margin')),
    borderRadius: safeCssValue(responsiveDesignValue(design, device, 'borderRadius')),
    border: safeCssValue(responsiveDesignValue(design, device, 'border')),
    fontSize: safeCssValue(responsiveDesignValue(design, device, 'fontSize')),
    lineHeight: safeCssValue(responsiveDesignValue(design, device, 'lineHeight')),
    letterSpacing: safeCssValue(responsiveDesignValue(design, device, 'letterSpacing')),
    background,
    color,
    boxShadow: shadowValue(design.shadow),
    opacity,
    zIndex: Number.isFinite(zIndex) ? zIndex : undefined,
  }
}

function normalizeLayout(layout: BuilderLayout): BuilderSection[] {
  if (!Array.isArray(layout.sections)) return []
  return layout.sections
    .filter((section): section is BuilderSection => Boolean(section && typeof section === 'object' && section.id))
    .map((section, sectionIndex) => ({
      ...section,
      id: String(section.id || `section-${sectionIndex}`),
      type: String(section.type || 'content'),
      label: String(section.label || section.type || `Section ${sectionIndex + 1}`),
      blocks: Array.isArray(section.blocks)
        ? section.blocks
            .filter((block): block is BuilderBlock => Boolean(block && typeof block === 'object' && block.id && block.type))
            .map((block, blockIndex) => ({
              id: String(block.id || `block-${sectionIndex}-${blockIndex}`),
              type: String(block.type),
              props: block.props && typeof block.props === 'object' ? block.props : {},
            }))
        : [],
    }))
}

function headingSizeClass(size?: string) {
  if (!size) return 'text-3xl'
  return size.startsWith('text-') ? size : `text-${size}`
}

function animationClass(value?: string) {
  if (value === 'fade') return 'animate-fade-in'
  if (value === 'slide') return 'animate-slide-up'
  return ''
}

function blockSpan(block: BuilderBlock, sectionColumns?: string) {
  // When a specific column count is set, all blocks fill 1 column (the grid handles layout)
  if (sectionColumns && ['1','2','3','4'].includes(sectionColumns)) return ''
  // Legacy 12-col grid mode
  if (block.props?.width === 'half') return 'md:col-span-6'
  if (block.props?.width === 'third') return 'md:col-span-4'
  if (block.props?.width === 'quarter') return 'md:col-span-3'
  if (block.type === 'card') return 'md:col-span-4'
  if (block.type === 'stat') return 'md:col-span-3'
  return 'md:col-span-12'
}

function gridColsClass(value?: string) {
  if (value === '1') return 'grid-cols-1'
  if (value === '2') return 'grid-cols-1 md:grid-cols-2'
  if (value === '3') return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  if (value === '4') return 'grid-cols-2 md:grid-cols-4'
  if (value === '6') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  return 'md:grid-cols-12'
}

function minHeightClass(value?: string) {
  if (value === 'screen') return 'min-h-screen'
  if (value === 'large') return 'min-h-[720px]'
  if (value === 'medium') return 'min-h-[520px]'
  if (value === 'small') return 'min-h-[360px]'
  return ''
}

function fontFamilyClass(value?: string) {
  return value === 'sans' ? 'font-sans' : 'font-heading'
}

function fontWeightClass(value?: string) {
  if (value === 'normal') return 'font-normal'
  if (value === 'medium') return 'font-medium'
  if (value === 'semibold') return 'font-semibold'
  if (value === 'extrabold') return 'font-extrabold'
  return 'font-bold'
}

function lineHeightClass(value?: string) {
  if (value === 'tight') return 'leading-tight'
  if (value === 'relaxed') return 'leading-relaxed'
  if (value === 'loose') return 'leading-loose'
  return 'leading-normal'
}

function imageHeightClass(value?: string) {
  if (value === 'small') return 'h-56'
  if (value === 'medium') return 'h-80'
  if (value === 'large') return 'h-[520px]'
  if (value === 'full') return 'h-full min-h-[520px]'
  return 'max-h-[520px]'
}

function ButtonBlock({ props, builderMode, device }: { props: Record<string, any>; builderMode?: boolean; device: string }) {
  const className =
    props.style === 'white'
      ? 'bg-white text-slate-950 hover:bg-slate-100'
      : props.style === 'outline'
        ? 'border border-current bg-transparent hover:bg-white/10'
        : 'bg-blue-600 text-white hover:bg-blue-700'
  const customStyle = designStyle(props.design, device)

  return (
    <div style={{ textAlign: props.align || 'center' }} className="py-2">
      <Link
        to={safeUrl(props.url)}
        onClick={(event) => {
          if (!builderMode) return
          event.preventDefault()
        }}
        style={customStyle}
        className={`inline-flex rounded-xl px-6 py-3 text-sm font-semibold transition ${className}`}
      >
        {props.text || 'Button'}
      </Link>
    </div>
  )
}

const defaultFormFields = [
  { key: 'name', label: 'Full Name', placeholder: 'Your name', type: 'text', required: true },
  { key: 'email', label: 'Email Address', placeholder: 'you@example.com', type: 'email', required: true },
  { key: 'phone', label: 'Phone', placeholder: 'Optional phone number', type: 'text', required: false },
  { key: 'subject', label: 'Subject', placeholder: 'What is this about?', type: 'text', required: false },
  { key: 'message', label: 'Message', placeholder: 'Tell me about your project...', type: 'textarea', required: true },
]

function ContactFormBlock({ props, builderMode }: { props: Record<string, any>; builderMode?: boolean }) {
  const fields = Array.isArray(props.fields) && props.fields.length ? props.fields : defaultFormFields
  const initialForm = fields.reduce((current: Record<string, string>, field: any) => ({ ...current, [field.key]: '' }), {})
  const [form, setForm] = useState<Record<string, string>>(initialForm)
  const [loading, setLoading] = useState(false)
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (builderMode) {
      toast('Forms are disabled inside builder preview.', { id: 'builder-form-disabled' })
      return
    }
    setLoading(true)
    try {
      await publicApi.contact({
        ...form,
        name: form.name || 'Website visitor',
        email: form.email || '',
        phone: form.phone || '',
        subject: form.subject || props.title || 'Website form submission',
        message: form.message || fields.map((field: any) => `${field.label || field.key}: ${form[field.key] || ''}`).join('\n'),
      })
      toast.success(props.successMessage || "Message sent! We'll reply within 24 hours.")
      setForm(initialForm)
    } catch {
      toast.error('Failed to send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      {(props.title || props.description) && (
        <div className="mb-5">
          {props.title && <h3 className="font-heading text-2xl font-bold text-slate-950">{props.title}</h3>}
          {props.description && <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field: any) => (
          <label key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
            {field.type === 'textarea' ? (
              <textarea required={!!field.required} value={form[field.key] || ''} onChange={(event) => set(field.key, event.target.value)} rows={5} placeholder={field.placeholder} className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500" />
            ) : (
              <input required={!!field.required} type={field.type === 'email' ? 'email' : 'text'} value={form[field.key] || ''} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
            )}
          </label>
        ))}
      </div>
      <button disabled={loading} className="mt-4 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? 'Sending...' : (props.submitText || 'Send Message')}
      </button>
    </form>
  )
}

function DynamicGridBlock({ props, type, builderMode }: { props: Record<string, any>; type: string; builderMode?: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const limit = Number(props.limit || 6)

  useEffect(() => {
    setLoading(true)
    const request =
      type === 'packages-grid' ? packagesApi.list() :
      type === 'portfolio-grid' ? publicApi.portfolio() :
      publicApi.blog({ page: '1' })

    request.then((response) => {
      setItems((response.data.data || []).slice(0, limit))
    }).catch(() => {
      setItems([])
    }).finally(() => setLoading(false))
  }, [type, limit])

  return (
    <div>
      {(props.title || props.subtitle) && (
        <div className="mx-auto mb-10 max-w-3xl text-center">
          {props.title && <h2 className="font-heading text-3xl font-bold text-slate-950">{props.title}</h2>}
          {props.subtitle && <p className="mt-3 text-slate-600">{props.subtitle}</p>}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">{props.emptyText || 'No items yet.'}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id || item.slug || item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              {(type === 'portfolio-grid' && item.thumbnail) || (type === 'blog-grid' && item.featured_image) ? (
                <img src={(() => { const r = item.thumbnail || item.featured_image; if (!r) return ''; if (/^https?:\/\//.test(r) || r.startsWith('/storage/')) return assetUrl(r); return assetUrl('/storage/' + r); })()} alt={item.title || item.name} className="aspect-video w-full object-cover" />
              ) : null}
              <div className="p-6">
                {item.category?.name || item.category ? <p className="mb-2 text-xs font-semibold uppercase text-blue-600">{item.category?.name || item.category}</p> : null}
                <h3 className="font-heading text-lg font-semibold text-slate-950">{item.name || item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.short_description || item.excerpt || item.description}</p>
                {type === 'packages-grid' && (
                  <p className="mt-4 font-heading text-2xl font-bold text-slate-950">{Number(item.price) === 0 ? 'Custom' : `$${Number(item.price).toLocaleString()}`}</p>
                )}
                <Link
                  onClick={(event) => {
                    if (!builderMode) return
                    event.preventDefault()
                  }}
                  to={
                  type === 'packages-grid' ? `/checkout?package=${item.slug}` :
                  type === 'portfolio-grid' ? `/portfolio/${item.slug}` :
                  `/blog/${item.slug}`
                } className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  {props.buttonText || 'View'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Block({ block, builderMode, device }: { block: BuilderBlock; builderMode?: boolean; device: string }) {
  const props = block.props || {}
  const customStyle = designStyle(props.design, device)
  const textStyle = {
    fontSize: customStyle.fontSize,
    lineHeight: customStyle.lineHeight,
    letterSpacing: customStyle.letterSpacing,
  }

  if (block.type === 'heading') {
    return (
      <h2 style={{ ...textStyle, color: props.color, textAlign: props.align || 'left' }} className={`${headingSizeClass(props.size)} ${fontFamilyClass(props.fontFamily)} ${fontWeightClass(props.fontWeight)} ${lineHeightClass(props.lineHeight || 'tight')}`}>
        {props.text}
      </h2>
    )
  }

  if (block.type === 'paragraph') {
    return (
      <p style={{ ...textStyle, color: props.color, textAlign: props.align || 'left' }} className={`text-base ${fontFamilyClass(props.fontFamily || 'sans')} ${fontWeightClass(props.fontWeight || 'normal')} ${lineHeightClass(props.lineHeight || 'relaxed')}`}>
        {props.text}
      </p>
    )
  }

  if (block.type === 'image') {
    const roundedClass = props.rounded === 'rounded-full' ? 'rounded-full' : (props.rounded || 'rounded-2xl')
    const heightStyle = props.height && props.height !== 'auto' ? props.height : undefined
    return (
      <img
        src={safeImageSrc(props.src)}
        alt={props.alt || ''}
        style={{ ...customStyle, ...(heightStyle ? { height: heightStyle } : {}) }}
        className={`w-full ${heightStyle ? 'object-cover' : imageHeightClass(props.height)} ${props.objectFit === 'contain' ? 'object-contain' : props.objectFit === 'fill' ? 'object-fill' : 'object-cover'} ${roundedClass}`}
      />
    )
  }

  if (block.type === 'button') return <ButtonBlock props={props} builderMode={builderMode} device={device} />

  if (block.type === 'card') {
    return (
      <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
          {props.icon || '01'}
        </div>
        <h3 className="mb-2 font-heading text-lg font-semibold text-slate-950">{props.title}</h3>
        <p className="text-sm leading-6 text-slate-600">{props.body}</p>
      </article>
    )
  }

  if (block.type === 'stat') {
    return (
      <div className="text-center">
        <div className="font-heading text-4xl font-bold">{props.number}</div>
        <div className="mt-2 text-sm opacity-70">{props.label}</div>
      </div>
    )
  }

  if (block.type === 'faq-item') {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">{props.question}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{props.answer}</p>
      </article>
    )
  }

  if (block.type === 'testimonial') {
    const stars = Math.min(5, Math.max(1, props.rating || 5))
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-yellow-400 text-sm">★</span>
          ))}
        </div>
        <p className="text-sm italic leading-7 text-white/75">"{props.quote}"</p>
        <div className="flex items-center gap-3">
          {props.avatar && <img src={assetUrl(props.avatar)} alt={props.author} className="w-10 h-10 rounded-full object-cover shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-white">{props.author}</p>
            <p className="text-xs text-white/45">{props.role}</p>
          </div>
        </div>
      </article>
    )
  }

  if (block.type === 'video') {
    const getEmbedUrl = (url: string) => {
      if (!url) return ''
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
      const vmMatch = url.match(/vimeo\.com\/(\d+)/)
      if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
      return safeUrl(url, '')
    }
    const embedUrl = getEmbedUrl(props.url || '')
    if (!embedUrl) return <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-white/30 text-sm">Paste a YouTube or Vimeo URL</div>
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: props.aspect || '16/9' }}>
          <iframe src={embedUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen />
        </div>
        {props.caption && <p className="text-center text-xs text-white/40 italic">{props.caption}</p>}
      </div>
    )
  }

  if (block.type === 'divider') {
    return <hr style={{ borderColor: props.color || '#e2e8f0', borderStyle: props.style || 'solid', borderTopWidth: '1px' }} />
  }

  if (block.type === 'spacer') {
    return <div style={{ height: `${props.height || 40}px` }} />
  }

  if (block.type === 'contact-form') return <ContactFormBlock props={props} builderMode={builderMode} />
  if (['packages-grid', 'portfolio-grid', 'blog-grid'].includes(block.type)) {
    return <DynamicGridBlock props={props} type={block.type} builderMode={builderMode} />
  }

  return null
}

function postToParent(msg: FrameToParentMessage) {
  // Send to parent whether in iframe or not (BuilderPreview is in an iframe)
  const target = window.self !== window.top ? window.parent : window.opener ?? window.parent
  try { target.postMessage({ channel: BUILDER_CHANNEL, ...msg }, '*') } catch { /* cross-origin */ }
}

function Section({
  section, builderMode, isFirst, isSelected, selectedBlockId, device,
}: {
  section: BuilderSection; builderMode?: boolean; isFirst?: boolean
  isSelected?: boolean; selectedBlockId?: string | null; device: string
}) {
  if (section.hidden) return null
  const blocks = section.blocks || []
  const sectionDesignStyle = designStyle(section.design, device)

  return (
    <section
      data-section-id={section.id}
      onClick={(event) => {
        if (!builderMode) return
        event.preventDefault()
        postToParent({ type: 'SECTION_CLICKED', sectionId: section.id })
      }}
      style={{
        ...sectionDesignStyle,
        background: sectionDesignStyle.background || safeBackground(section.bg, '#0f172a'),
        color: sectionDesignStyle.color || section.textColor || '#ffffff',
        outline: isSelected ? '3px solid #6366f1' : undefined,
        outlineOffset: isSelected ? '-3px' : undefined,
      }}
      className={`relative flex items-center ${section.padding || 'py-20'} ${isFirst ? 'pt-[calc(68px+5rem)]' : ''} ${minHeightClass(section.minHeight)} ${animationClass(section.animation)} ${builderMode ? 'cursor-pointer transition-[outline]' : ''} ${builderMode && !isSelected ? 'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-blue-300/60' : ''}`}
    >
      {/* Section label badge — visible in builder mode */}
      {builderMode && (
        <div
          className="absolute top-0 left-0 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none transition-opacity"
          style={{
            background: isSelected ? '#2563eb' : 'rgba(37,99,235,0.85)',
            color: 'white',
          }}
        >
          {section.label || section.type}
        </div>
      )}

      <div className={`${section.maxWidth || 'max-w-7xl'} mx-auto px-4 w-full`}>
        <div className={`grid ${section.gap || 'gap-5'} ${gridColsClass(section.columns)}`}>
          {blocks.map((block) => {
            const isBlockSel = selectedBlockId === block.id
            const blockDesignStyle = designStyle(block.props?.design, device)
            return (
              <div
                key={block.id}
                data-block-id={block.id}
                data-section-id={section.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (builderMode) postToParent({ type: 'BLOCK_CLICKED', sectionId: section.id, blockId: block.id })
                }}
                style={{
                  ...blockDesignStyle,
                  outline: isBlockSel ? '2px solid #f59e0b' : undefined,
                  outlineOffset: isBlockSel ? '-2px' : undefined,
                }}
                className={`${blockSpan(block, section.columns)} ${animationClass(block.props?.animation)} ${builderMode ? 'cursor-pointer transition-[outline]' : ''} ${builderMode && !isBlockSel ? 'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-amber-400/70' : ''}`}
              >
                <Block block={block} builderMode={builderMode} device={device} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function BuilderPageRenderer({ layout, builderMode }: { layout: BuilderLayout; builderMode?: boolean }) {
  const sections   = useMemo(() => normalizeLayout(layout), [layout])
  const isInIframe = window.self !== window.top
  const inBuilder  = builderMode || isInIframe
  const device     = useDeviceMode()

  // Track selected section/block from parent builder (via postMessage)
  const [selSec, setSelSec] = useState<string | null>(null)
  const [selBlk, setSelBlk] = useState<string | null>(null)

  useEffect(() => {
    if (!inBuilder || !isInIframe) return
    const handler = (e: MessageEvent) => {
      if (e.data?.channel !== BUILDER_CHANNEL) return
      const msg = e.data as ParentToFrameMessage
      if (msg.type === 'SELECT') {
        setSelSec(msg.sectionId)
        setSelBlk(msg.blockId)
        if (msg.sectionId) {
          const selector = msg.blockId
            ? `[data-block-id="${msg.blockId}"]`
            : `[data-section-id="${msg.sectionId}"]`
          const el = document.querySelector(selector)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [inBuilder, isInIframe])

  if (!sections.length) return null

  return (
    <div className="builder-rendered-page overflow-hidden">
      {sections.map((section, idx) => (
        <Section
          key={section.id}
          section={section}
          builderMode={inBuilder}
          isFirst={idx === 0}
          isSelected={selSec === section.id}
          selectedBlockId={selSec === section.id ? selBlk : null}
          device={device}
        />
      ))}
    </div>
  )
}
