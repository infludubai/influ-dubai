import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from 'react'
import { Check, CheckCircle2, Edit3, Eye, FileText, Images, Image as ImageIcon, LayoutTemplate, Layers3, Loader2, Monitor, MousePointer2, Plus, RotateCcw, Save, Share2, Sparkles, Trash2, UploadCloud, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { publicApi } from '@/api/public'
import { useAuthStore } from '@/store/authStore'
import { assetUrl } from '@/utils/assets'

type FieldType = 'text' | 'textarea' | 'url' | 'image'

type RelatedField = {
  key: string
  label: string
  type?: FieldType
  fallback?: string
}

type SelectedField = {
  key: string
  label: string
  type: FieldType
  fallback?: string
  relatedFields?: RelatedField[]
  sectionKey?: string
  sectionLabel?: string
}

type LiveEditorContextValue = {
  editMode: boolean
  enabled: boolean
  values: Record<string, string>
  value: (key: string, fallback: string) => string
  select: (field: SelectedField) => void
  setDraftValue: (key: string, value: string) => void
  addSection: (type: string) => Promise<void>
  addSocialLink: () => Promise<void>
  removeSocialLink: (id: string) => Promise<void>
  addHeaderNavLink: () => Promise<void>
  removeHeaderNavLink: (id: string) => Promise<void>
  hideSection: (sectionKey: string, sectionLabel: string) => Promise<void>
  restoreSection: (sectionKey: string, sectionLabel: string) => Promise<void>
  moveSectionBefore: (draggedKey: string, targetKey: string) => Promise<void>
  pageKey: string
}

const LiveEditorContext = createContext<LiveEditorContextValue>({
  editMode: false,
  enabled: false,
  values: {},
  value: (_key, fallback) => fallback,
  select: () => {},
  setDraftValue: () => {},
  addSection: async () => {},
  addSocialLink: async () => {},
  removeSocialLink: async () => {},
  addHeaderNavLink: async () => {},
  removeHeaderNavLink: async () => {},
  hideSection: async () => {},
  restoreSection: async () => {},
  moveSectionBefore: async () => {},
  pageKey: 'home',
})

function hasSettingValue(source: Record<string, string>, key: string) {
  return Object.prototype.hasOwnProperty.call(source, key)
}

export function useLiveEditor() {
  return useContext(LiveEditorContext)
}

export function LiveReactEditorProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = isAuthenticated && user?.role === 'admin'
  const [editMode, setEditMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [savedValues, setSavedValues] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<SelectedField | null>(null)
  const [activeTool, setActiveTool] = useState<'page' | 'sections' | 'add' | 'header' | 'footer'>('page')
  const [draft, setDraft] = useState('')
  const [relatedDrafts, setRelatedDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [libraryKey, setLibraryKey] = useState<string | null>(null)
  const [libraryImages, setLibraryImages] = useState<{ name: string; url: string }[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)

  const openLibrary = useCallback((key: string) => {
    setLibraryKey(key)
    setLibraryLoading(true)
    api.get('/admin/settings/images')
      .then(r => setLibraryImages(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLibraryLoading(false))
  }, [])
  const pageLabel = location.pathname === '/' ? 'Home page' : `${location.pathname.replace(/^\/+/, '').replaceAll('/', ' / ') || 'Page'}`
  const pageKey = location.pathname === '/' ? 'home' : location.pathname.replace(/^\/+/, '').replaceAll('/', '_') || 'page'
  const liveSectionsKey = `page_live_sections_${pageKey}`
  const sectionOrderKey = `page_section_order_${pageKey}`
  const socialLinksKey = 'page_global_social_links'
  const headerNavLinksKey = 'page_global_header_nav_links'
  const currentSetting = (key: string, fallback = '') => hasSettingValue(values, key) ? values[key] : fallback
  const savedSetting = (key: string, fallback = '') => hasSettingValue(savedValues, key) ? savedValues[key] : fallback
  const publicPages = [
    { label: 'Home', path: '/', key: 'home' },
    { label: 'Services', path: '/services', key: 'services' },
    { label: 'Portfolio', path: '/portfolio', key: 'portfolio' },
    { label: 'Pricing', path: '/pricing', key: 'pricing' },
    { label: 'About', path: '/about', key: 'about' },
    { label: 'Blog', path: '/blog', key: 'blog' },
    { label: 'Contact', path: '/contact', key: 'contact' },
    { label: 'Privacy', path: '/privacy', key: 'privacy' },
    { label: 'Terms', path: '/terms', key: 'terms' },
  ]
  const currentPage = publicPages.find((page) => page.path === location.pathname) || publicPages[0]
  const baseSectionsByPage: Record<string, Array<{ key: string; label: string }>> = {
    home: [
      { key: 'page_home_hero_section', label: 'Hero' },
      { key: 'page_home_services_section', label: 'Services' },
      { key: 'page_home_packages_section', label: 'Packages' },
      { key: 'page_home_cta_section', label: 'Call to action' },
    ],
    services: [
      { key: 'page_services_hero_section', label: 'Hero' },
      { key: 'page_services_categories_section', label: 'Service categories' },
      { key: 'page_services_cta_section', label: 'Call to action' },
    ],
    pricing: [
      { key: 'page_pricing_hero_section', label: 'Hero' },
      { key: 'page_pricing_packages_section', label: 'Packages' },
      { key: 'page_pricing_included_section', label: 'Included / FAQ' },
    ],
    portfolio: [
      { key: 'page_portfolio_hero_section', label: 'Hero' },
      { key: 'page_portfolio_grid_section', label: 'Portfolio grid' },
    ],
    blog: [
      { key: 'page_blog_hero_section', label: 'Hero' },
      { key: 'page_blog_posts_section', label: 'Blog posts' },
    ],
    about: [
      { key: 'page_about_hero_section', label: 'Hero' },
      { key: 'page_about_values_section', label: 'Values' },
      { key: 'page_about_skills_section', label: 'Skills' },
      { key: 'page_about_cta_section', label: 'Call to action' },
    ],
    contact: [
      { key: 'page_contact_hero_section', label: 'Hero' },
      { key: 'page_contact_content_section', label: 'Contact form' },
    ],
  }

  const loadPublicSettings = () => {
    publicApi.settings()
      .then((response) => {
        const nextValues = response.data?.data || {}
        setValues(nextValues)
        setSavedValues(nextValues)
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadPublicSettings()
    window.addEventListener('builder:settings-saved', loadPublicSettings)
    return () => window.removeEventListener('builder:settings-saved', loadPublicSettings)
  }, [])

  useEffect(() => {
    if (!selected) return
    setDraft(currentSetting(selected.key, savedSetting(selected.key, selected.fallback || '')))
    const nextRelated: Record<string, string> = {}
    ;(selected.relatedFields || []).forEach((field) => {
      nextRelated[field.key] = currentSetting(field.key, savedSetting(field.key, field.fallback || ''))
    })
    setRelatedDrafts(nextRelated)
  }, [selected, values, savedValues])

  const addSection = async (type: string) => {
    const current = currentSetting(liveSectionsKey, savedSetting(liveSectionsKey, '[]'))
    let sections: any[] = []
    try { sections = JSON.parse(current) } catch { sections = [] }
    const id = `${type}_${Date.now()}`
    const next = [
      ...sections,
      {
        id,
        type,
        title: type === 'cta' ? 'Ready to start your project?' : type === 'features' ? 'What makes this different' : type === 'split' ? 'Build something premium' : 'New website section',
        subtitle: 'Edit this new section directly from the live builder.',
        button: type === 'cta' ? 'Start Now' : 'Learn More',
        url: '/contact',
      },
    ]
    const payload = { [liveSectionsKey]: JSON.stringify(next) }
    setValues((currentValues) => ({ ...currentValues, ...payload }))
    setSavedValues((currentValues) => ({ ...currentValues, ...payload }))
    await api.put('/admin/settings', { settings: payload })
    setActiveTool('sections')
    toast.success('Section added to this page.')
  }

  const readSocialLinks = () => {
    const current = currentSetting(socialLinksKey, savedSetting(socialLinksKey, '[]'))
    try {
      const parsed = JSON.parse(current)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const readHeaderNavLinks = () => {
    const current = currentSetting(headerNavLinksKey, savedSetting(headerNavLinksKey, '[]'))
    try {
      const parsed = JSON.parse(current)
      if (Array.isArray(parsed) && parsed.length) return parsed
    } catch {
      // fall through to defaults
    }
    return [
      { id: 'services', label: 'Services', url: '/services' },
      { id: 'portfolio', label: 'Portfolio', url: '/portfolio' },
      { id: 'pricing', label: 'Pricing', url: '/pricing' },
      { id: 'about', label: 'About', url: '/about' },
      { id: 'blog', label: 'Blog', url: '/blog' },
      { id: 'contact', label: 'Contact', url: '/contact' },
    ]
  }

  const persistSettings = async (payload: Record<string, string>, successMessage: string) => {
    setValues((currentValues) => ({ ...currentValues, ...payload }))
    setSavedValues((currentValues) => ({ ...currentValues, ...payload }))
    await api.put('/admin/settings', { settings: payload })
    toast.success(successMessage)
  }

  const addSocialLink = async () => {
    const next = [
      ...readSocialLinks(),
      {
        id: `social_${Date.now()}`,
        label: 'New Social',
        url: '#',
        icon: 'S',
        iconImage: '',
      },
    ]
    await persistSettings({ [socialLinksKey]: JSON.stringify(next) }, 'Social icon added.')
    setActiveTool('footer')
  }

  const removeSocialLink = async (id: string) => {
    const next = readSocialLinks().filter((item: any) => item?.id !== id)
    await persistSettings({ [socialLinksKey]: JSON.stringify(next) }, 'Social icon removed.')
  }

  const addHeaderNavLink = async () => {
    const next = [
      ...readHeaderNavLinks(),
      { id: `nav_${Date.now()}`, label: 'New Link', url: '/' },
    ]
    await persistSettings({ [headerNavLinksKey]: JSON.stringify(next) }, 'Header link added.')
    setActiveTool('header')
  }

  const removeHeaderNavLink = async (id: string) => {
    const next = readHeaderNavLinks().filter((item: any) => item?.id !== id)
    await persistSettings({ [headerNavLinksKey]: JSON.stringify(next) }, 'Header link removed.')
  }

  const hideSection = async (sectionKey: string, sectionLabel: string) => {
    await persistSettings({ [`${sectionKey}_hidden`]: '1' }, `${sectionLabel} section hidden.`)
    setSelected(null)
  }

  const restoreSection = async (sectionKey: string, sectionLabel: string) => {
    await persistSettings({ [`${sectionKey}_hidden`]: '0' }, `${sectionLabel} section restored.`)
  }

  const readSectionOrder = () => {
    const current = currentSetting(sectionOrderKey, savedSetting(sectionOrderKey, '[]'))
    try {
      const parsed = JSON.parse(current)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const moveSectionBefore = async (draggedKey: string, targetKey: string) => {
    if (!draggedKey || !targetKey || draggedKey === targetKey) return
    const order = readSectionOrder()
    const withoutDragged = order.filter((key) => key !== draggedKey && key !== targetKey)
    const targetIndex = order.includes(targetKey) ? Math.max(order.indexOf(targetKey), 0) : withoutDragged.length
    const next = [...withoutDragged]
    next.splice(targetIndex, 0, draggedKey, targetKey)
    await persistSettings({ [sectionOrderKey]: JSON.stringify(Array.from(new Set(next))) }, 'Section order updated.')
  }

  const contextValue = useMemo<LiveEditorContextValue>(() => ({
    editMode: editMode && !previewMode,
    enabled: isAdmin,
    values,
    value: (key, fallback) => currentSetting(key, fallback),
    select: (field) => {
      if (!editMode || previewMode || !isAdmin) return
      setSelected(field)
      setActiveTool('page')
    },
    setDraftValue: (key, nextValue) => {
      setValues((current) => ({ ...current, [key]: nextValue }))
    },
    addSection,
    addSocialLink,
    removeSocialLink,
    addHeaderNavLink,
    removeHeaderNavLink,
    hideSection,
    restoreSection,
    moveSectionBefore,
    pageKey,
  }), [editMode, previewMode, isAdmin, values, savedValues, liveSectionsKey, sectionOrderKey, pageKey])

  const saveSelected = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const settings = { [selected.key]: draft, ...relatedDrafts }
      await api.put('/admin/settings', { settings })
      setValues((current) => ({ ...current, ...settings }))
      setSavedValues((current) => ({ ...current, ...settings }))
      toast.success('Content saved.')
    } catch {
      toast.error('Could not save this content.')
    } finally {
      setSaving(false)
    }
  }

  const resetSelectedPreview = () => {
    if (!selected) return
    const restored: Record<string, string> = {
      [selected.key]: savedSetting(selected.key, selected.fallback || ''),
    }
    ;(selected.relatedFields || []).forEach((field) => {
      restored[field.key] = savedSetting(field.key, field.fallback || '')
    })
    setDraft(restored[selected.key])
    const nextRelated = { ...restored }
    delete nextRelated[selected.key]
    setRelatedDrafts(nextRelated)
    setValues((current) => ({ ...current, ...restored }))
  }

  const resetSelectedToDefault = async () => {
    if (!selected || selected.sectionKey) return
    setSaving(true)
    try {
      const settings: Record<string, string> = { [selected.key]: selected.fallback || '' }
      ;(selected.relatedFields || []).forEach((field) => {
        settings[field.key] = field.fallback || ''
      })
      await api.put('/admin/settings', { settings })
      setDraft(settings[selected.key])
      const nextRelated = { ...settings }
      delete nextRelated[selected.key]
      setRelatedDrafts(nextRelated)
      setValues((current) => ({ ...current, ...settings }))
      setSavedValues((current) => ({ ...current, ...settings }))
      toast.success('Field reset.')
    } catch {
      toast.error('Could not reset this field.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSelectedContent = async () => {
    if (!selected) return
    if (selected.sectionKey) {
      await hideSection(selected.sectionKey, selected.sectionLabel || selected.label)
      return
    }
    setSaving(true)
    try {
      const settings = { [selected.key]: '' }
      await api.put('/admin/settings', { settings })
      setDraft('')
      setValues((current) => ({ ...current, ...settings }))
      setSavedValues((current) => ({ ...current, ...settings }))
      toast.success('Content deleted.')
    } catch {
      toast.error('Could not delete this content.')
    } finally {
      setSaving(false)
    }
  }

  const selectedSavedValue = selected ? savedSetting(selected.key, selected.fallback || '') : ''
  const relatedDirty = selected?.relatedFields?.some((field) => (relatedDrafts[field.key] || '') !== savedSetting(field.key, field.fallback || '')) || false
  const hasPreviewChanges = Boolean(selected && (draft !== selectedSavedValue || relatedDirty))
  const activeFieldCount = selected ? 1 + (selected.relatedFields?.length || 0) : 0
  const selectedKind = selected?.sectionKey ? 'section' : selected?.type === 'image' ? 'image' : 'content'

  const closeBuilder = () => {
    setEditMode(false)
    setPreviewMode(false)
    setSelected(null)
  }

  const selectSection = (section: { key: string; label: string }) => {
    setSelected({ key: `${section.key}_hidden`, label: `${section.label} section`, type: 'text', fallback: '0', sectionKey: section.key, sectionLabel: section.label })
    setActiveTool('sections')
  }

  const quickSelect = (field: SelectedField, tool: typeof activeTool) => {
    setSelected(field)
    setActiveTool(tool)
  }

  const handleCanvasClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || previewMode || !isAdmin) return
    const target = event.target as HTMLElement
    if (target.closest('[data-live-editable="true"]')) return
    const link = target.closest('a')
    if (!link) return
    event.preventDefault()
    event.stopPropagation()
    toast('Link clicks are paused while editing. Select the text or image to edit it.', { id: 'live-editor-link-paused' })
  }

  const uploadImage = async (fieldKey: string, file: File | undefined) => {
    if (!file) return
    setUploadingKey(fieldKey)
    try {
      const form = new FormData()
      form.append('key', fieldKey)
      form.append('image', file)
      const response = await api.post('/admin/settings/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = response.data?.url || ''
      if (!url) throw new Error('Missing upload URL')
      if (fieldKey === selected?.key) {
        setDraft(url)
      } else {
        setRelatedDrafts((current) => ({ ...current, [fieldKey]: url }))
      }
      setValues((current) => ({ ...current, [fieldKey]: url }))
      setSavedValues((current) => ({ ...current, [fieldKey]: url }))
      toast.success('Image uploaded.')
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploadingKey(null)
    }
  }

  const renderFieldControl = (
    field: { key: string; label: string; type?: FieldType },
    value: string,
    onChange: (value: string) => void,
  ) => {
    const fieldType = field.type || 'text'
    return (
      <label className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <span className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{field.label}</span>
          <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{fieldType}</span>
        </span>
        {fieldType === 'textarea' ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        ) : (
          <input
            value={value}
            type={fieldType === 'url' ? 'text' : 'text'}
            onChange={(event) => onChange(event.target.value)}
            placeholder={fieldType === 'url' ? '/pricing or https://example.com' : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        )}
        {fieldType !== 'image' && (
          <p className="mt-2 text-right text-[11px] font-medium text-slate-400">{value.length} characters</p>
        )}
        {fieldType === 'image' && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {value ? (
              <div className="mb-3 rounded-lg border border-slate-100 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] p-3">
                <img src={assetUrl(value)} alt="" className="h-32 w-full rounded-md object-contain" />
              </div>
            ) : (
              <div className="mb-3 flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs font-bold text-slate-400">
                <ImageIcon className="mb-2 h-7 w-7 text-slate-300" />
                No image selected
              </div>
            )}
            <p className="mb-3 text-xs leading-5 text-slate-500">Transparent PNG recommended. Both dark and light versions can be uploaded for the logo fields below.</p>
            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 mb-2">
              {uploadingKey === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload / Replace Image
              <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadImage(field.key, event.target.files?.[0])} />
            </label>
            <button type="button" onClick={() => openLibrary(field.key)}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Images className="h-4 w-4" /> Pick from library
            </button>
          </div>
        )}
      </label>
    )
  }

  const addedSections = (() => {
    try {
      const parsed = JSON.parse(currentSetting(liveSectionsKey, savedSetting(liveSectionsKey, '[]')))
      return Array.isArray(parsed)
        ? parsed.map((section) => ({ key: `page_live_section_${section.id}`, label: section.title || 'Added section' }))
        : []
    } catch {
      return []
    }
  })()
  const allSections = [
    ...(baseSectionsByPage[pageKey] || []),
    ...addedSections,
    { key: 'page_global_header_section', label: 'Header' },
    { key: 'page_global_footer_section', label: 'Footer' },
  ]

  const renderSectionList = () => (
    <div className="space-y-2">
      {allSections.map((section) => {
        const hidden = currentSetting(`${section.key}_hidden`, savedSetting(`${section.key}_hidden`, '0')) === '1'
        return (
          <button
            key={section.key}
            type="button"
            onClick={() => selectSection(section)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${selected?.sectionKey === section.key ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
          >
            <span>
              <span className="block text-sm font-bold text-slate-950">{section.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{hidden ? 'Hidden from website' : 'Visible on website'}</span>
            </span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${hidden ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{hidden ? 'Hidden' : 'Live'}</span>
          </button>
        )
      })}
    </div>
  )

  const renderHeaderNavList = () => {
    const links = readHeaderNavLinks().map((item: any, index: number) => {
      const id = item.id || `nav_${index}`
      return {
        id,
        label: currentSetting(`page_global_header_nav_${id}_label`, savedSetting(`page_global_header_nav_${id}_label`, item.label || 'Link')),
        url: currentSetting(`page_global_header_nav_${id}_url`, savedSetting(`page_global_header_nav_${id}_url`, item.url || '/')),
      }
    })

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Navigation links</p>
          <button type="button" onClick={addHeaderNavLink} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">Add</button>
        </div>
        {links.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => quickSelect({
                  key: `page_global_header_nav_${item.id}_label`,
                  label: `${item.label} navigation link`,
                  type: 'text',
                  fallback: item.label,
                  relatedFields: [{ key: `page_global_header_nav_${item.id}_url`, label: 'Navigation URL', type: 'url', fallback: item.url }],
                }, 'header')}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-bold text-slate-950">{item.label}</span>
                <span className="block truncate text-xs text-slate-500">{item.url}</span>
              </button>
              <button
                type="button"
                onClick={() => removeHeaderNavLink(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                title={`Delete ${item.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <LiveEditorContext.Provider value={contextValue}>
      <div
        onClickCapture={handleCanvasClickCapture}
        className={`${isAdmin && editMode && !previewMode ? 'md:pl-[420px]' : ''} transition-[padding] duration-300`}
      >
        {children}
      </div>

      {isAdmin && (
        <button
          onClick={() => {
            setEditMode((current) => !current)
            setSelected(null)
            setPreviewMode(false)
          }}
          className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-bold shadow-2xl transition hover:-translate-y-0.5 ${
            editMode
              ? 'border-blue-500 bg-blue-600 text-white shadow-blue-900/30'
              : 'border-blue-100 bg-white text-slate-950 shadow-slate-900/15 hover:border-blue-300'
          }`}
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${editMode ? 'bg-white/15' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'}`}>
            {editMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </span>
          <span className="leading-tight">
            <span className="block text-left">{editMode ? 'Preview Website' : 'Website Builder'}</span>
            <span className={`block text-[10px] font-semibold ${editMode ? 'text-blue-100' : 'text-slate-500'}`}>{editMode ? 'Exit editing mode' : 'Live page editor'}</span>
          </span>
        </button>
      )}

      {isAdmin && editMode && (
        <aside className="fixed inset-x-3 bottom-20 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 md:bottom-0 md:left-0 md:top-0 md:w-[420px] md:rounded-none">
          <div className="flex min-h-[560px] max-h-[calc(100vh-6rem)] bg-slate-950 md:h-screen md:max-h-screen">
            <div className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-slate-950 px-2 py-4 text-white md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="mt-2 flex flex-1 flex-col items-center gap-2">
                <button onClick={() => setActiveTool('page')} className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${activeTool === 'page' ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Page content">
                  <FileText className="h-5 w-5" />
                </button>
                <button onClick={() => setActiveTool('sections')} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTool === 'sections' ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Sections">
                  <Layers3 className="h-5 w-5" />
                </button>
                <button onClick={() => setActiveTool('add')} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTool === 'add' ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Add section">
                  <Plus className="h-5 w-5" />
                </button>
                <button onClick={() => setActiveTool('header')} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTool === 'header' ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Header">
                  <LayoutTemplate className="h-5 w-5" />
                </button>
                <button onClick={() => setActiveTool('footer')} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTool === 'footer' ? 'bg-white text-blue-600' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Footer">
                  <Monitor className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-1 bg-white">
              <div className="border-b border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Website Builder</p>
                    <h2 className="font-heading mt-1 text-lg font-bold text-slate-950">{previewMode ? 'Preview mode' : 'Live editor'}</h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">{pageLabel}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewMode((current) => !current)} className={`rounded-xl border p-2 text-sm font-bold ${previewMode ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} title="Preview website">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={closeBuilder} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900" title="Close builder">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">Editing page</span>
                    <select
                      value={currentPage.path}
                      onChange={(event) => {
                        setSelected(null)
                        setPreviewMode(false)
                        navigate(event.target.value)
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {publicPages.map((page) => <option key={page.path} value={page.path}>{page.label}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                    {[
                      ['page', 'Page'],
                      ['sections', 'Sections'],
                      ['add', 'Add'],
                      ['header', 'Header'],
                      ['footer', 'Footer'],
                    ].map(([tool, label]) => (
                      <button key={tool} type="button" onClick={() => setActiveTool(tool as any)} className={`rounded-lg px-2 py-2 transition ${activeTool === tool ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(100vh-250px)] overflow-y-auto bg-slate-50 p-4 md:max-h-[calc(100vh-185px)]">
                {activeTool === 'add' ? (
                  <div className="space-y-3">
                    {[
                      ['hero', 'Hero / Intro', 'Large premium intro section with headline and CTA.'],
                      ['split', 'Two Column', 'Text and visual-style content block.'],
                      ['features', 'Feature Grid', 'Three benefit cards for services or selling points.'],
                      ['cta', 'Call To Action', 'Conversion section with button.'],
                    ].map(([type, title, desc]) => (
                      <button key={type} onClick={() => addSection(type)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Plus className="h-5 w-5" /></span>
                          <span>
                            <span className="block text-sm font-bold text-slate-950">{title}</span>
                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">{desc}</span>
                          </span>
                        </span>
                      </button>
                    ))}
                    <button onClick={addSocialLink} className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100">
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Share2 className="h-5 w-5" /></span>
                        <span>
                          <span className="block text-sm font-bold text-slate-950">Social Icon</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-600">Add another editable social link with icon upload.</span>
                        </span>
                      </span>
                    </button>
                  </div>
                ) : activeTool === 'sections' ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-bold text-slate-950">Sections on {currentPage.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Select a named section to hide or restore it. Drag sections directly on the page to reorder supported sections.</p>
                    </div>
                    {renderSectionList()}
                  </div>
                ) : activeTool === 'header' ? (
                  <div className="space-y-3">
                    <button type="button" onClick={() => quickSelect({ key: 'page_global_header_logo_image_dark', label: 'Dark / Color Logo — desktop light header', type: 'image', fallback: currentSetting('page_global_header_logo_image_dark', '/brand/amirnazir-logo-dark.png'), relatedFields: [
                      { key: 'page_global_header_logo_image_light', label: 'Light / White Logo — dark header & dark mode', type: 'image' },
                      { key: 'page_global_header_logo_mobile_dark', label: 'Mobile Menu Logo (Dark) — shows in open drawer on light mode', type: 'image' },
                      { key: 'page_global_header_logo_mobile_light', label: 'Mobile Menu Logo (Light) — shows in open drawer on dark mode', type: 'image' },
                    ] }, 'header')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Header & Navbar Logo</span>
                      <span className="text-xs text-slate-500">4 logo variants: dark · light · mobile dark · mobile light</span>
                    </button>
                    <button type="button" onClick={() => quickSelect({ key: 'page_global_header_cta_text', label: 'Header button', type: 'text', fallback: 'Get Started', relatedFields: [{ key: 'page_global_header_cta_url', label: 'Button URL', type: 'url' }] }, 'header')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Button</span>
                      <span className="text-xs text-slate-500">Edit call-to-action text and link</span>
                    </button>
                    {renderHeaderNavList()}
                    <button type="button" onClick={() => selectSection({ key: 'page_global_header_section', label: 'Header' })} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Header section</span>
                      <span className="text-xs text-slate-500">Hide or restore the whole header</span>
                    </button>
                  </div>
                ) : activeTool === 'footer' ? (
                  <div className="space-y-3">
                    <button type="button" onClick={() => quickSelect({ key: 'page_global_footer_logo_image_dark', label: 'Footer Logo (Dark/Color) — light footer backgrounds', type: 'image', fallback: currentSetting('page_global_footer_logo_image_dark', '/brand/amirnazir-logo-light.png'), relatedFields: [
                      { key: 'page_global_footer_logo_image_light', label: 'Footer Logo (Light/White) — dark footer backgrounds', type: 'image' },
                    ] }, 'footer')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Footer Logo</span>
                      <span className="text-xs text-slate-500">Dark logo + White logo — 2 variants</span>
                    </button>
                    <button type="button" onClick={addSocialLink} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Add social icon</span>
                      <span className="text-xs text-slate-500">Add an icon with image upload and URL</span>
                    </button>
                    <button type="button" onClick={() => selectSection({ key: 'page_global_footer_section', label: 'Footer' })} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-950">Footer section</span>
                      <span className="text-xs text-slate-500">Hide or restore the whole footer</span>
                    </button>
                  </div>
                ) : !selected ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-8 text-center shadow-sm">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                        <MousePointer2 className="h-6 w-6" />
                      </div>
                      <p className="text-base font-bold text-slate-900">{previewMode ? 'Preview is active' : 'Select content'}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{previewMode ? 'Click the eye button again to return to editing.' : 'Click highlighted text, image, logo, button text, or use the Sections tab.'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Layers3 className="h-4 w-4 text-blue-600" /> Builder status</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real live page editing</div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Upload images directly</div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Preview before publish</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-1">
                    <div className="rounded-2xl border border-blue-100 bg-white px-3 py-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{selected.sectionKey ? 'Section Inspector' : 'Inspector'}</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-950">{selected.label}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">{activeFieldCount} editable control{activeFieldCount === 1 ? '' : 's'} selected</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${hasPreviewChanges ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {hasPreviewChanges ? 'Previewing' : 'Saved'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{selected.sectionKey ? 'This controls the entire section. Use delete to hide the whole block from the live page.' : 'Edit the field below. Changes preview instantly on the live page.'}</p>
                    </div>

                    {!selected.sectionKey && renderFieldControl(selected, draft, (nextValue) => {
                        setDraft(nextValue)
                        contextValue.setDraftValue(selected.key, nextValue)
                      })}

                    {!selected.sectionKey && (selected.relatedFields || []).map((field) => (
                      <div key={field.key}>
                        {renderFieldControl(field, relatedDrafts[field.key] || '', (nextValue) => {
                          setRelatedDrafts((current) => ({ ...current, [field.key]: nextValue }))
                          contextValue.setDraftValue(field.key, nextValue)
                        })}
                      </div>
                    ))}
                    <div className="sticky bottom-0 -mx-4 -mb-4 grid grid-cols-4 gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
                      <button
                        type="button"
                        onClick={deleteSelectedContent}
                        disabled={saving}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {selectedKind === 'section' ? 'Hide' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={resetSelectedToDefault}
                        disabled={saving || Boolean(selected.sectionKey)}
                        className="flex h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={resetSelectedPreview}
                        disabled={saving || !hasPreviewChanges || Boolean(selected.sectionKey)}
                        className="flex h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Discard
                      </button>
                      <button
                        onClick={saveSelected}
                        disabled={saving || !hasPreviewChanges}
                        className="flex h-11 items-center justify-center gap-1 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Publish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Image library picker modal */}
      {libraryKey && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setLibraryKey(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <p className="font-bold text-slate-950 text-sm">Image Library</p>
                <p className="text-slate-400 text-xs mt-0.5">Click an image to use it</p>
              </div>
              <button onClick={() => setLibraryKey(null)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {libraryLoading ? (
                <div className="flex items-center justify-center h-32 text-slate-400 gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Images className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-slate-400 text-sm">No uploaded images yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {libraryImages.map(img => (
                    <button key={img.url} type="button"
                      onClick={() => {
                        setValues(current => ({ ...current, [libraryKey]: img.url }))
                        setLibraryKey(null)
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 transition aspect-square bg-slate-50">
                      <img src={img.url} alt={img.name} className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition flex items-center justify-center">
                        <Check className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition drop-shadow" />
                      </div>
                      <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition">{img.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </LiveEditorContext.Provider>
  )
}

export function EditableText({
  fieldKey,
  label,
  fallback,
  as = 'span',
  type = 'text',
  className,
  relatedFields,
}: {
  fieldKey: string
  label: string
  fallback: string
  as?: ElementType
  type?: FieldType
  className?: string
  relatedFields?: RelatedField[]
}) {
  const editor = useLiveEditor()
  const Tag = as as any
  const text = editor.value(fieldKey, fallback)
  const displayText = text || (editor.editMode ? `[Empty: ${label}]` : '')

  return (
    <Tag
      data-live-editable="true"
      onClick={(event: React.MouseEvent) => {
        if (!editor.editMode) return
        event.preventDefault()
        event.stopPropagation()
        editor.select({ key: fieldKey, label, type, fallback, relatedFields })
      }}
      className={`${className || ''} ${editor.editMode ? 'cursor-pointer rounded-md outline outline-2 outline-dashed outline-blue-400/70 outline-offset-4 transition hover:bg-blue-500/10 hover:outline-blue-600 hover:ring-4 hover:ring-blue-500/10' : ''}`}
      title={editor.editMode ? `Edit ${label}` : undefined}
    >
      {displayText}
    </Tag>
  )
}

export function EditableSection({
  sectionKey,
  label,
  children,
  className = '',
}: {
  sectionKey: string
  label: string
  children: ReactNode
  className?: string
}) {
  const editor = useLiveEditor()
  const hidden = editor.value(`${sectionKey}_hidden`, '0') === '1'
  let order: string[] = []
  try {
    order = JSON.parse(editor.value(`page_section_order_${editor.pageKey}`, '[]'))
  } catch {
    order = []
  }
  const hasCustomOrder = order.length > 0
  const sectionOrder = order.includes(sectionKey) ? order.indexOf(sectionKey) : undefined

  if (hidden && !editor.editMode) return null

  if (hidden) {
    return (
      <section className="border-y border-dashed border-blue-200 bg-blue-50/70 px-4 py-8 text-center">
        <p className="text-sm font-bold text-blue-900">{label} section is hidden</p>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            editor.restoreSection(sectionKey, label)
          }}
          className="mt-3 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          Restore section
        </button>
      </section>
    )
  }

  return (
    <div
      data-live-section="true"
      draggable={editor.editMode}
      onDragStart={(event) => {
        if (!editor.editMode) return
        event.dataTransfer.setData('text/plain', sectionKey)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(event) => {
        if (!editor.editMode) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        if (!editor.editMode) return
        event.preventDefault()
        const draggedKey = event.dataTransfer.getData('text/plain')
        editor.moveSectionBefore(draggedKey, sectionKey)
      }}
      onClick={(event) => {
        if (!editor.editMode) return
        const target = event.target as HTMLElement
        if (target.closest('[data-live-editable="true"]')) return
        editor.select({ key: `${sectionKey}_hidden`, label: `${label} section`, type: 'text', fallback: '0', sectionKey, sectionLabel: label })
      }}
      className={`${className} ${editor.editMode ? 'relative outline outline-1 outline-dashed outline-blue-300/40 outline-offset-[-4px] hover:outline-blue-500/80' : ''}`}
      style={hasCustomOrder ? { order: sectionOrder ?? 999 } : undefined}
      title={editor.editMode ? `Click to edit ${label} section` : undefined}
    >
      {editor.editMode && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-blue-900/20">
          Drag section
        </div>
      )}
      {children}
    </div>
  )
}

export function EditableImage({
  fieldKey,
  label,
  fallback,
  alt,
  className,
  relatedFields,
}: {
  fieldKey: string
  label: string
  fallback: string
  alt: string
  className?: string
  relatedFields?: RelatedField[]
}) {
  const editor = useLiveEditor()
  const src = editor.value(fieldKey, fallback)
  const resolvedSrc = assetUrl(src)
  const [failedSrc, setFailedSrc] = useState('')
  const showImage = resolvedSrc && resolvedSrc !== failedSrc

  useEffect(() => {
    setFailedSrc('')
  }, [src])

  return (
    <span
      data-live-editable="true"
      role={editor.editMode ? 'button' : undefined}
      tabIndex={editor.editMode ? 0 : undefined}
      onClick={(event) => {
        if (!editor.editMode) return
        event.preventDefault()
        event.stopPropagation()
        editor.select({ key: fieldKey, label, type: 'image', fallback, relatedFields })
      }}
      className={`${editor.editMode ? 'cursor-pointer rounded-xl outline outline-2 outline-dashed outline-blue-400/70 outline-offset-4 transition hover:ring-4 hover:ring-blue-500/10' : 'cursor-default'} block`}
      title={editor.editMode ? `Edit ${label}` : undefined}
    >
      {showImage ? (
        <img src={resolvedSrc} alt={alt} className={className} onError={() => setFailedSrc(resolvedSrc)} />
      ) : (
        <span className={`flex items-center justify-center bg-transparent text-current ${className || ''}`}>
          <span className="px-2 text-center text-sm font-bold leading-tight">{alt || <ImageIcon className="h-8 w-8" />}</span>
        </span>
      )}
    </span>
  )
}
