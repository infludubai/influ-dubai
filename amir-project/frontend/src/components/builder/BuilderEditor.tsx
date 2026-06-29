/**
 * BuilderEditor — single definitive full-screen builder.
 * Replaces the old floating overlay. Dark premium design matching admin panel.
 * Left: Layers tree + Properties. Right: live iframe (real navbar + sections + footer).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronRight, ChevronUp,
  Clock3, Eye, History, Layers, Loader2, Monitor, Plus, RefreshCw,
  Redo2, RotateCcw, Save, Settings, Smartphone, Sparkles, Tablet, Trash2, Undo2, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { assetUrl } from '@/utils/assets'
import { safeSessionStorage } from '@/utils/safeStorage'
import { BUILDER_CHANNEL, type ParentToFrameMessage, type FrameToParentMessage } from './builderBridge'

// ─── Types ───────────────────────────────────────────────────────────────────

type BlockType =
  | 'heading' | 'paragraph' | 'image' | 'button' | 'card' | 'stat'
  | 'faq-item' | 'contact-form' | 'packages-grid' | 'portfolio-grid' | 'blog-grid'
  | 'testimonial' | 'divider' | 'spacer' | 'video'

type Block = { id: string; type: BlockType; props: Record<string, any> }

type Section = {
  id: string; type: string; label: string
  bg: string; textColor: string; padding: string
  maxWidth: string; columns?: string; gap?: string
  minHeight?: string; animation?: string; hidden?: boolean
  design?: Record<string, any>
  blocks: Block[]
}

type PageLayout = { sections: Section[]; meta?: { title?: string; description?: string } }
type BuilderPanel = 'layers' | 'add' | 'props'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ControlTab = 'content' | 'layout' | 'style' | 'advanced'
type BuilderVersion = {
  id: number
  version: number
  status: string
  layout: PageLayout
  published_at?: string
  created_at?: string
  creator?: { id: number; name: string }
}
type BuilderSnapshot = {
  layout: PageLayout
  header: HeaderConfig
  footer: FooterConfig
  pageSettings: Record<string, string>
}

// ─── Page map ────────────────────────────────────────────────────────────────

const CORE_PAGES = [
  { slug: 'home',      title: 'Home',          path: '/'         },
  { slug: 'services',  title: 'Services',       path: '/services' },
  { slug: 'portfolio', title: 'Portfolio',      path: '/portfolio'},
  { slug: 'pricing',   title: 'Pricing',        path: '/pricing'  },
  { slug: 'about',     title: 'About',          path: '/about'    },
  { slug: 'blog',      title: 'Blog',           path: '/blog'     },
  { slug: 'contact',   title: 'Contact',        path: '/contact'  },
  { slug: 'privacy',   title: 'Privacy Policy', path: '/privacy'  },
  { slug: 'terms',     title: 'Terms',          path: '/terms'    },
]

function publicPath(slug: string) {
  return CORE_PAGES.find(p => p.slug === slug)?.path || `/p/${slug}`
}

// ─── Layout helpers (same as LiveWebsiteEditor) ────────────────────────────

function uid(prefix = 'b') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`
}

function blk(type: BlockType, props: Record<string, any> = {}): Block {
  const defaults: Record<BlockType, Record<string, any>> = {
    heading:        { text: 'New Heading', size: 'text-3xl', align: 'left', color: '#0f172a', fontWeight: 'bold', lineHeight: 'tight', animation: 'none' },
    paragraph:      { text: 'Add your text here.', align: 'left', color: '#475569', fontWeight: 'normal', lineHeight: 'relaxed', animation: 'none' },
    image:          { src: '', alt: '', rounded: true, objectFit: 'object-cover', animation: 'none' },
    button:         { text: 'Click Here', url: '#', style: 'primary', align: 'center', animation: 'none' },
    card:           { icon: '01', title: 'Card Title', body: 'Card description goes here.', animation: 'none' },
    stat:           { number: '100+', label: 'Metric Label', animation: 'none' },
    'faq-item':     { question: 'Question?', answer: 'Answer goes here.', animation: 'none' },
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
    'packages-grid':  { title: 'Choose Your Package', subtitle: 'Live packages from your package manager.', limit: 6, buttonText: 'Get Started', emptyText: 'No packages yet.' },
    'portfolio-grid': { title: 'Recent Work', subtitle: 'Live portfolio items from your portfolio manager.', limit: 6, buttonText: 'View Project', emptyText: 'No projects yet.' },
    'blog-grid':      { title: 'Latest Articles', subtitle: 'Live posts from your blog manager.', limit: 6, buttonText: 'Read', emptyText: 'No posts yet.' },
    testimonial:      { quote: 'This service was absolutely incredible. Highly recommended!', author: 'Jane Smith', role: 'CEO, Acme Inc.', avatar: '', rating: 5, animation: 'none' },
    video:            { url: '', caption: '', aspect: '16/9' },
    divider:          { color: '#e2e8f0', style: 'solid' },
    spacer:           { height: 40 },
  }
  return { id: uid(type), type, props: { ...defaults[type], ...props } }
}

function sec(label: string, bg: string, textColor: string, blocks: Block[], type = 'content'): Section {
  return { id: uid('sec'), type, label, bg, textColor, padding: 'py-20', maxWidth: 'max-w-7xl', columns: '12', gap: 'gap-5', minHeight: 'none', animation: 'none', blocks }
}

function heroSec(eyebrow: string, title: string, copy: string, btn1: string, url1: string, btn2?: string, url2?: string): Section {
  const blocks = [
    blk('paragraph', { text: eyebrow, align: 'center', color: '#38bdf8' }),
    blk('heading',   { text: title, size: 'text-5xl', align: 'center', color: '#ffffff', fontWeight: 'bold' }),
    blk('paragraph', { text: copy, align: 'center', color: '#cbd5e1' }),
    blk('button',    { text: btn1, url: url1, style: 'primary', align: 'center' }),
  ]
  if (btn2 && url2) blocks.push(blk('button', { text: btn2, url: url2, style: 'outline', align: 'center' }))
  return { ...sec('Hero', '#0f172a', '#ffffff', blocks, 'hero'), maxWidth: 'max-w-5xl' }
}

function cardSec(label: string, eyebrow: string, title: string, copy: string, items: [string, string, string][], bg = '#ffffff'): Section {
  return sec(label, bg, '#0f172a', [
    blk('paragraph', { text: eyebrow, align: 'center', color: '#2563eb' }),
    blk('heading',   { text: title, size: 'text-3xl', align: 'center', color: '#0f172a', fontWeight: 'bold' }),
    blk('paragraph', { text: copy, align: 'center', color: '#64748b' }),
    ...items.map(([icon, t, b]) => blk('card', { icon, title: t, body: b })),
  ], 'cards')
}

function starterLayout(slug: string): PageLayout {
  if (slug === 'home') return { sections: [
    heroSec('Premium Digital Services', 'Build Your Digital Presence', 'Web design, development, SEO, and marketing services that turn your vision into a polished online business.', 'View Packages', '/pricing', 'See My Work', '/portfolio'),
    cardSec('Services', 'What I Do', 'Services That Drive Results', 'Everything you need to grow online with a clean, premium presence.', [
      ['01', 'Web Design & Development', 'Fast, responsive websites built for trust and conversion.'],
      ['02', 'SEO Services', 'Technical and content SEO to improve search visibility.'],
      ['03', 'Digital Marketing', 'Campaigns, content, and strategy to grow your audience.'],
    ]),
    sec('Stats', '#f8fafc', '#0f172a', [
      blk('stat', { number: '50+', label: 'Projects Delivered' }),
      blk('stat', { number: '100%', label: 'Client Focus' }),
      blk('stat', { number: '5+', label: 'Years Experience' }),
      blk('stat', { number: '24/7', label: 'Support' }),
    ], 'stats'),
    sec('Packages', '#ffffff', '#0f172a', [blk('packages-grid')], 'packages'),
    sec('Portfolio', '#f8fafc', '#0f172a', [blk('portfolio-grid')], 'portfolio'),
  ]}

  if (slug === 'services') return { sections: [
    heroSec('What I Offer', 'Digital Services', 'Choose the right service for your business.', 'View Pricing', '/pricing', 'Request Quote', '/contact'),
    cardSec('Web Services', 'Web Design & Development', 'Modern websites for real businesses', 'Business websites, portfolios, landing pages, e-commerce, redesigns, and maintenance.', [
      ['01', 'Business Website', 'Professional sites that build trust and generate leads.'],
      ['02', 'E-Commerce', 'Online stores with checkout, products, and payments.'],
      ['03', 'Website Redesign', 'Modernize your existing website for better performance.'],
    ]),
    cardSec('Growth Services', 'SEO, Branding & Marketing', 'Growth support after launch', 'SEO, branding, content, and campaigns that help people find and trust your business.', [
      ['01', 'SEO Services', 'Local SEO, technical SEO, audits, and monthly management.'],
      ['02', 'Branding & Logo', 'Clear visual identity for your business.'],
      ['03', 'Speed Optimization', 'Improve load speed, UX, and Core Web Vitals.'],
    ], '#f8fafc'),
  ]}

  if (slug === 'pricing') return { sections: [
    heroSec('Transparent Pricing', 'Simple, Clear Packages', 'Choose the package that fits your needs.', 'Start Checkout', '/pricing'),
    sec('Packages', '#ffffff', '#0f172a', [blk('packages-grid')], 'packages'),
    cardSec('Included', 'Package Benefits', 'What every project includes', 'Professional delivery, mobile-responsive design, review rounds, and support.', [
      ['01', 'Responsive Design', 'Clean layouts for desktop, tablet, and mobile.'],
      ['02', 'Support', 'Guidance and fixes after delivery.'],
      ['03', 'Clean Process', 'Clear project flow from order to launch.'],
    ], '#f8fafc'),
  ]}

  if (slug === 'portfolio') return { sections: [
    heroSec('Selected Work', 'Portfolio', 'Explore recent digital projects, websites, SEO work, and brand experiences.', 'Start Your Project', '/contact'),
    sec('Portfolio Grid', '#ffffff', '#0f172a', [blk('portfolio-grid')], 'portfolio'),
  ]}

  if (slug === 'blog') return { sections: [
    heroSec('Insights', 'Blog', 'Read practical articles about websites, SEO, branding, and digital growth.', 'Contact Amir', '/contact'),
    sec('Blog Grid', '#ffffff', '#0f172a', [blk('blog-grid')], 'blog'),
  ]}

  if (slug === 'about') return { sections: [
    heroSec('About Me', "Hi, I'm Amir Nazir", 'A digital services professional helping businesses build clean, high-performing online platforms.', 'View My Work', '/portfolio', 'Get In Touch', '/contact'),
    cardSec('Values', 'What I Stand For', 'Clean execution and long-term support', 'The work should look premium, load fast, and be easy to maintain.', [
      ['01', 'Speed', 'Pages should feel fast and responsive.'],
      ['02', 'Quality', 'Clean structure, focused UI, and maintainable code.'],
      ['03', 'Partnership', 'Support that continues after launch.'],
    ]),
  ]}

  if (slug === 'contact') return { sections: [
    heroSec("Let's Connect", 'Get In Touch', 'Have a project in mind or need a quote? Send the details and I will get back to you.', 'View Pricing', '/pricing'),
    sec('Contact Form', '#ffffff', '#0f172a', [
      blk('heading',   { text: 'Tell me about your project', size: 'text-3xl', align: 'center', color: '#0f172a' }),
      blk('paragraph', { text: 'Use the form below for websites, SEO, branding, maintenance, or custom digital services.', align: 'center', color: '#64748b' }),
      blk('contact-form', {}),
    ], 'contact'),
  ]}

  if (slug === 'privacy' || slug === 'terms') return { sections: [
    heroSec('Legal', slug === 'privacy' ? 'Privacy Policy' : 'Terms of Service', 'Review and edit this page from the live builder.', 'Contact', '/contact'),
    sec('Page Content', '#ffffff', '#0f172a', [
      blk('heading',   { text: slug === 'privacy' ? 'Privacy Policy' : 'Terms of Service', size: 'text-3xl', align: 'left', color: '#0f172a' }),
      blk('paragraph', { text: 'Add your full legal content here. You can add more sections, headings, and text blocks.', align: 'left', color: '#475569' }),
    ], 'legal'),
  ]}

  return { sections: [
    heroSec('Custom Page', slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 'Build this page from the live builder.', 'Contact', '/contact'),
    sec('Content', '#ffffff', '#0f172a', [
      blk('heading',   { text: 'Start editing this page', size: 'text-3xl', align: 'left', color: '#0f172a' }),
      blk('paragraph', { text: 'Add sections, headings, images, cards, buttons, and live data blocks from the editor panel.', align: 'left', color: '#475569' }),
    ], 'content'),
  ]}
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const FLD = 'w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition placeholder-white/30'

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function TxtIn({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <Fld label={label}>
      {multiline
        ? <textarea className={`${FLD} resize-none h-24`} value={value || ''} onChange={e => onChange(e.target.value)} />
        : <input type="text" className={FLD} value={value || ''} onChange={e => onChange(e.target.value)} />
      }
    </Fld>
  )
}

function SelIn({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <Fld label={label}>
      <select className={FLD} value={value || ''} onChange={e => onChange(e.target.value)}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </Fld>
  )
}

function ColIn({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Fld label={label}>
      <div className="flex gap-2">
        <input type="color" className="w-10 h-9 rounded border border-white/10 bg-white/5 cursor-pointer p-0.5 shrink-0" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} />
        <input type="text" className={FLD} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </Fld>
  )
}

function ToggleIn({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <span className="text-xs font-semibold text-white/55">{label}</span>
      <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  )
}

const CONTROL_TABS: { key: ControlTab; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'layout', label: 'Layout' },
  { key: 'style', label: 'Style' },
  { key: 'advanced', label: 'Advanced' },
]

function ControlTabs({ value, onChange }: { value: ControlTab; onChange: (value: ControlTab) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/[0.035] p-1">
      {CONTROL_TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-lg px-1.5 py-2 text-[10px] font-bold transition ${
            value === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/35 hover:bg-white/6 hover:text-white/75'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function responsiveValue(design: Record<string, any>, device: DeviceMode, key: string) {
  return design?.responsive?.[device]?.[key] ?? design?.[key] ?? ''
}

function setResponsiveValue(design: Record<string, any>, device: DeviceMode, key: string, value: any) {
  return {
    ...design,
    responsive: {
      ...(design?.responsive || {}),
      [device]: {
        ...(design?.responsive?.[device] || {}),
        [key]: value,
      },
    },
  }
}

function ResponsiveTxtIn({
  label, value, device, field, onChange, placeholder,
}: {
  label: string; value: Record<string, any>; device: DeviceMode; field: string
  onChange: (next: Record<string, any>) => void; placeholder?: string
}) {
  return (
    <Fld label={`${label} (${device})`}>
      <input
        type="text"
        className={FLD}
        value={responsiveValue(value, device, field)}
        onChange={e => onChange(setResponsiveValue(value, device, field, e.target.value))}
        placeholder={placeholder}
      />
    </Fld>
  )
}

function DesignLayoutControls({
  design, device, onChange,
}: {
  design: Record<string, any>; device: DeviceMode; onChange: (next: Record<string, any>) => void
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Responsive Layout</p>
        <p className="mt-1 text-xs leading-relaxed text-white/35">Values apply to the active preview: {device}. Use CSS units like 80%, 320px, auto, or 24px 16px.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ResponsiveTxtIn label="Width" value={design} device={device} field="width" onChange={onChange} placeholder="auto / 100%" />
        <ResponsiveTxtIn label="Height" value={design} device={device} field="height" onChange={onChange} placeholder="auto / 420px" />
      </div>
      <ResponsiveTxtIn label="Padding" value={design} device={device} field="padding" onChange={onChange} placeholder="24px 16px" />
      <ResponsiveTxtIn label="Margin" value={design} device={device} field="margin" onChange={onChange} placeholder="0 auto" />
    </div>
  )
}

function DesignStyleControls({
  design, device, onChange,
}: {
  design: Record<string, any>; device: DeviceMode; onChange: (next: Record<string, any>) => void
}) {
  const set = (patch: Record<string, any>) => onChange({ ...design, ...patch })
  return (
    <div className="space-y-3">
      <ColIn label="Background" value={design.background || ''} onChange={v => set({ background: v })} />
      <ColIn label="Text Color" value={design.color || ''} onChange={v => set({ color: v })} />
      <div className="grid grid-cols-2 gap-2">
        <ResponsiveTxtIn label="Radius" value={design} device={device} field="borderRadius" onChange={onChange} placeholder="16px" />
        <SelIn label="Shadow" value={design.shadow || 'none'} onChange={v => set({ shadow: v })} opts={[
          { v: 'none', l: 'None' }, { v: 'sm', l: 'Soft' }, { v: 'md', l: 'Medium' },
          { v: 'lg', l: 'Large' }, { v: 'xl', l: 'Premium' },
        ]} />
      </div>
      <ResponsiveTxtIn label="Border" value={design} device={device} field="border" onChange={onChange} placeholder="1px solid #e2e8f0" />
    </div>
  )
}

function TypographyControls({
  props, device, onChange,
}: {
  props: Record<string, any>; device: DeviceMode; onChange: (patch: Record<string, any>) => void
}) {
  const design = props.design || {}
  const setDesign = (next: Record<string, any>) => onChange({ design: next })
  const set = (patch: Record<string, any>) => onChange(patch)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <SelIn label="Font" value={props.fontFamily || 'heading'} onChange={v => set({ fontFamily: v })} opts={[
          { v: 'heading', l: 'Heading' }, { v: 'sans', l: 'Sans' },
        ]} />
        <SelIn label="Weight" value={props.fontWeight || 'normal'} onChange={v => set({ fontWeight: v })} opts={[
          { v: 'normal', l: 'Normal' }, { v: 'medium', l: 'Medium' }, { v: 'semibold', l: 'Semibold' },
          { v: 'bold', l: 'Bold' }, { v: 'extrabold', l: 'Extra Bold' },
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ResponsiveTxtIn label="Font Size" value={design} device={device} field="fontSize" onChange={setDesign} placeholder="32px" />
        <ResponsiveTxtIn label="Line Height" value={design} device={device} field="lineHeight" onChange={setDesign} placeholder="1.2" />
      </div>
      <ResponsiveTxtIn label="Letter Spacing" value={design} device={device} field="letterSpacing" onChange={setDesign} placeholder="0px" />
    </div>
  )
}

// ─── Block editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onUpdate, device }: { block: Block; onUpdate: (props: Record<string, any>) => void; device: DeviceMode }) {
  const [tab, setTab] = useState<ControlTab>('content')
  const p = block.props
  const set = (patch: Record<string, any>) => onUpdate({ ...p, ...patch })
  const design = p.design || {}
  const setDesign = (next: Record<string, any>) => set({ design: next })

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">{block.type.replace(/-/g, ' ')}</p>
      <ControlTabs value={tab} onChange={setTab} />

      {tab === 'content' && <>
      {block.type === 'heading' && <>
        <TxtIn label="Text" value={p.text} onChange={v => set({ text: v })} />
        <SelIn label="Size" value={p.size} onChange={v => set({ size: v })} opts={[
          { v: 'text-6xl', l: 'Display XL' }, { v: 'text-5xl', l: 'H1 Large' },
          { v: 'text-4xl', l: 'H2 XL' }, { v: 'text-3xl', l: 'H2 Large' },
          { v: 'text-2xl', l: 'H3 Medium' }, { v: 'text-xl', l: 'H4 Small' },
        ]} />
        <SelIn label="Align" value={p.align} onChange={v => set({ align: v })} opts={[
          { v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' },
        ]} />
        <ColIn label="Color" value={p.color} onChange={v => set({ color: v })} />
      </>}

      {block.type === 'paragraph' && <>
        <TxtIn label="Text" value={p.text} onChange={v => set({ text: v })} multiline />
        <SelIn label="Align" value={p.align} onChange={v => set({ align: v })} opts={[
          { v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' },
        ]} />
        <ColIn label="Color" value={p.color} onChange={v => set({ color: v })} />
      </>}

      {block.type === 'button' && <>
        <TxtIn label="Button Text" value={p.text} onChange={v => set({ text: v })} />
        <TxtIn label="Link URL" value={p.url} onChange={v => set({ url: v })} />
        <SelIn label="Style" value={p.style} onChange={v => set({ style: v })} opts={[
          { v: 'primary', l: 'Primary (Blue)' }, { v: 'outline', l: 'Outline' }, { v: 'white', l: 'White' },
        ]} />
        <SelIn label="Align" value={p.align} onChange={v => set({ align: v })} opts={[
          { v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' },
        ]} />
      </>}

      {block.type === 'image' && <>
        <TxtIn label="Image URL" value={p.src} onChange={v => set({ src: v })} />
        <TxtIn label="Alt Text" value={p.alt} onChange={v => set({ alt: v })} />
        <SelIn label="Height" value={p.height || 'auto'} onChange={v => set({ height: v })} opts={[
          { v: 'auto', l: 'Auto' }, { v: '200px', l: 'Small (200px)' },
          { v: '320px', l: 'Medium (320px)' }, { v: '480px', l: 'Large (480px)' },
          { v: '600px', l: 'Full (600px)' },
        ]} />
        <SelIn label="Fit" value={p.objectFit || 'cover'} onChange={v => set({ objectFit: v })} opts={[
          { v: 'cover', l: 'Cover (crop to fill)' }, { v: 'contain', l: 'Contain (fit inside)' },
          { v: 'fill', l: 'Fill (stretch)' },
        ]} />
        <SelIn label="Rounded" value={p.rounded || 'none'} onChange={v => set({ rounded: v })} opts={[
          { v: 'none', l: 'None' }, { v: 'rounded-lg', l: 'Rounded' },
          { v: 'rounded-2xl', l: 'Extra Rounded' }, { v: 'rounded-full', l: 'Circle' },
        ]} />
      </>}

      {block.type === 'card' && <>
        <TxtIn label="Icon / Number" value={p.icon} onChange={v => set({ icon: v })} />
        <TxtIn label="Title" value={p.title} onChange={v => set({ title: v })} />
        <TxtIn label="Body Text" value={p.body} onChange={v => set({ body: v })} multiline />
      </>}

      {block.type === 'stat' && <>
        <TxtIn label="Number / Value" value={p.number} onChange={v => set({ number: v })} />
        <TxtIn label="Label" value={p.label} onChange={v => set({ label: v })} />
      </>}

      {block.type === 'faq-item' && <>
        <TxtIn label="Question" value={p.question} onChange={v => set({ question: v })} />
        <TxtIn label="Answer" value={p.answer} onChange={v => set({ answer: v })} multiline />
      </>}

      {block.type === 'contact-form' && <>
        <TxtIn label="Form Title" value={p.title} onChange={v => set({ title: v })} />
        <TxtIn label="Submit Button" value={p.submitText} onChange={v => set({ submitText: v })} />
        <TxtIn label="Description" value={p.description} onChange={v => set({ description: v })} multiline />
      </>}

      {block.type === 'testimonial' && <>
        <TxtIn label="Quote Text" value={p.quote} onChange={v => set({ quote: v })} multiline />
        <TxtIn label="Author Name" value={p.author} onChange={v => set({ author: v })} />
        <TxtIn label="Author Title / Company" value={p.role} onChange={v => set({ role: v })} />
        <TxtIn label="Avatar Image URL" value={p.avatar} onChange={v => set({ avatar: v })} />
        <Fld label="Rating (stars)">
          <input type="number" className={FLD} value={p.rating || 5} min={1} max={5} onChange={e => set({ rating: Number(e.target.value) })} />
        </Fld>
      </>}

      {block.type === 'video' && <>
        <TxtIn label="YouTube or Vimeo URL" value={p.url} onChange={v => set({ url: v })} />
        <TxtIn label="Caption (optional)" value={p.caption} onChange={v => set({ caption: v })} />
        <SelIn label="Aspect Ratio" value={p.aspect || '16/9'} onChange={v => set({ aspect: v })} opts={[
          { v: '16/9', l: '16:9 Widescreen' }, { v: '4/3', l: '4:3 Standard' }, { v: '1/1', l: '1:1 Square' },
        ]} />
      </>}

      {block.type === 'divider' && <>
        <ColIn label="Line Color" value={p.color || '#e2e8f0'} onChange={v => set({ color: v })} />
        <SelIn label="Style" value={p.style || 'solid'} onChange={v => set({ style: v })} opts={[
          { v: 'solid', l: 'Solid' }, { v: 'dashed', l: 'Dashed' }, { v: 'dotted', l: 'Dotted' },
        ]} />
      </>}

      {block.type === 'spacer' && <>
        <Fld label="Height (px)">
          <input type="number" className={FLD} value={p.height || 40} min={8} max={400} step={4} onChange={e => set({ height: Number(e.target.value) })} />
        </Fld>
      </>}

      {(['packages-grid', 'portfolio-grid', 'blog-grid'] as BlockType[]).includes(block.type) && <>
        <TxtIn label="Section Title" value={p.title} onChange={v => set({ title: v })} />
        <TxtIn label="Subtitle" value={p.subtitle} onChange={v => set({ subtitle: v })} />
        <Fld label="Max Items">
          <input type="number" className={FLD} value={p.limit || 6} min={1} max={12} onChange={e => set({ limit: Number(e.target.value) })} />
        </Fld>
      </>}
      </>}

      {tab === 'layout' && (
        <DesignLayoutControls design={design} device={device} onChange={setDesign} />
      )}

      {tab === 'style' && (
        <div className="space-y-4">
          {(['heading', 'paragraph', 'button'] as BlockType[]).includes(block.type) && (
            <TypographyControls props={p} device={device} onChange={set} />
          )}
          <DesignStyleControls design={design} device={device} onChange={setDesign} />
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-4">
          <SelIn label="Animation" value={p.animation || 'none'} onChange={v => set({ animation: v })} opts={[
            { v: 'none', l: 'None' }, { v: 'fade', l: 'Fade In' }, { v: 'slide', l: 'Slide Up' },
          ]} />
          <ResponsiveTxtIn label="Z Index" value={design} device={device} field="zIndex" onChange={setDesign} placeholder="1" />
          <ResponsiveTxtIn label="Opacity" value={design} device={device} field="opacity" onChange={setDesign} placeholder="1" />
        </div>
      )}
    </div>
  )
}

// ─── Section editor ───────────────────────────────────────────────────────────

function SectionEditor({ section, onUpdate, device }: { section: Section; onUpdate: (patch: Partial<Section>) => void; device: DeviceMode }) {
  const [tab, setTab] = useState<ControlTab>('content')
  const design = section.design || {}
  const setDesign = (next: Record<string, any>) => onUpdate({ design: next })

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Section Settings</p>
      <ControlTabs value={tab} onChange={setTab} />
      {tab === 'content' && (
        <div className="space-y-4">
      <TxtIn label="Label" value={section.label} onChange={v => onUpdate({ label: v })} />
          <ToggleIn label="Hide section from page" checked={!!section.hidden} onChange={hidden => onUpdate({ hidden })} />
        </div>
      )}

      {tab === 'layout' && (
        <div className="space-y-4">
      {/* Column Layout */}
      <Fld label="Column Layout">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { v: '1', icon: '▬', l: '1 Col' },
            { v: '2', icon: '▬▬', l: '2 Col' },
            { v: '3', icon: '▬▬▬', l: '3 Col' },
            { v: '4', icon: '▬▬▬▬', l: '4 Col' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => onUpdate({ columns: opt.v })}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition text-[10px] font-semibold ${
                (section.columns || '12') === opt.v
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <span className="text-[8px] tracking-tighter">{opt.icon}</span>
              {opt.l}
            </button>
          ))}
        </div>
      </Fld>
      <SelIn label="Padding" value={section.padding} onChange={v => onUpdate({ padding: v })} opts={[
        { v: 'py-8', l: 'Small' }, { v: 'py-16', l: 'Medium' },
        { v: 'py-20', l: 'Large' }, { v: 'py-32', l: 'X-Large' }, { v: 'py-0', l: 'None' },
      ]} />
      <SelIn label="Max Width" value={section.maxWidth} onChange={v => onUpdate({ maxWidth: v })} opts={[
        { v: 'max-w-4xl', l: 'Narrow (4xl)' }, { v: 'max-w-5xl', l: 'Medium (5xl)' },
        { v: 'max-w-6xl', l: 'Wide (6xl)' }, { v: 'max-w-7xl', l: 'Full (7xl)' }, { v: 'max-w-full', l: 'Edge to edge' },
      ]} />
          <SelIn label="Gap" value={section.gap || 'gap-5'} onChange={v => onUpdate({ gap: v })} opts={[
            { v: 'gap-0', l: 'None' }, { v: 'gap-3', l: 'Tight' }, { v: 'gap-5', l: 'Normal' },
            { v: 'gap-8', l: 'Wide' }, { v: 'gap-12', l: 'Extra Wide' },
          ]} />
          <DesignLayoutControls design={design} device={device} onChange={setDesign} />
        </div>
      )}

      {tab === 'style' && (
        <div className="space-y-4">
          <ColIn label="Background" value={section.bg} onChange={v => onUpdate({ bg: v })} />
          <ColIn label="Text Color" value={section.textColor} onChange={v => onUpdate({ textColor: v })} />
          <DesignStyleControls design={design} device={device} onChange={setDesign} />
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-4">
          <SelIn label="Min Height" value={section.minHeight || 'none'} onChange={v => onUpdate({ minHeight: v })} opts={[
            { v: 'none', l: 'Auto' }, { v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' },
            { v: 'large', l: 'Large' }, { v: 'screen', l: 'Full Screen' },
          ]} />
          <SelIn label="Animation" value={section.animation || 'none'} onChange={v => onUpdate({ animation: v })} opts={[
            { v: 'none', l: 'None' }, { v: 'fade', l: 'Fade In' }, { v: 'slide', l: 'Slide Up' },
          ]} />
          <ResponsiveTxtIn label="Z Index" value={design} device={device} field="zIndex" onChange={setDesign} placeholder="1" />
        </div>
      )}
    </div>
  )
}

// ─── Header / Footer types & defaults ────────────────────────────────────────

type NavItem = { label: string; url: string }
type SocialLink = { label: string; url: string; icon: string }

type HeaderConfig = {
  logoText: string; logoImage: string; logoImageDark?: string; logoImageLight?: string; logoColor: string
  logoWidth?: number; logoHeight?: number; logoPadding?: number; logoRadius?: number; logoBg?: string; favicon?: string
  ctaText: string; ctaUrl: string; navItems: NavItem[]
  // Nav link colours
  navColorTop: string      // link colour when navbar is transparent (top of page)
  navColorScrolled: string // link colour when navbar is scrolled / glass
  navActiveColor: string   // active/current page link colour
  // Glass background
  glassBgTop: string       // CSS color for bg at top  e.g. rgba(255,255,255,0.06)
  glassBgScrolled: string  // CSS color for bg scrolled e.g. rgba(255,255,255,0.75)
}

type FooterConfig = {
  logoText: string; logoImage?: string; logoImageDark?: string; logoImageLight?: string
  logoWidth?: number; logoHeight?: number; logoPadding?: number; logoRadius?: number; logoBg?: string
  description: string; email: string; phone: string
  copyright: string; quickLinks: NavItem[]; services: string[]; socialLinks: SocialLink[]
}

const DEFAULT_HEADER: HeaderConfig = {
  logoText: 'Amir Nazir', logoImage: '/brand/amirnazir-logo-dark.png', logoImageDark: '/brand/amirnazir-logo-dark.png', logoImageLight: '/brand/amirnazir-logo-light.png', logoColor: '#6366f1',
  logoWidth: 176, logoHeight: 38, logoPadding: 0, logoRadius: 0, logoBg: 'transparent', favicon: '/brand/favicon.png',
  ctaText: 'Get Started', ctaUrl: '/register',
  navItems: [
    { label: 'Services', url: '/services' }, { label: 'Portfolio', url: '/portfolio' },
    { label: 'Pricing', url: '/pricing' }, { label: 'About', url: '/about' },
    { label: 'Blog', url: '/blog' }, { label: 'Contact', url: '/contact' },
  ],
  navColorTop:      '#ffffff',
  navColorScrolled: '#0f172a',
  navActiveColor:   '#6366f1',
  glassBgTop:       'rgba(10,15,30,0.45)',
  glassBgScrolled:  'rgba(255,255,255,0.82)',
}

const DEFAULT_FOOTER: FooterConfig = {
  logoImage: '/brand/amirnazir-logo-light.png', logoImageDark: '/brand/amirnazir-logo-dark.png', logoImageLight: '/brand/amirnazir-logo-light.png',
  logoWidth: 176, logoHeight: 44, logoPadding: 0, logoRadius: 0, logoBg: 'transparent',
  logoText: 'Amir Nazir', description: 'Premium digital services — web design, development, SEO, and marketing solutions.',
  email: 'info@a-mir.com', phone: '', copyright: `© ${new Date().getFullYear()} Amir Nazir. All rights reserved.`,
  quickLinks: DEFAULT_HEADER.navItems,
  services: ['Web Design', 'Web Development', 'SEO Services', 'Digital Marketing', 'Branding & Logo'],
  socialLinks: [
    { label: 'GitHub', url: '#', icon: 'GH' }, { label: 'LinkedIn', url: '#', icon: 'IN' },
    { label: 'Twitter', url: '#', icon: 'X' },
  ],
}

function safeParse<T>(val: unknown, fallback: T): T {
  if (!val || typeof val !== 'string') return fallback
  try { return { ...fallback, ...JSON.parse(val) } } catch { return fallback }
}

// ─── Header Editor ────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="flex-1 h-px bg-white/10" />
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest shrink-0">{label}</p>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}

function ImgUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('key', '_tmp_upload')
      fd.append('image', file)
      const res = await api.post('/admin/settings/upload-image', fd)
      onChange(res.data.url)
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  return (
    <Fld label={label}>
      <div className="space-y-2">
        {value && (
          <img src={assetUrl(value)} alt="preview" className="h-10 w-auto rounded border border-white/10 object-contain bg-white/5 px-1" />
        )}
        <div className="flex gap-2">
          <input type="text" className={`${FLD} flex-1`} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Paste URL or upload →" />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="shrink-0 px-3 py-1.5 rounded bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition disabled:opacity-50"
          >
            {uploading ? '…' : 'Upload'}
          </button>
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
      </div>
    </Fld>
  )
}

function HeaderEditor({ header, onChange }: { header: HeaderConfig; onChange: (h: HeaderConfig) => void }) {
  const set = (patch: Partial<HeaderConfig>) => onChange({ ...header, ...patch })
  return (
    <div className="space-y-4">
      {/* ── Logo ── */}
      <Divider label="Logo" />
      <TxtIn label="Logo Text (shown if no image)" value={header.logoText} onChange={v => set({ logoText: v })} />
      <ImgUpload label="Primary Logo (dark bg / top of page)" value={header.logoImageDark || header.logoImage || ''} onChange={v => set({ logoImage: v, logoImageDark: v })} />
      <ImgUpload label="Scrolled Logo (light bg / when scrolled)" value={header.logoImageLight || ''} onChange={v => set({ logoImageLight: v })} />
      <ImgUpload label="Favicon" value={header.favicon || ''} onChange={v => set({ favicon: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Fld label="Logo Width">
          <input type="number" min={40} max={360} className={FLD} value={header.logoWidth || 176} onChange={e => set({ logoWidth: Number(e.target.value) })} />
        </Fld>
        <Fld label="Logo Height">
          <input type="number" min={20} max={160} className={FLD} value={header.logoHeight || 38} onChange={e => set({ logoHeight: Number(e.target.value) })} />
        </Fld>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Fld label="Logo Padding">
          <input type="number" min={0} max={40} className={FLD} value={header.logoPadding || 0} onChange={e => set({ logoPadding: Number(e.target.value) })} />
        </Fld>
        <Fld label="Logo Radius">
          <input type="number" min={0} max={80} className={FLD} value={header.logoRadius || 0} onChange={e => set({ logoRadius: Number(e.target.value) })} />
        </Fld>
      </div>
      <ColIn label="Logo Background" value={header.logoBg || '#ffffff'} onChange={v => set({ logoBg: v })} />
      <ColIn label="Logo Text Colour" value={header.logoColor || '#6366f1'} onChange={v => set({ logoColor: v })} />

      {/* ── CTA ── */}
      <Divider label="CTA Button" />
      <TxtIn label="Button Label" value={header.ctaText} onChange={v => set({ ctaText: v })} />
      <TxtIn label="Button URL" value={header.ctaUrl} onChange={v => set({ ctaUrl: v })} />

      {/* ── Nav link colours ── */}
      <Divider label="Nav Link Colours" />
      <div className="rounded-lg bg-white/5 p-3 space-y-3 border border-white/10">
        <ColIn
          label="Links — top of page (on dark hero)"
          value={header.navColorTop || 'rgba(255,255,255,0.90)'}
          onChange={v => set({ navColorTop: v })}
        />
        <ColIn
          label="Links — when scrolled (on glass)"
          value={header.navColorScrolled || '#1e293b'}
          onChange={v => set({ navColorScrolled: v })}
        />
        <ColIn
          label="Active / current page link"
          value={header.navActiveColor || '#6366f1'}
          onChange={v => set({ navActiveColor: v })}
        />
      </div>

      {/* ── Glass background ── */}
      <Divider label="Glass Background" />
      <div className="rounded-lg bg-white/5 p-3 space-y-3 border border-white/10">
        <Fld label="Bg at top of page (CSS colour)">
          <input
            type="text"
            className={FLD}
            value={header.glassBgTop || 'rgba(255,255,255,0.06)'}
            onChange={e => set({ glassBgTop: e.target.value })}
            placeholder="rgba(255,255,255,0.06)"
          />
        </Fld>
        <Fld label="Bg when scrolled (CSS colour)">
          <input
            type="text"
            className={FLD}
            value={header.glassBgScrolled || 'rgba(255,255,255,0.78)'}
            onChange={e => set({ glassBgScrolled: e.target.value })}
            placeholder="rgba(255,255,255,0.78)"
          />
        </Fld>
      </div>

      {/* ── Nav Items ── */}
      <Divider label="Navigation Links" />
      <div className="space-y-2">
        {header.navItems.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" placeholder="Label" value={item.label}
              onChange={e => { const n = [...header.navItems]; n[i] = { ...n[i], label: e.target.value }; set({ navItems: n }) }}
              className={`flex-1 ${FLD}`}
            />
            <input
              type="text" placeholder="/url" value={item.url}
              onChange={e => { const n = [...header.navItems]; n[i] = { ...n[i], url: e.target.value }; set({ navItems: n }) }}
              className={`flex-1 ${FLD}`}
            />
            <button
              onClick={() => set({ navItems: header.navItems.filter((_, j) => j !== i) })}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded transition shrink-0"
            ><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button
          onClick={() => set({ navItems: [...header.navItems, { label: 'New Link', url: '/' }] })}
          className="w-full flex items-center gap-2 justify-center py-2 rounded border border-dashed border-white/15 text-white/40 hover:text-white text-xs transition"
        ><Plus className="w-3.5 h-3.5" /> Add Nav Item</button>
      </div>
    </div>
  )
}

// ─── Footer Editor ────────────────────────────────────────────────────────────

function FooterEditor({ footer, onChange }: { footer: FooterConfig; onChange: (f: FooterConfig) => void }) {
  const set = (patch: Partial<FooterConfig>) => onChange({ ...footer, ...patch })
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Footer Settings</p>
      <TxtIn label="Logo Text" value={footer.logoText} onChange={v => set({ logoText: v })} />
      <TxtIn label="Primary Footer Logo URL" value={footer.logoImageDark || footer.logoImage || ''} onChange={v => set({ logoImage: v, logoImageDark: v })} />
      <TxtIn label="White Footer Logo URL" value={footer.logoImageLight || ''} onChange={v => set({ logoImageLight: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Fld label="Logo Width">
          <input type="number" min={40} max={360} className={FLD} value={footer.logoWidth || 176} onChange={e => set({ logoWidth: Number(e.target.value) })} />
        </Fld>
        <Fld label="Logo Height">
          <input type="number" min={20} max={160} className={FLD} value={footer.logoHeight || 44} onChange={e => set({ logoHeight: Number(e.target.value) })} />
        </Fld>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Fld label="Logo Padding">
          <input type="number" min={0} max={40} className={FLD} value={footer.logoPadding || 0} onChange={e => set({ logoPadding: Number(e.target.value) })} />
        </Fld>
        <Fld label="Logo Radius">
          <input type="number" min={0} max={80} className={FLD} value={footer.logoRadius || 0} onChange={e => set({ logoRadius: Number(e.target.value) })} />
        </Fld>
      </div>
      <ColIn label="Logo Background" value={footer.logoBg || '#ffffff'} onChange={v => set({ logoBg: v })} />
      <TxtIn label="Description" value={footer.description} onChange={v => set({ description: v })} multiline />
      <TxtIn label="Email" value={footer.email} onChange={v => set({ email: v })} />
      <TxtIn label="Phone" value={footer.phone} onChange={v => set({ phone: v })} />
      <TxtIn label="Copyright Text" value={footer.copyright} onChange={v => set({ copyright: v })} />
      <div>
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">Quick Links</p>
        <div className="space-y-2">
          {footer.quickLinks.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" placeholder="Label" value={item.label}
                onChange={e => { const n = [...footer.quickLinks]; n[i] = { ...n[i], label: e.target.value }; set({ quickLinks: n }) }}
                className={`flex-1 ${FLD}`} />
              <input type="text" placeholder="/url" value={item.url}
                onChange={e => { const n = [...footer.quickLinks]; n[i] = { ...n[i], url: e.target.value }; set({ quickLinks: n }) }}
                className={`flex-1 ${FLD}`} />
              <button onClick={() => set({ quickLinks: footer.quickLinks.filter((_, j) => j !== i) })} className="p-2 text-red-400 hover:bg-red-500/10 rounded transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => set({ quickLinks: [...footer.quickLinks, { label: 'New Link', url: '/' }] })} className="w-full flex items-center gap-2 justify-center py-2 rounded border border-dashed border-white/15 text-white/40 hover:text-white text-xs transition">
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Block type picker ────────────────────────────────────────────────────────

const BASIC_WIDGETS: { type: BlockType; label: string; desc: string; badge: string }[] = [
  { type: 'heading',   label: 'Heading', desc: 'Add a page title or section heading.', badge: 'H' },
  { type: 'paragraph', label: 'Text',    desc: 'Add editable body copy.', badge: 'T' },
  { type: 'image',     label: 'Image',   desc: 'Add an image block.', badge: 'I' },
  { type: 'button',    label: 'Button',  desc: 'Add a clickable call to action.', badge: 'B' },
  { type: 'spacer',    label: 'Spacer',  desc: 'Add vertical breathing room.', badge: 'S' },
  { type: 'divider',   label: 'Divider', desc: 'Add a horizontal separator.', badge: 'D' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BuilderEditor({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Keep a ref of the current layout so the FRAME_READY handler always has fresh data
  const layoutRef = useRef<PageLayout>({ sections: [] })

  const [layout, setLayout]           = useState<PageLayout>({ sections: [] })
  const [header, setHeader]           = useState<HeaderConfig>(DEFAULT_HEADER)
  const [footer, setFooter]           = useState<FooterConfig>(DEFAULT_FOOTER)
  const [mode, setMode]               = useState<'page' | 'header' | 'footer' | 'settings'>('page')
  const [pageSettings, setPageSettings] = useState<Record<string,string>>({})
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [viewport, setViewport]       = useState<DeviceMode>('desktop')
  const [panel, setPanel]             = useState<BuilderPanel>('layers')
  const [selSec, setSelSec]           = useState<string | null>(null)
  const [selBlk, setSelBlk]           = useState<string | null>(null)
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [dragOverId, setDragOverId]   = useState<string | null>(null)
  const [widgetQuery, setWidgetQuery] = useState('')
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [undoStack, setUndoStack] = useState<BuilderSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<BuilderSnapshot[]>([])
  const [versions, setVersions] = useState<BuilderVersion[]>([])
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [customPages, setCustomPages]   = useState<Array<{slug: string; title: string}>>([])
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const pagePickerRef                   = useRef<HTMLDivElement>(null)
  const dragIdRef                       = useRef<string | null>(null)
  const lastSnapshotRef                 = useRef<string>('')
  const lastSavedKeyRef                 = useRef<string>('')
  const restoringSnapshotRef            = useRef(false)
  const saveTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close page picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pagePickerRef.current && !pagePickerRef.current.contains(e.target as Node))
        setPagePickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pageTitle   = CORE_PAGES.find(p => p.slug === slug)?.title || slug
  const section     = layout.sections.find(s => s.id === selSec) ?? null
  const blockItem   = section?.blocks.find(b => b.id === selBlk) ?? null
  const selectedLabel = blockItem
    ? `${blockItem.type.replace(/-/g, ' ')}${blockItem.props?.text ? `: ${String(blockItem.props.text).slice(0, 28)}` : ''}`
    : section?.label || 'No selection'
  const breadcrumb = blockItem
    ? `${pageTitle} > ${section?.label || 'Section'} > ${blockItem.type.replace(/-/g, ' ')}`
    : section
      ? `${pageTitle} > ${section.label}`
      : pageTitle
  const filteredWidgets = BASIC_WIDGETS.filter(item => {
    const q = widgetQuery.trim().toLowerCase()
    if (!q) return true
    return `${item.label} ${item.desc}`.toLowerCase().includes(q)
  })
  const currentSnapshot = useCallback((): BuilderSnapshot => ({ layout, header, footer, pageSettings }), [layout, header, footer, pageSettings])
  const applySnapshot = useCallback((snapshot: BuilderSnapshot) => {
    setLayout(snapshot.layout)
    layoutRef.current = snapshot.layout
    setHeader(snapshot.header)
    setFooter(snapshot.footer)
    setPageSettings(snapshot.pageSettings)
  }, [])
  const snapshotKey = useCallback((snapshot: BuilderSnapshot) => JSON.stringify(snapshot), [])

  // ── Keep layoutRef in sync ────────────────────────────────────────────────
  useEffect(() => { layoutRef.current = layout }, [layout])

  // ── Load custom pages for page picker dropdown ──────────────────────────
  useEffect(() => {
    api.get('/admin/builder/pages')
      .then(r => {
        const pages = (r.data?.data ?? []).filter((p: any) => p.id > 0)
        setCustomPages(pages.map((p: any) => ({ slug: p.slug, title: p.title })))
      })
      .catch(() => {})
  }, [])

  // ── Load page data + header/footer settings ──────────────────────────────
  useEffect(() => {
    setLoading(true)
    setIframeReady(false)
    Promise.all([
      api.get(`/admin/builder/${slug}`),
      api.get('/admin/settings'),
    ]).then(([pageRes, settingsRes]) => {
      // Page layout
      const d = pageRes.data?.data
      const saved: PageLayout | null = d?.draft?.layout || d?.published?.layout || null
      applyLayout((saved && Array.isArray(saved.sections) && saved.sections.length > 0) ? saved : starterLayout(slug))
      // Header / footer settings
      const map: Record<string, string> = {}
      ;(settingsRes.data?.data ?? []).forEach((item: any) => { map[item.key] = item.value })
      if (map.builder_header) setHeader(safeParse(map.builder_header, DEFAULT_HEADER))
      if (map.builder_footer) setFooter(safeParse(map.builder_footer, DEFAULT_FOOTER))
      // Page-specific settings (hero content, etc.)
      const ps: Record<string,string> = {}
      Object.keys(map).filter(k => k.startsWith(`page_${slug}_`)).forEach(k => {
        ps[k.replace(`page_${slug}_`, '')] = map[k]
      })
      setPageSettings(ps)
    }).catch(() => applyLayout(starterLayout(slug)))
      .finally(() => setLoading(false))
  }, [slug])

  function applyLayout(l: PageLayout) {
    setLayout(l)
    layoutRef.current = l
    const firstId = l.sections[0]?.id ?? null
    setSelSec(firstId)
    setSelBlk(null)
    if (firstId) setExpanded(new Set([firstId]))
  }

  // ── Iframe messaging ──────────────────────────────────────────────────────
  const sendToFrame = useCallback((msg: ParentToFrameMessage) => {
    iframeRef.current?.contentWindow?.postMessage({ channel: BUILDER_CHANNEL, ...msg }, '*')
  }, [])

  const selectInEditor = useCallback((sectionId: string, blockId: string | null = null, nextPanel: BuilderPanel = 'props') => {
    setMode('page')
    setSelSec(sectionId)
    setSelBlk(blockId)
    setPanel(nextPanel)
    setExpanded(prev => new Set([...prev, sectionId]))
    sendToFrame({ type: 'SELECT', sectionId, blockId })
  }, [sendToFrame])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.channel !== BUILDER_CHANNEL) return
      const msg = e.data as FrameToParentMessage

      if (msg.type === 'FRAME_READY') {
        setIframeReady(true)
        // Send current layout immediately (using ref for freshness)
        iframeRef.current?.contentWindow?.postMessage(
          { channel: BUILDER_CHANNEL, type: 'LAYOUT_UPDATE', layout: layoutRef.current },
          '*'
        )
      } else if (msg.type === 'SECTION_CLICKED') {
        selectInEditor(msg.sectionId, null, 'props')
      } else if (msg.type === 'BLOCK_CLICKED') {
        selectInEditor(msg.sectionId, msg.blockId, 'props')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [selectInEditor])

  // ── Sync layout to iframe whenever it changes ─────────────────────────────
  useEffect(() => {
    if (iframeReady) sendToFrame({ type: 'LAYOUT_UPDATE', layout })
  }, [layout, iframeReady, sendToFrame])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updSec = (id: string, patch: Partial<Section>) =>
    setLayout(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, ...patch } : s) }))

  const updBlk = (secId: string, blkId: string, props: Record<string, any>) =>
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === secId ? { ...s, blocks: s.blocks.map(b => b.id === blkId ? { ...b, props } : b) } : s
      )
    }))

  const addSection = () => {
    const s = sec('New Section', '#ffffff', '#0f172a', [
      blk('heading', { text: 'Section Title', size: 'text-3xl', align: 'center', color: '#0f172a' }),
      blk('paragraph', { text: 'Add your content here.', align: 'center', color: '#475569' }),
    ])
    setLayout(prev => ({ ...prev, sections: [...prev.sections, s] }))
    selectInEditor(s.id, null, 'props')
  }

  const delSection = (id: string) => {
    setLayout(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }))
    if (selSec === id) {
      setSelSec(null)
      setSelBlk(null)
      sendToFrame({ type: 'SELECT', sectionId: null, blockId: null })
    }
  }

  const moveSec = (id: string, dir: 'up' | 'down') => {
    const arr = [...layout.sections]
    const i = arr.findIndex(s => s.id === id)
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= arr.length) return
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    setLayout(prev => ({ ...prev, sections: arr }))
  }

  const addBlock = (type: BlockType) => {
    if (!selSec) return
    const b = blk(type)
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === selSec ? { ...s, blocks: [...s.blocks, b] } : s)
    }))
    selectInEditor(selSec, b.id, 'props')
  }

  const delBlock = (secId: string, blkId: string) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === secId ? { ...s, blocks: s.blocks.filter(b => b.id !== blkId) } : s)
    }))
    if (selBlk === blkId) {
      setSelBlk(null)
      sendToFrame({ type: 'SELECT', sectionId: secId, blockId: null })
    }
  }

  const undo = () => {
    const previous = undoStack[undoStack.length - 1]
    if (!previous) return
    const current = currentSnapshot()
    restoringSnapshotRef.current = true
    applySnapshot(previous)
    lastSnapshotRef.current = snapshotKey(previous)
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [current, ...prev].slice(0, 40))
    toast('Undo applied.')
  }

  const redo = () => {
    const next = redoStack[0]
    if (!next) return
    const current = currentSnapshot()
    restoringSnapshotRef.current = true
    applySnapshot(next)
    lastSnapshotRef.current = snapshotKey(next)
    setRedoStack(prev => prev.slice(1))
    setUndoStack(prev => [...prev, current].slice(-40))
    toast('Redo applied.')
  }

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true)
    try {
      const response = await api.get(`/admin/builder/${slug}/history`)
      setVersions(response.data?.data || [])
    } catch {
      toast.error('Could not load version history.')
    } finally {
      setLoadingVersions(false)
    }
  }, [slug])

  const restoreVersion = async (version: BuilderVersion) => {
    if (!window.confirm(`Restore published version ${version.version} as a new draft? This will not publish automatically.`)) return
    try {
      const response = await api.post(`/admin/builder/${slug}/restore/${version.id}`)
      const restored = response.data?.draft_json || version.layout
      if (restored?.sections) {
        restoringSnapshotRef.current = true
        applyLayout(restored)
        lastSnapshotRef.current = snapshotKey({ ...currentSnapshot(), layout: restored })
        setPanel('layers')
        setMode('page')
      }
      await loadVersions()
      toast.success('Version restored as draft.')
    } catch {
      toast.error('Could not restore this version.')
    }
  }

  const save = async (publish = false, quiet = false) => {
    setSaving(true)
    if (quiet) setAutosaveStatus('saving')
    const savedKey = snapshotKey(currentSnapshot())
    try {
      // Save header, footer, and page-specific settings
      const pageSettingsToSave: Record<string,string> = {}
      Object.entries(pageSettings).forEach(([k,v]) => {
        pageSettingsToSave[`page_${slug}_${k}`] = v
      })
      await api.put('/admin/settings', {
        settings: {
          builder_header: JSON.stringify(header),
          builder_footer: JSON.stringify(footer),
          ...(header.favicon ? { favicon: header.favicon } : {}),
          ...pageSettingsToSave,
        }
      })
      window.dispatchEvent(new Event('builder:settings-saved'))
      iframeRef.current?.contentWindow?.dispatchEvent(new Event('builder:settings-saved'))
      // Save page layout
      await api.post(`/admin/builder/${slug}/save`, { draft_json: layout, layout })
      if (publish) {
        await api.post(`/admin/builder/${slug}/publish`)
        // Clear all layout caches so the new published version shows immediately
        safeSessionStorage.removeItem('pbs_' + slug)  // PublishedSections cache
        safeSessionStorage.removeItem('cbl_' + slug)  // CustomPageOutlet cache
        safeSessionStorage.removeItem('bl_' + slug)   // Legacy cache
      }
      setLastSavedAt(new Date())
      lastSavedKeyRef.current = savedKey
      setAutosaveStatus('saved')
      if (publish) {
        loadVersions()
        setIframeReady(false)
        iframeRef.current?.contentWindow?.location.reload()
      }
      if (!quiet) toast.success(publish ? 'Published!' : 'Draft saved!')
    } catch {
      setAutosaveStatus('error')
      if (!quiet) toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (loading) return
    const snapshot = currentSnapshot()
    const key = snapshotKey(snapshot)

    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = key
      lastSavedKeyRef.current = key
      return
    }

    if (restoringSnapshotRef.current) {
      restoringSnapshotRef.current = false
      return
    }

    if (key !== lastSnapshotRef.current) {
      try {
        const previous = JSON.parse(lastSnapshotRef.current) as BuilderSnapshot
        setUndoStack(prev => [...prev, previous].slice(-40))
        setRedoStack([])
      } catch { /* ignore bad snapshot */ }
      lastSnapshotRef.current = key
      setAutosaveStatus('idle')
    }
  }, [layout, header, footer, pageSettings, loading, currentSnapshot, snapshotKey])

  useEffect(() => {
    if (loading) return
    const key = snapshotKey(currentSnapshot())
    if (!key || key === lastSavedKeyRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      save(false, true)
    }, 1800)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [layout, header, footer, pageSettings, loading])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // ── Drag & Drop for sections ─────────────────────────────────────────────
  const onDragStart = (id: string) => { dragIdRef.current = id }
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (dragIdRef.current !== id) setDragOverId(id)
  }
  const onDrop = (targetId: string) => {
    const srcId = dragIdRef.current
    if (!srcId || srcId === targetId) { setDragOverId(null); return }
    const arr = [...layout.sections]
    const from = arr.findIndex(s => s.id === srcId)
    const to   = arr.findIndex(s => s.id === targetId)
    if (from === -1 || to === -1) { setDragOverId(null); return }
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    setLayout(prev => ({ ...prev, sections: arr }))
    dragIdRef.current = null
    setDragOverId(null)
  }
  const onDragEnd = () => { dragIdRef.current = null; setDragOverId(null) }

  const resetLayout = () => {
    if (!window.confirm('Reset this page to the starter layout? Unsaved changes will be lost.')) return
    applyLayout(starterLayout(slug))
  }

  // Reset iframe ready state when slug changes
  useEffect(() => { setIframeReady(false) }, [slug])

  // Sync selection to iframe so it can highlight the selected section/block
  useEffect(() => {
    if (!iframeReady || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      { channel: BUILDER_CHANNEL, type: 'SELECT', sectionId: selSec, blockId: selBlk },
      '*'
    )
  }, [selSec, selBlk, iframeReady])

  const reloadFrame = () => {
    setIframeReady(false)
    iframeRef.current?.contentWindow?.location.reload()
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate('/admin/builder')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Pages
        </button>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest shrink-0 hidden sm:block">Editing</span>

          {/* Custom page picker dropdown */}
          <div className="relative" ref={pagePickerRef}>
            <button
              onClick={() => setPagePickerOpen(v => !v)}
              className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/12 hover:border-white/20 transition"
            >
              <span>{pageTitle}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-150 ${pagePickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {pagePickerOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-[200] w-52 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Core pages */}
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Pages</p>
                </div>
                {CORE_PAGES.map(p => (
                  <button
                    key={p.slug}
                    onClick={() => { navigate(`/admin/builder/${p.slug}`); setPagePickerOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition ${
                      p.slug === slug
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{p.title}</span>
                    {p.slug === slug && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}

                {/* Custom pages */}
                {customPages.length > 0 && (
                  <>
                    <div className="h-px bg-white/8 mx-3 my-1" />
                    <div className="px-3 pt-1 pb-1">
                      <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Custom</p>
                    </div>
                    {customPages.map(p => (
                      <button
                        key={p.slug}
                        onClick={() => { navigate(`/admin/builder/${p.slug}`); setPagePickerOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition ${
                          p.slug === slug
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'text-white/65 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{p.title}</span>
                        {p.slug === slug && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </>
                )}
                <div className="h-2" />
              </div>
            )}
          </div>

          <span className="text-[11px] text-white/20 truncate hidden md:block">{publicPath(slug)}</span>
        </div>
        <div className="flex-1" />

        <div className="hidden xl:flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5">
          <Clock3 className="h-3.5 w-3.5 text-white/30" />
          <span className={`text-[11px] font-semibold ${
            autosaveStatus === 'error' ? 'text-red-300' : autosaveStatus === 'saving' ? 'text-amber-300' : 'text-white/35'
          }`}>
            {autosaveStatus === 'saving'
              ? 'Autosaving...'
              : autosaveStatus === 'error'
                ? 'Autosave failed'
                : lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Autosave ready'}
          </span>
        </div>

        <div className="flex gap-0.5 p-1 rounded-lg bg-white/5">
          <button onClick={undo} disabled={!undoStack.length} className="p-2 rounded text-white/35 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/35 transition" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={!redoStack.length} className="p-2 rounded text-white/35 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/35 transition" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex gap-0.5 p-1 rounded-lg bg-white/5">
          <button onClick={() => setViewport('desktop')} className={`p-2 rounded transition ${viewport === 'desktop' ? 'bg-primary/20 text-primary' : 'text-white/35 hover:text-white'}`} title="Desktop">
            <Monitor className="w-4 h-4" />
          </button>
          <button onClick={() => setViewport('tablet')} className={`p-2 rounded transition ${viewport === 'tablet' ? 'bg-primary/20 text-primary' : 'text-white/35 hover:text-white'}`} title="Tablet">
            <Tablet className="w-4 h-4" />
          </button>
          <button onClick={() => setViewport('mobile')} className={`p-2 rounded transition ${viewport === 'mobile' ? 'bg-primary/20 text-primary' : 'text-white/35 hover:text-white'}`} title="Mobile">
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <a href={publicPath(slug)} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/5 transition" title="View live">
          <Eye className="w-4 h-4" />
        </a>

        <button onClick={resetLayout} className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/5 transition" title="Reset layout">
          <RefreshCw className="w-4 h-4" />
        </button>

        <button onClick={() => { setVersionsOpen(v => !v); if (!versionsOpen) loadVersions() }} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition ${versionsOpen ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>
          <History className="w-4 h-4" />
          Versions
        </button>

        <button onClick={() => save(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Draft
        </button>

        <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
          <Sparkles className="w-4 h-4" />
          Publish
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────── */}
        <aside className="w-72 border-r border-white/5 flex flex-col shrink-0 overflow-hidden bg-slate-950">

          {/* Mode tabs: Page / Header / Footer / Settings */}
          <div className="flex border-b border-white/5 shrink-0">
            {(['page', 'header', 'footer', 'settings'] as const).map(m => (
              <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition border-b-2 ${mode === m ? 'border-primary text-primary' : 'border-transparent text-white/35 hover:text-white'}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Panel tabs (only for Page mode) */}
          {mode === 'page' && (
            <div className="grid grid-cols-3 gap-1 border-b border-white/5 p-2 shrink-0 bg-white/[0.02]">
              <button onClick={() => setPanel('layers')} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition ${panel === 'layers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
                <Layers className="w-3.5 h-3.5" /> Tree
              </button>
              <button onClick={() => setPanel('add')} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition ${panel === 'add' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
              <button onClick={() => setPanel('props')} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition ${panel === 'props' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
                <Settings className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          )}

          {mode === 'page' && (
            <div className="border-b border-white/5 bg-white/[0.025] px-3 py-3">
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/25">{breadcrumb}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${blockItem ? 'bg-amber-400' : section ? 'bg-blue-400' : 'bg-white/20'}`} />
                <p className="truncate text-sm font-semibold text-white/80">{selectedLabel}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {versionsOpen && (
              <div className="border-b border-white/8 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Version History</p>
                    <p className="mt-1 text-xs text-white/35">Restore a published version as a draft.</p>
                  </div>
                  <button onClick={loadVersions} className="rounded-lg bg-white/6 p-2 text-white/45 hover:text-white">
                    {loadingVersions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="space-y-2">
                  {versions.length === 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center text-xs text-white/35">
                      {loadingVersions ? 'Loading versions...' : 'No published versions yet.'}
                    </div>
                  )}
                  {versions.map(version => (
                    <div key={version.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">Version {version.version}</p>
                          <p className="mt-0.5 text-[11px] text-white/35">
                            {version.published_at ? new Date(version.published_at).toLocaleString() : 'Published version'}
                          </p>
                          {version.creator?.name && <p className="mt-0.5 text-[11px] text-white/25">By {version.creator.name}</p>}
                        </div>
                        <button onClick={() => restoreVersion(version)} className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/25">
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS mode (page-specific editable content) ──── */}
            {mode === 'settings' && (
              <div className="p-4 space-y-4">
                <Divider label={`${pageTitle} Page Content`} />
                <p className="text-[11px] text-white/35">
                  Edit the content of the <strong className="text-white/60">{pageTitle}</strong> page components. Changes apply to the real page (not the builder preview).
                </p>
                {slug === 'home' && (
                  <>
                    <Divider label="Hero Section" />
                    <TxtIn label="Eyebrow / Badge text" value={pageSettings.hero_eyebrow || 'Premium Digital Services'} onChange={v => setPageSettings(p => ({...p, hero_eyebrow: v}))} />
                    <TxtIn label="Hero Subtitle" value={pageSettings.hero_subtitle || ''} onChange={v => setPageSettings(p => ({...p, hero_subtitle: v}))} multiline />
                    <Divider label="Hero Buttons" />
                    <TxtIn label="Button 1 — Label" value={pageSettings.hero_btn1_text || 'View Packages'} onChange={v => setPageSettings(p => ({...p, hero_btn1_text: v}))} />
                    <TxtIn label="Button 1 — URL" value={pageSettings.hero_btn1_url || '/pricing'} onChange={v => setPageSettings(p => ({...p, hero_btn1_url: v}))} />
                    <TxtIn label="Button 2 — Label" value={pageSettings.hero_btn2_text || 'See My Work'} onChange={v => setPageSettings(p => ({...p, hero_btn2_text: v}))} />
                    <TxtIn label="Button 2 — URL" value={pageSettings.hero_btn2_url || '/portfolio'} onChange={v => setPageSettings(p => ({...p, hero_btn2_url: v}))} />
                    <Divider label="Stats" />
                    {[1,2,3,4].map(n => (
                      <div key={n} className="flex gap-2">
                        <Fld label={`Stat ${n} Value`}>
                          <input type="text" className={FLD} value={pageSettings[`hero_stat${n}_val`] || ['50+','100%','5+','24/7'][n-1]} onChange={e => setPageSettings(p => ({...p, [`hero_stat${n}_val`]: e.target.value}))} />
                        </Fld>
                        <Fld label="Label">
                          <input type="text" className={FLD} value={pageSettings[`hero_stat${n}_label`] || ['Projects Delivered','Client Satisfaction','Years Experience','Support Available'][n-1]} onChange={e => setPageSettings(p => ({...p, [`hero_stat${n}_label`]: e.target.value}))} />
                        </Fld>
                      </div>
                    ))}
                  </>
                )}
                {slug === 'about' && (
                  <>
                    <Divider label="Profile Photo" />
                    <ImgUpload
                      label="Profile Photo (upload or paste URL)"
                      value={pageSettings.about_profile_photo || ''}
                      onChange={v => setPageSettings(p => ({ ...p, about_profile_photo: v }))}
                    />
                  </>
                )}

                {slug === 'contact' && (
                  <>
                    <Divider label="Contact Info" />
                    <TxtIn label="Section Title" value={pageSettings.contact_title || 'Get In Touch'} onChange={v => setPageSettings(p => ({...p, contact_title: v}))} />
                    <TxtIn label="Subtitle" value={pageSettings.contact_subtitle || ''} onChange={v => setPageSettings(p => ({...p, contact_subtitle: v}))} multiline />
                    <TxtIn label="Email Address" value={pageSettings.contact_email || ''} onChange={v => setPageSettings(p => ({...p, contact_email: v}))} />
                    <TxtIn label="Phone Number" value={pageSettings.contact_phone || ''} onChange={v => setPageSettings(p => ({...p, contact_phone: v}))} />
                    <TxtIn label="Office Address" value={pageSettings.contact_address || ''} onChange={v => setPageSettings(p => ({...p, contact_address: v}))} multiline />
                  </>
                )}

                {slug === 'services' && (
                  <>
                    <Divider label="Services Hero" />
                    <TxtIn label="Hero Title" value={pageSettings.services_title || 'Services That Drive Results'} onChange={v => setPageSettings(p => ({...p, services_title: v}))} />
                    <TxtIn label="Hero Subtitle" value={pageSettings.services_subtitle || ''} onChange={v => setPageSettings(p => ({...p, services_subtitle: v}))} multiline />
                  </>
                )}

                {slug === 'pricing' && (
                  <>
                    <Divider label="Pricing Page" />
                    <TxtIn label="Hero Title" value={pageSettings.pricing_title || 'Transparent Pricing'} onChange={v => setPageSettings(p => ({...p, pricing_title: v}))} />
                    <TxtIn label="Hero Subtitle" value={pageSettings.pricing_subtitle || ''} onChange={v => setPageSettings(p => ({...p, pricing_subtitle: v}))} multiline />
                  </>
                )}

                {slug === 'portfolio' && (
                  <>
                    <Divider label="Portfolio Page" />
                    <TxtIn label="Hero Title" value={pageSettings.portfolio_title || 'My Work'} onChange={v => setPageSettings(p => ({...p, portfolio_title: v}))} />
                    <TxtIn label="Hero Subtitle" value={pageSettings.portfolio_subtitle || ''} onChange={v => setPageSettings(p => ({...p, portfolio_subtitle: v}))} multiline />
                  </>
                )}

                {(slug === 'privacy' || slug === 'terms' || slug === 'blog') && (
                  <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
                    <p className="text-white/40 text-sm">Content for <strong className="text-white/60">{pageTitle}</strong> is managed in the Admin panel.</p>
                    <p className="text-white/20 text-xs mt-1">Use the Page tab above to add custom sections below this page.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── HEADER mode ───────────────────────────────────────── */}
            {mode === 'header' && (
              <div className="p-4">
                <HeaderEditor header={header} onChange={setHeader} />
              </div>
            )}

            {/* ── FOOTER mode ───────────────────────────────────────── */}
            {mode === 'footer' && (
              <div className="p-4">
                <FooterEditor footer={footer} onChange={setFooter} />
              </div>
            )}

            {/* ── LAYERS panel ──────────────────────────────────────── */}
            {mode === 'page' && panel === 'layers' && (
              <div className="p-3 space-y-3">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Section Tree</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">Drag sections to reorder. Click a section or block to edit it in the live preview.</p>
                </div>

                <button onClick={addSection} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-primary/35 bg-primary/8 text-primary hover:bg-primary/15 text-sm font-semibold transition">
                  <Plus className="w-4 h-4" /> Add Blank Section
                </button>

                {layout.sections.map((s, idx) => {
                  const isSel = selSec === s.id
                  const isExp = expanded.has(s.id)
                  return (
                    <div key={s.id} className="relative">
                      {/* Section row — draggable */}
                      <div
                        draggable
                        onDragStart={() => onDragStart(s.id)}
                        onDragOver={e => onDragOver(e, s.id)}
                        onDrop={() => onDrop(s.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => selectInEditor(s.id, null, 'props')}
                        className={`rounded-xl border p-2.5 cursor-grab active:cursor-grabbing transition group ${
                          isSel ? 'border-primary/45 bg-primary/15 text-white shadow-lg shadow-primary/10' : 'border-white/8 bg-white/[0.025] text-white/65 hover:border-white/15 hover:bg-white/[0.045] hover:text-white'
                        } ${dragOverId === s.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-950' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); setExpanded(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n }) }} className="text-white/30 hover:text-white/75 shrink-0 transition p-1">
                            {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-400/12 text-[10px] font-bold text-blue-300">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">{s.label || `Section ${idx + 1}`}</span>
                              {s.hidden && <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/35">Hidden</span>}
                            </div>
                            <p className="truncate text-[10px] uppercase tracking-widest text-white/25">{s.type || 'section'} · {s.blocks.length} block{s.blocks.length === 1 ? '' : 's'}</p>
                          </div>
                          <span className="rounded-md border border-white/8 px-1.5 py-1 text-[10px] font-bold text-white/25 group-hover:text-white/45">Drag</span>
                        </div>
                        <div className="mt-2 hidden items-center gap-1.5 group-hover:flex">
                          <button onClick={e => { e.stopPropagation(); moveSec(s.id, 'up') }} disabled={idx === 0} className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-20 transition"><ChevronUp className="mx-auto h-3.5 w-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); moveSec(s.id, 'down') }} disabled={idx === layout.sections.length - 1} className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-20 transition"><ChevronDown className="mx-auto h-3.5 w-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); delSection(s.id) }} className="flex-1 rounded-lg bg-red-500/8 py-1.5 text-xs text-red-300 hover:bg-red-500/15 transition"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
                        </div>
                      </div>

                      {/* Blocks */}
                      {isExp && (
                        <div className="ml-4 border-l border-white/8 pl-3 space-y-1 py-2">
                          {s.blocks.map(b => {
                            const isBSel = selBlk === b.id && selSec === s.id
                            return (
                              <div key={b.id} onClick={() => selectInEditor(s.id, b.id, 'props')} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition group ${isBSel ? 'border-amber-400/35 bg-amber-500/15 text-amber-200' : 'border-white/6 bg-white/[0.02] text-white/45 hover:border-white/12 hover:bg-white/[0.045] hover:text-white/75'}`}>
                                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber-400/10 text-[9px] font-bold uppercase text-amber-300">{b.type[0]}</div>
                                <span className="text-xs flex-1 truncate capitalize">{b.type === 'paragraph' ? 'Text' : b.type.replace(/-/g, ' ')}</span>
                                <button onClick={e => { e.stopPropagation(); delBlock(s.id, b.id) }} className="hidden group-hover:block p-0.5 hover:bg-red-500/20 text-red-400 rounded">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          })}
                          <button onClick={() => selectInEditor(s.id, null, 'add')} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 px-2 py-2 text-[11px] font-semibold text-white/30 hover:border-primary/40 hover:text-primary transition">
                            <Plus className="w-3 h-3" /> Add widget here
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ADD panel ─────────────────────────────────────────── */}
            {mode === 'page' && panel === 'add' && (
              <div className="p-4 space-y-5">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Add Elements</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Build this page draft</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    Choose a section, then add a basic widget. Nothing is published until you press Publish.
                  </p>
                </div>

                <button onClick={addSection} className="w-full rounded-xl border border-dashed border-primary/35 bg-primary/8 px-3 py-3 text-left transition hover:bg-primary/15">
                  <span className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Plus className="h-4 w-4" /> Blank Section
                  </span>
                  <span className="mt-1 block text-xs text-white/35">Adds a new editable section to the end of this page.</span>
                </button>

                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Basic Widgets</p>
                      <p className="mt-1 text-xs text-white/35">
                        {section ? `Adding to ${section.label}` : 'Select a section first'}
                      </p>
                    </div>
                    {section && (
                      <button onClick={() => setPanel('props')} className="text-xs font-semibold text-primary hover:text-primary/80">
                        Edit section
                      </button>
                    )}
                  </div>

                  <input
                    type="search"
                    className={FLD}
                    value={widgetQuery}
                    onChange={e => setWidgetQuery(e.target.value)}
                    placeholder="Search widgets..."
                  />

                  {!section && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                      <p className="text-sm font-semibold text-white/55">No section selected</p>
                      <p className="mt-1 text-xs text-white/30">Open Tree and choose where the widget should be added.</p>
                      <button onClick={() => setPanel('layers')} className="mt-3 rounded-lg bg-white/8 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/12">
                        Open Tree
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {filteredWidgets.map(item => (
                      <button
                        key={item.type}
                        onClick={() => addBlock(item.type)}
                        disabled={!section}
                        className="group rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-primary/45 hover:bg-primary/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-xs font-black text-white/70 group-hover:bg-primary group-hover:text-white">
                          {item.badge}
                        </span>
                        <span className="mt-3 block text-sm font-bold text-white/80">{item.label}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-white/30">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  {filteredWidgets.length === 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center text-sm text-white/35">
                      No widgets match that search.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PROPERTIES panel ──────────────────────────────────── */}
            {mode === 'page' && panel === 'props' && (
              <div className="p-4">
                {!section && (
                  <div className="py-16 text-center space-y-2">
                    <p className="text-white/25 text-sm">Nothing selected</p>
                    <p className="text-white/15 text-xs">Click a section or block in the preview, or select from Layers</p>
                  </div>
                )}

                {section && blockItem && (
                  <div className="space-y-5">
                    <BlockEditor block={blockItem} onUpdate={props => updBlk(section.id, blockItem.id, props)} device={viewport} />
                    <button onClick={() => delBlock(section.id, blockItem.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition">
                      <Trash2 className="w-4 h-4" /> Delete Block
                    </button>
                  </div>
                )}

                {section && !blockItem && (
                  <div className="space-y-6">
                    <SectionEditor section={section} onUpdate={patch => updSec(section.id, patch)} device={viewport} />

                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Add Widgets</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/35">Use the Add tab to place Heading, Text, Image, Button, Spacer, or Divider in this section.</p>
                      <button onClick={() => setPanel('add')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition">
                        <Plus className="h-4 w-4" /> Open Add Tab
                      </button>
                    </div>

                    <button onClick={() => delSection(section.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition">
                      <Trash2 className="w-4 h-4" /> Delete Section
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Preview ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#1a1f2e]">
          <div className="flex-1 flex items-stretch p-5 overflow-auto">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/30">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading page data...</p>
              </div>
            ) : (
              <div className={`relative mx-auto flex flex-col rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-all duration-300 ${
                viewport === 'mobile' ? 'w-[390px] h-[844px]' : viewport === 'tablet' ? 'w-[820px] h-[1024px]' : 'w-full h-full'
              }`}>
                {/* Browser chrome */}
                <div className="bg-[#2a2f3e] px-4 py-2.5 flex items-center gap-3 shrink-0 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex-1 bg-[#1a1f2e] rounded px-3 py-1 text-xs text-white/30 font-mono truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}{publicPath(slug)}
                  </div>
                  <button onClick={reloadFrame} title="Reload preview" className="text-white/25 hover:text-white transition">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Loading overlay — shown until iframe fires onLoad */}
                {!iframeReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1117] z-10 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs text-white/30 uppercase tracking-widest">Loading preview…</p>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={`${window.location.origin}/preview/${slug}`}
                  className="flex-1 w-full bg-white"
                  title="Page Preview"
                  onLoad={() => setIframeReady(true)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-white/5 px-5 py-2 flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-blue-400/60 bg-blue-400/10" />
              <span className="text-[11px] text-white/25">Section hover</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-amber-400/60 bg-amber-400/10" />
              <span className="text-[11px] text-white/25">Block hover</span>
            </div>
            <span className="ml-auto text-[11px] text-white/15">Edits sync live · Click anything in preview to edit</span>
          </div>
        </main>
      </div>
    </div>
  )
}
