import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Loader2,
  Monitor,
  MousePointer2,
  PanelBottom,
  PanelTop,
  Plus,
  Save,
  Settings,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  UploadCloud,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { assetUrl } from '@/utils/assets'
import { useAuthStore } from '@/store/authStore'

type EditorMode = 'page' | 'header' | 'footer'
type Viewport = 'desktop' | 'mobile'
type BlockType = 'heading' | 'paragraph' | 'image' | 'button' | 'card' | 'stat' | 'faq-item' | 'contact-form' | 'packages-grid' | 'portfolio-grid' | 'blog-grid'
type Block = { id: string; type: BlockType; props: Record<string, any> }
type Section = {
  id: string
  type: string
  label: string
  bg: string
  textColor: string
  padding: string
  maxWidth: string
  columns?: string
  gap?: string
  minHeight?: string
  animation?: string
  hidden?: boolean
  blocks: Block[]
}
type PageLayout = { sections: Section[]; meta?: { title?: string; description?: string } }
type HeaderConfig = {
  logoText: string
  logoImage: string
  logoImageLight?: string
  favicon?: string
  logoColor: string
  logoWidth?: string
  logoHeight?: string
  logoBg?: string
  logoPadding?: string
  logoRadius?: string
  ctaText: string
  ctaUrl: string
  navItems: Array<{ label: string; url: string }>
}
type FooterConfig = {
  logoText: string
  logoImage: string
  logoColor?: string
  logoWidth?: string
  logoHeight?: string
  logoBg?: string
  logoPadding?: string
  logoRadius?: string
  description: string
  email: string
  phone: string
  copyright: string
  quickLinks: Array<{ label: string; url: string }>
  services: string[]
  socialLinks: Array<{ label: string; url: string; icon: string; iconImage?: string }>
}

const FIELD = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const fixedPageMap: Record<string, string> = {
  '/': 'home',
  '/services': 'services',
  '/portfolio': 'portfolio',
  '/pricing': 'pricing',
  '/about': 'about',
  '/blog': 'blog',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
}

const DEFAULT_HEADER: HeaderConfig = {
  logoText: 'Amir Nazir',
  logoImage: '',
  logoImageLight: '',
  favicon: '',
  logoColor: '#3b82f6',
  logoWidth: '160',
  logoHeight: '40',
  logoBg: 'transparent',
  logoPadding: '0',
  logoRadius: '8',
  ctaText: 'Get Started',
  ctaUrl: '/register',
  navItems: [
    { label: 'Home', url: '/' },
    { label: 'Services', url: '/services' },
    { label: 'Portfolio', url: '/portfolio' },
    { label: 'Pricing', url: '/pricing' },
    { label: 'About', url: '/about' },
    { label: 'Blog', url: '/blog' },
    { label: 'Contact', url: '/contact' },
  ],
}

const DEFAULT_FOOTER: FooterConfig = {
  logoText: 'Amir Nazir',
  logoImage: '',
  logoColor: '#93c5fd',
  logoWidth: '176',
  logoHeight: '44',
  logoBg: 'transparent',
  logoPadding: '0',
  logoRadius: '8',
  description: 'Premium digital services - web design, development, SEO, and marketing solutions that grow your business.',
  email: 'info@a-mir.com',
  phone: '',
  copyright: `${new Date().getFullYear()} Amir Nazir. All rights reserved.`,
  quickLinks: DEFAULT_HEADER.navItems,
  services: ['Web Design', 'Web Development', 'E-Commerce', 'SEO Services', 'Digital Marketing', 'Branding & Logo'],
  socialLinks: [
    { label: 'GitHub', url: '#', icon: 'GH', iconImage: '' },
    { label: 'LinkedIn', url: '#', icon: 'IN', iconImage: '' },
    { label: 'Twitter', url: '#', icon: 'X', iconImage: '' },
    { label: 'Instagram', url: '#', icon: 'IG', iconImage: '' },
  ],
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`
}

function block(type: BlockType, props: Record<string, any> = {}): Block {
  const defaults: Record<BlockType, Record<string, any>> = {
    heading: { text: 'New Heading', size: 'text-3xl', align: 'left', color: '#0f172a', width: 'full', fontFamily: 'heading', fontWeight: 'bold', lineHeight: 'tight', animation: 'none' },
    paragraph: { text: 'Add your text here.', align: 'left', color: '#475569', width: 'full', fontFamily: 'sans', fontWeight: 'normal', lineHeight: 'relaxed', animation: 'none' },
    image: { src: 'https://placehold.co/900x520/e2e8f0/475569?text=Upload+Image', alt: '', rounded: true, objectFit: 'object-cover', width: 'full', height: 'auto', animation: 'none' },
    button: { text: 'Click Here', url: '#', style: 'primary', align: 'center', width: 'auto', animation: 'none' },
    card: { icon: '01', title: 'Card Title', body: 'Card description goes here.', width: 'full', animation: 'none' },
    stat: { number: '100+', label: 'Metric Label', width: 'full', animation: 'none' },
    'faq-item': { question: 'Question?', answer: 'Answer goes here.', width: 'full', animation: 'none' },
    'contact-form': {
      title: 'Send a message',
      description: 'Tell me about your project and I will reply as soon as possible.',
      submitText: 'Send Message',
      successMessage: "Message sent! We'll reply within 24 hours.",
      fields: [
        { key: 'name', label: 'Full Name', placeholder: 'Your name', type: 'text', required: true },
        { key: 'email', label: 'Email Address', placeholder: 'you@example.com', type: 'email', required: true },
        { key: 'phone', label: 'Phone', placeholder: 'Optional phone number', type: 'text', required: false },
        { key: 'subject', label: 'Subject', placeholder: 'What is this about?', type: 'text', required: false },
        { key: 'message', label: 'Message', placeholder: 'Tell me about your project...', type: 'textarea', required: true },
      ],
    },
    'packages-grid': { title: 'Choose Your Package', subtitle: 'Live packages from your package manager.', limit: 6, buttonText: 'Get Started', emptyText: 'No packages yet.' },
    'portfolio-grid': { title: 'Recent Work', subtitle: 'Live portfolio items from your portfolio manager.', limit: 6, buttonText: 'View Project', emptyText: 'No projects yet.' },
    'blog-grid': { title: 'Latest Articles', subtitle: 'Live posts from your blog manager.', limit: 6, buttonText: 'Read', emptyText: 'No posts yet.' },
  }
  return { id: uid(type), type, props: { ...defaults[type], ...props } }
}

function makeSection(label: string, bg: string, textColor: string, blocks: Block[], type = 'content'): Section {
  return { id: uid(type), type, label, bg, textColor, padding: 'py-20', maxWidth: 'max-w-7xl', columns: '12', gap: 'gap-5', minHeight: 'none', animation: 'none', blocks }
}

function hero(eyebrow: string, title: string, copy: string, primaryText: string, primaryUrl: string, secondaryText?: string, secondaryUrl?: string) {
  const blocks = [
    block('paragraph', { text: eyebrow, align: 'center', color: '#38bdf8' }),
    block('heading', { text: title, size: 'text-5xl', align: 'center', color: '#ffffff' }),
    block('paragraph', { text: copy, align: 'center', color: '#cbd5e1' }),
    block('button', { text: primaryText, url: primaryUrl, style: 'primary', align: 'center' }),
  ]
  if (secondaryText && secondaryUrl) blocks.push(block('button', { text: secondaryText, url: secondaryUrl, style: 'outline', align: 'center' }))
  return { ...makeSection('Hero', '#0f172a', '#ffffff', blocks, 'hero'), maxWidth: 'max-w-5xl' }
}

function cards(label: string, eyebrow: string, title: string, copy: string, items: Array<[string, string, string]>, bg = '#ffffff') {
  return makeSection(label, bg, '#0f172a', [
    block('paragraph', { text: eyebrow, align: 'center', color: '#2563eb' }),
    block('heading', { text: title, size: 'text-3xl', align: 'center', color: '#0f172a' }),
    block('paragraph', { text: copy, align: 'center', color: '#64748b' }),
    ...items.map(([icon, itemTitle, body]) => block('card', { icon, title: itemTitle, body })),
  ], 'cards')
}

function starterLayout(slug: string): PageLayout {
  if (slug === 'home') return { sections: [
    hero('Premium Digital Services', 'Build Your Digital Presence', 'Web design, development, SEO, and marketing services that turn your vision into a polished online business.', 'View Packages', '/pricing', 'See My Work', '/portfolio'),
    cards('Services', 'What I Do', 'Services That Drive Results', 'Everything you need to grow online with a clean, premium presence.', [
      ['01', 'Web Design & Development', 'Fast, responsive websites built for trust and conversion.'],
      ['02', 'SEO Services', 'Technical and content SEO to improve search visibility.'],
      ['03', 'Digital Marketing', 'Campaigns, content, and strategy to grow your audience.'],
    ]),
    makeSection('Project Stats', '#f8fafc', '#0f172a', [
      block('stat', { number: '50+', label: 'Projects Delivered' }),
      block('stat', { number: '100%', label: 'Client Focus' }),
      block('stat', { number: '5+', label: 'Years Experience' }),
      block('stat', { number: '24/7', label: 'Support Options' }),
    ], 'stats'),
  ] }

  if (slug === 'services') return { sections: [
    hero('What I Offer', 'Digital Services', 'Choose the right service for your business, from a new website to SEO, branding, and ongoing maintenance.', 'View Pricing', '/pricing', 'Request Quote', '/contact'),
    cards('Web Services', 'Web Design & Development', 'Modern websites for real businesses', 'Business websites, portfolios, landing pages, e-commerce, redesigns, and maintenance.', [
      ['01', 'Business Website', 'Professional sites that build trust and generate leads.'],
      ['02', 'E-Commerce Website', 'Online stores with checkout, products, and payments.'],
      ['03', 'Website Redesign', 'Modernize your existing website for better performance.'],
    ]),
    cards('Growth Services', 'SEO, Branding & Marketing', 'Growth support after launch', 'SEO, branding, content, and digital campaigns that help people find and trust your business.', [
      ['01', 'SEO Services', 'Local SEO, technical SEO, audits, and monthly management.'],
      ['02', 'Branding & Logo', 'Clear visual identity for your business.'],
      ['03', 'Speed Optimization', 'Improve load speed, UX, and Core Web Vitals.'],
    ], '#f8fafc'),
  ] }

  if (slug === 'pricing') return { sections: [
    hero('Transparent Pricing', 'Simple, Clear Packages', 'Choose the package that fits your needs. Add-ons can extend your project when needed.', 'Start Checkout', '/pricing'),
    makeSection('Packages', '#ffffff', '#0f172a', [block('packages-grid')], 'packages'),
    cards('Included', 'Package Benefits', 'What every project includes', 'Professional delivery, mobile responsive design, review rounds, and support.', [
      ['01', 'Responsive Design', 'Clean layouts for desktop, tablet, and mobile.'],
      ['02', 'Support', 'Guidance and fixes after delivery.'],
      ['03', 'Clean Process', 'Clear project flow from order to launch.'],
    ], '#f8fafc'),
  ] }

  if (slug === 'portfolio') return { sections: [
    hero('Selected Work', 'Portfolio', 'Explore recent digital projects, websites, SEO work, and brand experiences.', 'Start Your Project', '/contact'),
    makeSection('Portfolio Grid', '#ffffff', '#0f172a', [block('portfolio-grid')], 'portfolio'),
  ] }

  if (slug === 'blog') return { sections: [
    hero('Insights', 'Blog', 'Read practical articles about websites, SEO, branding, and digital growth.', 'Contact Amir', '/contact'),
    makeSection('Blog Grid', '#ffffff', '#0f172a', [block('blog-grid')], 'blog'),
  ] }

  if (slug === 'about') return { sections: [
    hero('About Me', "Hi, I'm Amir Nazir", 'A digital services professional helping businesses build clean, high-performing online platforms.', 'View My Work', '/portfolio', 'Get In Touch', '/contact'),
    cards('Values', 'What I Stand For', 'Clean execution and long-term support', 'The work should look premium, load fast, and be easy to maintain.', [
      ['01', 'Speed', 'Pages should feel fast and responsive.'],
      ['02', 'Quality', 'Clean structure, focused UI, and maintainable code.'],
      ['03', 'Partnership', 'Support that continues after launch.'],
    ]),
  ] }

  if (slug === 'contact') return { sections: [
    hero("Let's Connect", 'Get In Touch', 'Have a project in mind or need a quote? Send the details and I will get back to you.', 'View Pricing', '/pricing'),
    makeSection('Contact Form', '#ffffff', '#0f172a', [
      block('heading', { text: 'Tell me about your project', size: 'text-3xl', align: 'center', color: '#0f172a' }),
      block('paragraph', { text: 'Use the form below for websites, SEO, branding, maintenance, or custom digital services.', align: 'center', color: '#64748b' }),
      block('contact-form'),
    ], 'contact'),
  ] }

  if (slug === 'privacy' || slug === 'terms') return { sections: [
    hero('Legal', slug === 'privacy' ? 'Privacy Policy' : 'Terms of Service', 'Edit this legal page content from the live builder.', 'Contact', '/contact'),
    makeSection('Page Content', '#ffffff', '#0f172a', [
      block('heading', { text: slug === 'privacy' ? 'Privacy Policy Content' : 'Terms Content', size: 'text-3xl', align: 'left', color: '#0f172a' }),
      block('paragraph', { text: 'Add your full legal content here. You can add more sections, FAQ items, buttons, images, and text blocks.', align: 'left', color: '#475569' }),
    ], 'legal'),
  ] }

  return { sections: [
    hero('Custom Page', slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()), 'Build this page directly from the live editor.', 'Contact', '/contact'),
    makeSection('Page Content', '#ffffff', '#0f172a', [
      block('heading', { text: 'Start editing this page', size: 'text-3xl', align: 'left', color: '#0f172a' }),
      block('paragraph', { text: 'Add sections, text, images, cards, buttons, and live blocks from the editor panel.', align: 'left', color: '#475569' }),
    ], 'content'),
  ] }
}

function slugFromPath(pathname: string) {
  if (fixedPageMap[pathname]) return fixedPageMap[pathname]
  const custom = pathname.match(/^\/p\/([^/]+)$/)
  return custom?.[1] || null
}

function safeParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback
  try { return { ...fallback, ...JSON.parse(value) } } catch { return fallback }
}

function logoStyle(config: Partial<HeaderConfig & FooterConfig>): CSSProperties {
  return {
    width: `${Number(config.logoWidth || 160)}px`,
    height: `${Number(config.logoHeight || 40)}px`,
    background: config.logoBg && config.logoBg !== 'transparent' ? config.logoBg : 'transparent',
    padding: `${Number(config.logoPadding || 0)}px`,
    borderRadius: `${Number(config.logoRadius || 8)}px`,
  }
}

function LogoPreview({ config, dark = false }: { config: Partial<HeaderConfig & FooterConfig>; dark?: boolean }) {
  const style = logoStyle(config)
  return (
    <span className="inline-flex shrink-0 items-center justify-center overflow-hidden align-middle" style={style}>
      {config.logoImage ? (
        <img src={assetUrl(config.logoImage)} alt={config.logoText || 'Logo'} className="h-full w-full object-contain" />
      ) : (
        <span className="font-heading font-bold leading-tight" style={{ color: config.logoColor || (dark ? '#93c5fd' : '#3b82f6') }}>
          {config.logoText || 'Amir Nazir'}
        </span>
      )}
    </span>
  )
}

export default function LiveWebsiteEditor() {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()
  const isBuilderFrame = new URLSearchParams(location.search).get('builder') === '1'
  const slug = useMemo(() => slugFromPath(location.pathname), [location.pathname])
  const shouldAutoOpen = new URLSearchParams(location.search).get('edit') === '1'

  // Don't show floating button in iframe builder mode
  if (isBuilderFrame) return null
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<EditorMode>('page')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [layout, setLayout] = useState<PageLayout | null>(null)
  const [header, setHeader] = useState<HeaderConfig>(DEFAULT_HEADER)
  const [footer, setFooter] = useState<FooterConfig>(DEFAULT_FOOTER)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cleanPreview, setCleanPreview] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  const isAdmin = isAuthenticated && user?.role === 'admin'
  const selectedSection = layout?.sections.find((item) => item.id === selectedSectionId) || null
  const selectedBlock = selectedSection?.blocks.find((item) => item.id === selectedBlockId) || null

  useEffect(() => {
    if (isAdmin && shouldAutoOpen && slug) setOpen(true)
  }, [isAdmin, shouldAutoOpen, slug])

  useEffect(() => {
    if (!open || !slug) return
    setLoading(true)
    Promise.all([
      api.get(`/admin/builder/${slug}`),
      api.get('/settings/public'),
    ])
      .then(([pageResponse, settingsResponse]) => {
        const loaded = pageResponse.data.data?.draft?.layout || pageResponse.data.data?.published?.layout || starterLayout(slug)
        setLayout(loaded)
        setSelectedSectionId(loaded.sections?.[0]?.id || null)
        setSelectedBlockId(null)
        const settings = settingsResponse.data.data || {}
        setHeader(safeParse(settings.builder_header, DEFAULT_HEADER))
        setFooter(safeParse(settings.builder_footer, DEFAULT_FOOTER))
      })
      .catch(() => toast.error('Could not load this page in the editor.'))
      .finally(() => setLoading(false))
  }, [open, slug])

  if (!isAdmin || !slug) return null

  const updateLayout = (next: PageLayout) => setLayout({ ...next, sections: [...next.sections] })
  const updateSection = (sectionId: string, patch: Partial<Section>) => {
    if (!layout) return
    updateLayout({ ...layout, sections: layout.sections.map((item) => item.id === sectionId ? { ...item, ...patch } : item) })
  }
  const updateBlock = (sectionId: string, blockId: string, props: Record<string, any>) => {
    if (!layout) return
    updateLayout({
      ...layout,
      sections: layout.sections.map((item) => item.id === sectionId
        ? { ...item, blocks: item.blocks.map((blockItem) => blockItem.id === blockId ? { ...blockItem, props } : blockItem) }
        : item),
    })
  }
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!layout) return
    const index = layout.sections.findIndex((s) => s.id === sectionId)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === layout.sections.length - 1) return
    const next = [...layout.sections]
    const swap = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swap]] = [next[swap], next[index]]
    updateLayout({ ...layout, sections: next })
  }
  const addSection = (type: string) => {
    if (!layout) return
    const next = type === 'cards'
      ? cards('Cards', 'New Section', 'New Card Section', 'Add your content here.', [['01', 'First Card', 'Edit this card.'], ['02', 'Second Card', 'Edit this card.'], ['03', 'Third Card', 'Edit this card.']])
      : makeSection('Content', '#ffffff', '#0f172a', [block('heading'), block('paragraph')], 'content')
    updateLayout({ ...layout, sections: [...layout.sections, next] })
    setSelectedSectionId(next.id)
    setSelectedBlockId(null)
    setMode('page')
  }
  const addBlock = (type: BlockType) => {
    if (!layout || !selectedSection) return
    const next = block(type)
    updateSection(selectedSection.id, { blocks: [...selectedSection.blocks, next] })
    setSelectedBlockId(next.id)
    setMode('page')
  }
  const deleteSelected = () => {
    if (!layout || !selectedSection) return
    if (selectedBlock) {
      updateSection(selectedSection.id, { blocks: selectedSection.blocks.filter((item) => item.id !== selectedBlock.id) })
      setSelectedBlockId(null)
      return
    }
    updateLayout({ ...layout, sections: layout.sections.filter((item) => item.id !== selectedSection.id) })
    setSelectedSectionId(layout.sections.find((item) => item.id !== selectedSection.id)?.id || null)
  }
  const save = async (publish = false) => {
    setSaving(true)
    try {
      if (mode === 'header' || mode === 'footer') {
        await api.put('/admin/settings', { settings: { builder_header: JSON.stringify(header), builder_footer: JSON.stringify(footer) } })
        toast.success('Site header/footer saved.')
        window.dispatchEvent(new Event('builder:settings-saved'))
        return
      }
      if (!layout || !slug) return
      await api.post(`/admin/builder/${slug}/save`, { layout })
      if (publish) await api.post(`/admin/builder/${slug}/publish`)
      toast.success(publish ? 'Page published.' : 'Draft saved.')
    } catch {
      toast.error('Could not save changes.')
    } finally {
      setSaving(false)
    }
  }
  const uploadImage = async (file: File | undefined, done: (url: string) => void) => {
    if (!file) return
    const form = new FormData()
    form.append('key', 'builder_upload')
    form.append('image', file)
    try {
      const response = await api.post('/admin/settings/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      done(response.data.url || response.data.data?.url)
      toast.success('Image uploaded.')
    } catch {
      toast.error('Image upload failed.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-blue-600/25 ring-2 ring-blue-400/40 transition hover:-translate-y-1 hover:bg-blue-600"
        title="Open website builder"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-500/25" />
        <Sparkles className="h-4 w-4 text-blue-200" />
        Website Builder
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-slate-950 text-slate-950">
          <div className="flex h-full flex-col lg:flex-row">
            <aside className="flex max-h-[48vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:max-h-none lg:w-[300px] lg:border-b-0 lg:border-r">
              <div className="flex h-12 items-center justify-between border-b border-slate-200 px-3 gap-2">
                <h3 className="font-semibold text-slate-900 text-sm truncate">/{slug === 'home' ? '' : slug}</h3>
                <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="border-b border-slate-200 p-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <ModeButton active={mode === 'page'} icon={Layers} label="Page" onClick={() => setMode('page')} />
                  <ModeButton active={mode === 'header'} icon={PanelTop} label="Header" onClick={() => setMode('header')} />
                  <ModeButton active={mode === 'footer'} icon={PanelBottom} label="Footer" onClick={() => setMode('footer')} />
                </div>
              </div>

              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {mode === 'page'
                  ? '📄 Click sections/blocks in preview to edit'
                  : mode === 'header'
                  ? '🎨 Edit header'
                  : '🔗 Edit footer'}
              </div>

              <div className="border-b border-slate-200 px-2 py-2">
                <div className="grid grid-cols-3 gap-1">
                  <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </button>
                  <button onClick={() => setCleanPreview(true)} disabled={saving} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                    <Sparkles className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {mode === 'page' && (
                <div className="border-b border-slate-200 px-2 py-2">
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => addSection('content')} title="Section" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><Layers className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addSection('cards')} title="Cards" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><FileText className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addBlock('heading')} title="Heading" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><Type className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addBlock('paragraph')} title="Text" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><AlignLeft className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addBlock('image')} title="Image" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ImageIcon className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addBlock('button')} title="Button" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><LinkIcon className="h-4 w-4 text-slate-600" /></button>
                    <button onClick={() => addBlock('contact-form')} title="Form" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><FileText className="h-4 w-4 text-slate-600" /></button>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading editor...</div>}
                {!loading && mode === 'page' && layout && (
                  <div className="space-y-5">
                    {selectedBlock && (
                      <ActiveEditorShell title="Selected Block" subtitle={`${selectedBlock.type} in ${selectedSection?.label || 'section'}`}>
                        <BlockEditor block={selectedBlock} onChange={(props) => updateBlock(selectedSection!.id, selectedBlock.id, props)} onUpload={uploadImage} />
                      </ActiveEditorShell>
                    )}
                    {!selectedBlock && selectedSection && (
                      <ActiveEditorShell title="Selected Section" subtitle={selectedSection.label}>
                        <SectionEditor section={selectedSection} onChange={(patch) => updateSection(selectedSection.id, patch)} />
                      </ActiveEditorShell>
                    )}
                    <SectionList sections={layout.sections} selectedId={selectedSectionId} onSelect={(id) => { setSelectedSectionId(id); setSelectedBlockId(null) }} onMoveUp={(id) => moveSection(id, 'up')} onMoveDown={(id) => moveSection(id, 'down')} />
                    {(selectedSection || selectedBlock) && (
                      <button onClick={deleteSelected} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" /> Delete selected
                      </button>
                    )}
                  </div>
                )}
                {!loading && mode === 'header' && <HeaderEditor header={header} setHeader={setHeader} onUpload={uploadImage} />}
                {!loading && mode === 'footer' && <FooterEditor footer={footer} setFooter={setFooter} onUpload={uploadImage} />}
              </div>
            </aside>

            <main className="min-w-0 flex-1 overflow-y-auto bg-slate-100 p-3 md:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <button onClick={() => setViewport('desktop')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${viewport === 'desktop' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}><Monitor className="h-4 w-4" /> Desktop</button>
                <button onClick={() => setViewport('mobile')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${viewport === 'mobile' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}><Smartphone className="h-4 w-4" /> Mobile</button>
                {cleanPreview && (
                  <button onClick={() => setCleanPreview(false)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                    <MousePointer2 className="h-4 w-4" /> Back to edit
                  </button>
                )}
              </div>
              <div className={`mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20 transition-all ${viewport === 'mobile' ? 'max-w-[390px]' : 'max-w-6xl'}`}>
                <HeaderPreview header={header} mobile={viewport === 'mobile'} selected={!cleanPreview && mode === 'header'} previewOnly={cleanPreview} onSelect={() => { if (!cleanPreview) setMode('header') }} />
                {layout ? (
                  <EditablePreview
                    layout={layout}
                    selectedSectionId={selectedSectionId}
                    selectedBlockId={selectedBlockId}
                    previewOnly={cleanPreview}
                    onSelectSection={(id) => { setMode('page'); setSelectedSectionId(id); setSelectedBlockId(null) }}
                    onSelectBlock={(sectionId, blockId) => { setMode('page'); setSelectedSectionId(sectionId); setSelectedBlockId(blockId) }}
                  />
                ) : (
                  <div className="p-20 text-center text-slate-500">Open a page to start editing.</div>
                )}
                <FooterPreview footer={footer} mobile={viewport === 'mobile'} selected={!cleanPreview && mode === 'footer'} previewOnly={cleanPreview} onSelect={() => { if (!cleanPreview) setMode('footer') }} />
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  )
}

function HeaderPreview({ header, mobile, selected, previewOnly, onSelect }: { header: HeaderConfig; mobile: boolean; selected: boolean; previewOnly?: boolean; onSelect: () => void }) {
  const visibleLinks = mobile ? header.navItems.slice(0, 3) : header.navItems
  return (
    <button onClick={onSelect} className={`block w-full bg-white px-5 py-4 text-left ${previewOnly ? '' : selected ? 'ring-4 ring-blue-500 ring-inset' : 'hover:ring-2 hover:ring-blue-300 hover:ring-inset'}`}>
      <div className="flex items-center justify-between gap-4">
        <LogoPreview config={header} />
        <div className={`items-center gap-4 ${mobile ? 'hidden' : 'flex'}`}>
          {visibleLinks.map((item) => <span key={item.url} className="text-sm font-medium text-slate-600">{item.label}</span>)}
        </div>
        <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{header.ctaText}</span>
      </div>
    </button>
  )
}

function FooterPreview({ footer, mobile, selected, previewOnly, onSelect }: { footer: FooterConfig; mobile: boolean; selected: boolean; previewOnly?: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`block w-full bg-slate-950 px-5 py-10 text-left text-white ${previewOnly ? '' : selected ? 'ring-4 ring-blue-500 ring-inset' : 'hover:ring-2 hover:ring-blue-300 hover:ring-inset'}`}>
      <div className={`grid gap-8 ${mobile ? 'grid-cols-1' : 'md:grid-cols-4'}`}>
        <div>
          <LogoPreview config={footer} dark />
          <p className="mt-3 text-sm leading-6 text-white/55">{footer.description}</p>
          {footer.socialLinks?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {footer.socialLinks.map((item) => (
                <span key={`${item.label}-${item.url}`} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-bold text-white/70">
                  {item.iconImage ? <img src={item.iconImage} alt={item.label} className="h-full w-full object-cover" /> : (item.icon || item.label.slice(0, 2))}
                </span>
              ))}
            </div>
          )}
        </div>
        <div><p className="mb-3 text-xs font-bold uppercase text-white/80">Services</p>{footer.services.slice(0, 6).map((item) => <p key={item} className="mb-2 text-sm text-white/50">{item}</p>)}</div>
        <div><p className="mb-3 text-xs font-bold uppercase text-white/80">Quick Links</p>{footer.quickLinks.slice(0, 6).map((item) => <p key={item.url} className="mb-2 text-sm text-white/50">{item.label}</p>)}</div>
        <div><p className="mb-3 text-xs font-bold uppercase text-white/80">Contact</p><p className="text-sm text-white/50">{footer.email}</p><p className="mt-2 text-sm text-white/50">{footer.phone}</p></div>
      </div>
    </button>
  )
}

function animationClass(value?: string) {
  if (value === 'fade') return 'animate-fade-in'
  if (value === 'slide') return 'animate-slide-up'
  return ''
}

function blockSpan(block: Block) {
  if (block.props?.width === 'half') return 'md:col-span-6'
  if (block.props?.width === 'third') return 'md:col-span-4'
  if (block.props?.width === 'quarter') return 'md:col-span-3'
  if (block.type === 'card') return 'md:col-span-4'
  if (block.type === 'stat') return 'md:col-span-3'
  return 'md:col-span-12'
}

function minHeightClass(value?: string) {
  if (value === 'screen') return 'min-h-screen'
  if (value === 'large') return 'min-h-[720px]'
  if (value === 'medium') return 'min-h-[520px]'
  if (value === 'small') return 'min-h-[360px]'
  return ''
}

function gridColsClass(value?: string) {
  if (value === '1') return 'md:grid-cols-1'
  if (value === '2') return 'md:grid-cols-2'
  if (value === '3') return 'md:grid-cols-3'
  if (value === '4') return 'md:grid-cols-4'
  if (value === '6') return 'md:grid-cols-6'
  return 'md:grid-cols-12'
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

function EditablePreview({ layout, selectedSectionId, selectedBlockId, previewOnly, onSelectSection, onSelectBlock }: { layout: PageLayout; selectedSectionId: string | null; selectedBlockId: string | null; previewOnly?: boolean; onSelectSection: (id: string) => void; onSelectBlock: (sectionId: string, blockId: string) => void }) {
  return (
    <div>
      {layout.sections.filter((sectionItem) => !sectionItem.hidden).map((sectionItem) => (
        <section key={sectionItem.id} onClick={() => { if (!previewOnly) onSelectSection(sectionItem.id) }} style={{ backgroundColor: sectionItem.bg, color: sectionItem.textColor }} className={`relative flex items-center ${previewOnly ? '' : 'cursor-pointer'} ${sectionItem.padding || 'py-20'} ${minHeightClass(sectionItem.minHeight)} ${animationClass(sectionItem.animation)} ${previewOnly ? '' : selectedSectionId === sectionItem.id ? 'ring-4 ring-blue-500 ring-inset' : 'hover:ring-2 hover:ring-blue-300 hover:ring-inset'}`}>
          {!previewOnly && <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{sectionItem.label}</div>}
          <div className={`${sectionItem.maxWidth || 'max-w-7xl'} mx-auto px-5`}>
            <div className={`grid ${sectionItem.gap || 'gap-5'} ${gridColsClass(sectionItem.columns)}`}>
              {sectionItem.blocks.map((blockItem) => (
                <div key={blockItem.id} onClick={(event) => { event.stopPropagation(); if (!previewOnly) onSelectBlock(sectionItem.id, blockItem.id) }} className={`rounded-xl transition ${blockSpan(blockItem)} ${animationClass(blockItem.props?.animation)} ${previewOnly ? '' : selectedBlockId === blockItem.id ? 'ring-4 ring-amber-400' : 'hover:ring-2 hover:ring-amber-300'}`}>
                  <PreviewBlock block={blockItem} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

function LiveDynamicGridPreview({ block }: { block: Block }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const props = block.props || {}
  const limit = Number(props.limit || 6)

  useEffect(() => {
    setLoading(true)
    const fetchEndpoint = block.type === 'packages-grid' ? '/public/packages' : block.type === 'portfolio-grid' ? '/public/portfolio' : '/public/blog'
    api
      .get(fetchEndpoint)
      .then((r) => {
        const data = r.data?.data || []
        setItems(data.slice(0, limit))
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [block.type, limit])

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-400"><p className="text-xs font-semibold uppercase text-blue-600">Loading live data…</p></div>

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {(props.title || props.subtitle) && (
        <div className="mb-6 text-center">
          {props.title && <h3 className="font-heading text-2xl font-bold text-slate-950">{props.title}</h3>}
          {props.subtitle && <p className="mt-2 text-sm text-slate-600">{props.subtitle}</p>}
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-center text-sm text-slate-500">No items yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id || item.slug} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              {block.type === 'portfolio-grid' && item.thumbnail && (
                <img src={assetUrl(`/storage/${item.thumbnail}`)} alt={item.title} className="mb-3 aspect-video w-full rounded-lg object-cover" />
              )}
              {block.type === 'blog-grid' && item.featured_image && (
                <img src={assetUrl(`/storage/${item.featured_image}`)} alt={item.title} className="mb-3 aspect-video w-full rounded-lg object-cover" />
              )}
              <h4 className="font-heading text-sm font-semibold text-slate-950">{item.name || item.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.short_description || item.excerpt || item.description}</p>
              {block.type === 'packages-grid' && (
                <p className="mt-2 font-heading text-lg font-bold text-slate-950">
                  {Number(item.price) === 0 ? 'Custom' : `$${Number(item.price).toLocaleString()}`}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewBlock({ block }: { block: Block }) {
  const props = block.props || {}
  if (block.type === 'heading') return <h2 style={{ color: props.color, textAlign: props.align }} className={`${props.size || 'text-3xl'} ${fontFamilyClass(props.fontFamily)} ${fontWeightClass(props.fontWeight)} ${lineHeightClass(props.lineHeight)}`}>{props.text}</h2>
  if (block.type === 'paragraph') return <p style={{ color: props.color, textAlign: props.align }} className={`text-base ${fontFamilyClass(props.fontFamily)} ${fontWeightClass(props.fontWeight)} ${lineHeightClass(props.lineHeight)}`}>{props.text}</p>
  if (block.type === 'button') {
    const cls = props.style === 'white' ? 'bg-white text-slate-950' : props.style === 'outline' ? 'border border-current bg-transparent' : 'bg-blue-600 text-white'
    return <div style={{ textAlign: props.align || 'center' }}><span className={`inline-flex rounded-xl px-6 py-3 text-sm font-semibold ${cls}`}>{props.text}</span></div>
  }
  if (block.type === 'image') return <img src={props.src} alt={props.alt || ''} className={`w-full ${imageHeightClass(props.height)} ${props.objectFit || 'object-cover'} ${props.rounded === false ? '' : 'rounded-2xl'}`} />
  if (block.type === 'card') return <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">{props.icon}</div><h3 className="mb-2 font-heading text-lg font-semibold text-slate-950">{props.title}</h3><p className="text-sm leading-6 text-slate-600">{props.body}</p></article>
  if (block.type === 'stat') return <div className="text-center"><div className="font-heading text-4xl font-bold">{props.number}</div><div className="mt-2 text-sm opacity-70">{props.label}</div></div>
  if (block.type === 'faq-item') return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-950">{props.question}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{props.answer}</p></article>
  if (block.type === 'contact-form') {
    const fields = Array.isArray(props.fields) ? props.fields : []
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        {props.title && <h3 className="font-heading text-2xl font-bold text-slate-950">{props.title}</h3>}
        {props.description && <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((field: any) => (
            <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <p className="mb-1 text-xs font-semibold text-slate-500">{field.label}{field.required ? ' *' : ''}</p>
              {field.type === 'textarea' ? (
                <textarea readOnly rows={4} placeholder={field.placeholder} className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400" />
              ) : (
                <input readOnly type={field.type === 'email' ? 'email' : 'text'} placeholder={field.placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">{props.submitText || 'Send Message'}</div>
      </div>
    )
  }
  if (block.type === 'packages-grid' || block.type === 'portfolio-grid' || block.type === 'blog-grid') return <LiveDynamicGridPreview block={block} />
  return null
}

function SectionList({ sections, selectedId, onSelect, onMoveUp, onMoveDown }: { sections: Section[]; selectedId: string | null; onSelect: (id: string) => void; onMoveUp?: (id: string) => void; onMoveDown?: (id: string) => void }) {
  return <div><PanelTitle icon={Layers} title="Page Sections" /><div className="mt-2 space-y-2">{sections.map((sectionItem, index) => (
    <div key={sectionItem.id} className="flex items-center gap-1">
      <button onClick={() => onSelect(sectionItem.id)} className={`flex-1 flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${selectedId === sectionItem.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
        <span>{index + 1}. {sectionItem.label}</span>
        {sectionItem.hidden && <span className="text-xs text-slate-400">hidden</span>}
      </button>
      <div className="flex gap-0.5">
        {onMoveUp && index > 0 && <button onClick={() => onMoveUp(sectionItem.id)} className="rounded px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><ChevronUp className="h-4 w-4" /></button>}
        {onMoveDown && index < sections.length - 1 && <button onClick={() => onMoveDown(sectionItem.id)} className="rounded px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><ChevronDown className="h-4 w-4" /></button>}
      </div>
    </div>
  ))}</div></div>
}

function ActiveEditorShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3">
      <div className="mb-3 rounded-xl bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{title}</p>
        <p className="truncate font-heading text-sm font-bold text-slate-950">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function SectionEditor({ section, onChange }: { section: Section; onChange: (patch: Partial<Section>) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <PanelTitle icon={Settings} title="Section Settings" />
      <div className="mt-3 space-y-3">
        <Input label="Section Name" value={section.label} onChange={(label) => onChange({ label })} />
        <ColorField label="Background" value={section.bg} onChange={(bg) => onChange({ bg })} />
        <ColorField label="Text Color" value={section.textColor} onChange={(textColor) => onChange({ textColor })} />
        <SelectField label="Container Width" value={section.maxWidth} onChange={(maxWidth) => onChange({ maxWidth })} options={[['max-w-5xl', 'Narrow'], ['max-w-7xl', 'Normal'], ['max-w-none', 'Full width']]} />
        <SelectField label="Columns" value={section.columns || '12'} onChange={(columns) => onChange({ columns })} options={[['12', '12 column grid'], ['6', '6 columns'], ['4', '4 columns'], ['3', '3 columns'], ['2', '2 columns'], ['1', '1 column']]} />
        <SelectField label="Column Gap" value={section.gap || 'gap-5'} onChange={(gap) => onChange({ gap })} options={[['gap-2', 'Tight'], ['gap-5', 'Normal'], ['gap-8', 'Wide'], ['gap-12', 'Extra wide']]} />
        <SelectField label="Height" value={section.minHeight || 'none'} onChange={(minHeight) => onChange({ minHeight })} options={[['none', 'Auto'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['screen', 'Full screen']]} />
        <SelectField label="Spacing" value={section.padding} onChange={(padding) => onChange({ padding })} options={[['py-8', 'Small'], ['py-12', 'Compact'], ['py-20', 'Comfortable'], ['py-28', 'Large'], ['py-36', 'Extra large']]} />
        <SelectField label="Animation" value={section.animation || 'none'} onChange={(animation) => onChange({ animation })} options={[['none', 'None'], ['fade', 'Fade in'], ['slide', 'Slide up']]} />
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
          Hide section
          <input type="checkbox" checked={!!section.hidden} onChange={(event) => onChange({ hidden: event.target.checked })} className="h-4 w-4 accent-blue-600" />
        </label>
      </div>
    </div>
  )
}

function BlockEditor({ block, onChange, onUpload }: { block: Block; onChange: (props: Record<string, any>) => void; onUpload: (file: File | undefined, done: (url: string) => void) => void }) {
  const props = block.props || {}
  const set = (patch: Record<string, any>) => onChange({ ...props, ...patch })
  return <div className="rounded-xl border border-slate-200 p-4"><PanelTitle icon={Type} title={`Edit ${block.type}`} /><div className="mt-3 space-y-3">
    {block.type === 'heading' && <><TextArea label="Text" value={props.text} onChange={(text) => set({ text })} /><SelectField label="Size" value={props.size} onChange={(size) => set({ size })} options={[['text-2xl', 'Small'], ['text-3xl', 'Medium'], ['text-5xl', 'Large'], ['text-6xl', 'Hero']]} /><SelectField label="Align" value={props.align} onChange={(align) => set({ align })} options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} /><ColorField label="Color" value={props.color} onChange={(color) => set({ color })} /></>}
    {block.type === 'paragraph' && <><TextArea label="Text" value={props.text} onChange={(text) => set({ text })} /><SelectField label="Align" value={props.align} onChange={(align) => set({ align })} options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} /><ColorField label="Color" value={props.color} onChange={(color) => set({ color })} /></>}
    {block.type === 'image' && <><ImageUpload label="Content Image" help="Main image for this selected page block." value={props.src} alt={props.alt} onUpload={onUpload} onChange={(src) => set({ src })} /><Input label="Image URL" value={props.src} onChange={(src) => set({ src })} /><Input label="Alt Text" value={props.alt} onChange={(alt) => set({ alt })} /></>}
    {block.type === 'button' && <><Input label="Button Text" value={props.text} onChange={(text) => set({ text })} /><Input label="URL" value={props.url} onChange={(url) => set({ url })} /><SelectField label="Style" value={props.style} onChange={(style) => set({ style })} options={[['primary', 'Primary'], ['white', 'White'], ['outline', 'Outline']]} /><SelectField label="Align" value={props.align} onChange={(align) => set({ align })} options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} /></>}
    {block.type === 'card' && <><Input label="Icon / Number" value={props.icon} onChange={(icon) => set({ icon })} /><Input label="Title" value={props.title} onChange={(title) => set({ title })} /><TextArea label="Body" value={props.body} onChange={(body) => set({ body })} /></>}
    {block.type === 'stat' && <><Input label="Number / Value" value={props.number} onChange={(number) => set({ number })} /><Input label="Label" value={props.label} onChange={(label) => set({ label })} /></>}
    {block.type === 'faq-item' && <><Input label="Question" value={props.question} onChange={(question) => set({ question })} /><TextArea label="Answer" value={props.answer} onChange={(answer) => set({ answer })} /></>}
    {block.type === 'contact-form' && <FormControls props={props} set={set} />}
    {(block.type === 'packages-grid' || block.type === 'portfolio-grid' || block.type === 'blog-grid') && <><Input label="Title" value={props.title} onChange={(title) => set({ title })} /><TextArea label="Subtitle" value={props.subtitle} onChange={(subtitle) => set({ subtitle })} /><Input label="Items Limit" value={String(props.limit || 6)} onChange={(limit) => set({ limit: Number(limit) || 1 })} /><Input label="Button Text" value={props.buttonText} onChange={(buttonText) => set({ buttonText })} /></>}
    <BlockStyleControls type={block.type} props={props} set={set} />
  </div></div>
}

function BlockStyleControls({ type, props, set }: { type: BlockType; props: Record<string, any>; set: (patch: Record<string, any>) => void }) {
  const isText = type === 'heading' || type === 'paragraph'
  const isImage = type === 'image'

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3">
      <PanelTitle icon={Settings} title="Style & Layout" />
      <SelectField label="Block Width" value={props.width || 'full'} onChange={(width) => set({ width })} options={[['full', 'Full width'], ['half', 'Half'], ['third', 'One third'], ['quarter', 'One quarter'], ['auto', 'Auto']]} />
      <SelectField label="Animation" value={props.animation || 'none'} onChange={(animation) => set({ animation })} options={[['none', 'None'], ['fade', 'Fade in'], ['slide', 'Slide up']]} />
      {isText && (
        <>
          <SelectField label="Font Family" value={props.fontFamily || (type === 'heading' ? 'heading' : 'sans')} onChange={(fontFamily) => set({ fontFamily })} options={[['heading', 'Heading font'], ['sans', 'Body font']]} />
          <SelectField label="Font Weight" value={props.fontWeight || (type === 'heading' ? 'bold' : 'normal')} onChange={(fontWeight) => set({ fontWeight })} options={[['normal', 'Normal'], ['medium', 'Medium'], ['semibold', 'Semi bold'], ['bold', 'Bold'], ['extrabold', 'Extra bold']]} />
          <SelectField label="Line Height" value={props.lineHeight || 'normal'} onChange={(lineHeight) => set({ lineHeight })} options={[['tight', 'Tight'], ['normal', 'Normal'], ['relaxed', 'Relaxed'], ['loose', 'Loose']]} />
        </>
      )}
      {isImage && (
        <>
          <SelectField label="Image Height" value={props.height || 'auto'} onChange={(height) => set({ height })} options={[['auto', 'Auto'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['full', 'Full height']]} />
          <SelectField label="Image Fit" value={props.objectFit || 'object-cover'} onChange={(objectFit) => set({ objectFit })} options={[['object-cover', 'Cover'], ['object-contain', 'Contain'], ['object-fill', 'Fill']]} />
        </>
      )}
    </div>
  )
}

function FormControls({ props, set }: { props: Record<string, any>; set: (patch: Record<string, any>) => void }) {
  const fields = Array.isArray(props.fields) ? props.fields : []
  const updateField = (index: number, patch: Record<string, any>) => {
    set({ fields: fields.map((field: any, fieldIndex: number) => fieldIndex === index ? { ...field, ...patch } : field) })
  }

  return (
    <div className="space-y-3">
      <Input label="Form Title" value={props.title} onChange={(title) => set({ title })} />
      <TextArea label="Description" value={props.description} onChange={(description) => set({ description })} />
      <Input label="Submit Button Text" value={props.submitText} onChange={(submitText) => set({ submitText })} />
      <Input label="Success Message" value={props.successMessage} onChange={(successMessage) => set({ successMessage })} />
      <PanelTitle icon={FileText} title="Form Fields" />
      {fields.map((field: any, index: number) => (
        <div key={`${field.key}-${index}`} className="space-y-2 rounded-xl border border-slate-200 p-3">
          <Input label="Field Key" value={field.key} onChange={(key) => updateField(index, { key: key.toLowerCase().replace(/[^a-z0-9_]+/g, '_') })} />
          <Input label="Label" value={field.label} onChange={(label) => updateField(index, { label })} />
          <Input label="Placeholder" value={field.placeholder} onChange={(placeholder) => updateField(index, { placeholder })} />
          <SelectField label="Type" value={field.type || 'text'} onChange={(type) => updateField(index, { type })} options={[['text', 'Text'], ['email', 'Email'], ['textarea', 'Textarea']]} />
          <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            Required
            <input type="checkbox" checked={!!field.required} onChange={(event) => updateField(index, { required: event.target.checked })} className="h-4 w-4 accent-blue-600" />
          </label>
          <button onClick={() => set({ fields: fields.filter((_: any, fieldIndex: number) => fieldIndex !== index) })} className="w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
            Remove Field
          </button>
        </div>
      ))}
      <button
        onClick={() => set({ fields: [...fields, { key: `field_${fields.length + 1}`, label: 'New Field', placeholder: 'Enter value', type: 'text', required: false }] })}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Add Field
      </button>
    </div>
  )
}

function HeaderEditor({ header, setHeader, onUpload }: { header: HeaderConfig; setHeader: (header: HeaderConfig) => void; onUpload: (file: File | undefined, done: (url: string) => void) => void }) {
  const updateNav = (index: number, patch: Partial<{ label: string; url: string }>) => {
    setHeader({ ...header, navItems: header.navItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  const removeNav = (index: number) => {
    setHeader({ ...header, navItems: header.navItems.filter((_, itemIndex) => itemIndex !== index) })
  }

  return (
    <div className="space-y-4">
      <PanelTitle icon={PanelTop} title="Header" />
      <ImageUpload label="Main Header Logo" help="Used on the transparent/dark website header." value={header.logoImage} alt={header.logoText} onUpload={onUpload} onChange={(logoImage) => setHeader({ ...header, logoImage })} />
      <ImageUpload label="Light Header Logo" help="Used when the header background is white or in the mobile menu." value={header.logoImageLight} alt={`${header.logoText} light`} onUpload={onUpload} onChange={(logoImageLight) => setHeader({ ...header, logoImageLight })} />
      <ImageUpload label="Browser Favicon" help="Small icon shown in the browser tab and bookmarks." value={header.favicon} alt="Site favicon" onUpload={onUpload} onChange={(favicon) => setHeader({ ...header, favicon })} />
      <Input label="Logo Text" value={header.logoText} onChange={(logoText) => setHeader({ ...header, logoText })} />
      <ColorField label="Logo Color" value={header.logoColor} onChange={(logoColor) => setHeader({ ...header, logoColor })} />
      <Input label="Logo Background CSS" value={header.logoBg || 'transparent'} onChange={(logoBg) => setHeader({ ...header, logoBg })} />
      <Input label="Logo Width (px)" value={header.logoWidth || '160'} onChange={(logoWidth) => setHeader({ ...header, logoWidth })} />
      <Input label="Logo Height (px)" value={header.logoHeight || '40'} onChange={(logoHeight) => setHeader({ ...header, logoHeight })} />
      <Input label="Logo Padding (px)" value={header.logoPadding || '0'} onChange={(logoPadding) => setHeader({ ...header, logoPadding })} />
      <Input label="Logo Radius (px)" value={header.logoRadius || '8'} onChange={(logoRadius) => setHeader({ ...header, logoRadius })} />
      <Input label="CTA Text" value={header.ctaText} onChange={(ctaText) => setHeader({ ...header, ctaText })} />
      <Input label="CTA URL" value={header.ctaUrl} onChange={(ctaUrl) => setHeader({ ...header, ctaUrl })} />

      <PanelTitle icon={LinkIcon} title="Navigation" />
      {header.navItems.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-2">
          <Input label="Label" value={item.label} onChange={(label) => updateNav(index, { label })} />
          <Input label="URL" value={item.url} onChange={(url) => updateNav(index, { url })} />
          <button onClick={() => removeNav(index)} className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
            Delete Navigation Link
          </button>
        </div>
      ))}
      <button onClick={() => setHeader({ ...header, navItems: [...header.navItems, { label: 'New Link', url: '/' }] })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Add Navigation Link
      </button>
    </div>
  )
}

function FooterEditor({ footer, setFooter, onUpload }: { footer: FooterConfig; setFooter: (footer: FooterConfig) => void; onUpload: (file: File | undefined, done: (url: string) => void) => void }) {
  const updateLink = (index: number, patch: Partial<{ label: string; url: string }>) => setFooter({ ...footer, quickLinks: footer.quickLinks.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  const updateSocial = (index: number, patch: Partial<{ label: string; url: string; icon: string; iconImage: string }>) => {
    setFooter({ ...footer, socialLinks: (footer.socialLinks || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  return (
    <div className="space-y-4">
      <PanelTitle icon={PanelBottom} title="Footer" />
      <ImageUpload label="Footer Logo" help="Logo shown in the website footer." value={footer.logoImage} alt={footer.logoText} onUpload={onUpload} onChange={(logoImage) => setFooter({ ...footer, logoImage })} />
      <Input label="Logo Text" value={footer.logoText} onChange={(logoText) => setFooter({ ...footer, logoText })} />
      <ColorField label="Logo Color" value={footer.logoColor || '#93c5fd'} onChange={(logoColor) => setFooter({ ...footer, logoColor })} />
      <Input label="Logo Background CSS" value={footer.logoBg || 'transparent'} onChange={(logoBg) => setFooter({ ...footer, logoBg })} />
      <Input label="Logo Width (px)" value={footer.logoWidth || '176'} onChange={(logoWidth) => setFooter({ ...footer, logoWidth })} />
      <Input label="Logo Height (px)" value={footer.logoHeight || '44'} onChange={(logoHeight) => setFooter({ ...footer, logoHeight })} />
      <Input label="Logo Padding (px)" value={footer.logoPadding || '0'} onChange={(logoPadding) => setFooter({ ...footer, logoPadding })} />
      <Input label="Logo Radius (px)" value={footer.logoRadius || '8'} onChange={(logoRadius) => setFooter({ ...footer, logoRadius })} />
      <TextArea label="Description" value={footer.description} onChange={(description) => setFooter({ ...footer, description })} />
      <Input label="Email" value={footer.email} onChange={(email) => setFooter({ ...footer, email })} />
      <Input label="Phone" value={footer.phone} onChange={(phone) => setFooter({ ...footer, phone })} />
      <Input label="Copyright" value={footer.copyright} onChange={(copyright) => setFooter({ ...footer, copyright })} />
      <TextArea label="Services - one per line" value={footer.services.join('\n')} onChange={(value) => setFooter({ ...footer, services: value.split('\n').filter(Boolean) })} />

      <PanelTitle icon={Sparkles} title="Social Links" />
      {(footer.socialLinks || []).map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-2">
          <Input label="Name" value={item.label} onChange={(label) => updateSocial(index, { label })} />
          <Input label="URL" value={item.url} onChange={(url) => updateSocial(index, { url })} />
          <Input label="Icon Text" value={item.icon} onChange={(icon) => updateSocial(index, { icon })} />
          <ImageUpload label="Social Icon Image" help="Optional uploaded icon for this social link." value={item.iconImage} alt={item.label} onUpload={onUpload} onChange={(iconImage) => updateSocial(index, { iconImage })} />
          <button onClick={() => setFooter({ ...footer, socialLinks: footer.socialLinks.filter((_, itemIndex) => itemIndex !== index) })} className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
            Remove Social Link
          </button>
        </div>
      ))}
      <button onClick={() => setFooter({ ...footer, socialLinks: [...(footer.socialLinks || []), { label: 'New Social', url: '#', icon: 'S', iconImage: '' }] })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Add Social Link
      </button>

      <PanelTitle icon={LinkIcon} title="Quick Links" />
      {footer.quickLinks.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-2">
          <Input label="Label" value={item.label} onChange={(label) => updateLink(index, { label })} />
          <Input label="URL" value={item.url} onChange={(url) => updateLink(index, { url })} />
        </div>
      ))}
      <button onClick={() => setFooter({ ...footer, quickLinks: [...footer.quickLinks, { label: 'New Link', url: '/' }] })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Add Quick Link
      </button>
    </div>
  )
}

function ImageUpload({ label, help, value, alt, onChange, onUpload }: { label: string; help?: string; value?: string; alt?: string; onChange: (src: string) => void; onUpload: (file: File | undefined, done: (url: string) => void) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {help && <p className="mt-0.5 text-xs leading-5 text-slate-500">{help}</p>}
      </div>
      {value ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-white p-2">
          <img src={value} alt={alt || ''} className="h-24 w-full rounded-md object-contain" />
        </div>
      ) : (
        <div className="mb-3 flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400">
          No image selected
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
        <UploadCloud className="h-4 w-4" /> Upload / Change
        <input type="file" accept="image/*" className="hidden" onChange={(event) => onUpload(event.target.files?.[0], onChange)} />
      </label>
    </div>
  )
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Icon className="h-4 w-4" />{label}</button>
}

function ToolButton({ icon: Icon, label, description, onClick, compact }: { icon: any; label: string; description?: string; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={description || label}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-3 text-center font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition ${
        compact
          ? 'min-h-auto text-xs'
          : 'min-h-20 text-xs'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className={compact ? 'text-[11px] leading-tight' : 'text-xs'}>{label}</span>
      {description && <span className={`line-clamp-1 font-normal text-slate-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{description}</span>}
    </button>
  )
}

function PanelTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return <div className="flex items-center gap-2 text-sm font-bold text-slate-950"><Icon className="h-4 w-4 text-blue-600" />{title}</div>
}

function Input({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><input value={value || ''} onChange={(event) => onChange(event.target.value)} className={FIELD} /></label>
}

function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><textarea value={value || ''} rows={4} onChange={(event) => onChange(event.target.value)} className={`${FIELD} min-h-24 resize-y`} /></label>
}

function SelectField({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><select value={value || options[0][0]} onChange={(event) => onChange(event.target.value)} className={FIELD}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><div className="flex gap-2"><input type="color" value={value || '#ffffff'} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 rounded-lg border border-slate-200 bg-white p-1" /><input value={value || ''} onChange={(event) => onChange(event.target.value)} className={FIELD} /></div></label>
}
