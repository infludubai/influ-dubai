import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'
import { assetUrl } from '@/utils/assets'

type SocialLink = {
  id?: string
  label: string
  url: string
  icon?: string
  iconImage?: string
}

const defaultSocialLinks: SocialLink[] = [
  { id: 'github', label: 'GitHub', url: '#', icon: 'GH', iconImage: '' },
  { id: 'linkedin', label: 'LinkedIn', url: '#', icon: 'IN', iconImage: '' },
  { id: 'x', label: 'X', url: '#', icon: 'X', iconImage: '' },
  { id: 'instagram', label: 'Instagram', url: '#', icon: 'IG', iconImage: '' },
]

function parseLinks(raw: string) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function EditableSocialLinks({
  variant = 'icons',
  tone = 'dark',
  className = '',
}: {
  variant?: 'icons' | 'cards'
  tone?: 'dark' | 'light'
  className?: string
}) {
  const editor = useLiveEditor()
  const configuredLinks = parseLinks(editor.value('page_global_social_links', '[]'))
  const sourceLinks = configuredLinks.length ? configuredLinks : defaultSocialLinks
  const canRemove = configuredLinks.length > 0

  const links = sourceLinks.map((item: SocialLink, index: number) => {
    const id = item.id || `social_${index}`
    return {
      id,
      label: editor.value(`page_global_social_${id}_label`, item.label || 'Social'),
      url: editor.value(`page_global_social_${id}_url`, item.url || '#'),
      icon: editor.value(`page_global_social_${id}_icon`, item.icon || item.label?.slice(0, 2) || 'S'),
      iconImage: editor.value(`page_global_social_${id}_icon_image`, item.iconImage || ''),
    }
  })
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({})
  const iconButtonClass = tone === 'light'
    ? 'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
    : 'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/8 text-xs font-bold text-white transition hover:bg-primary/20 hover:text-primary'

  return (
    <div className={`${variant === 'cards' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'flex flex-wrap items-center gap-3'} ${className}`}>
      {links.map((item) => {
        const relatedFields = [
          { key: `page_global_social_${item.id}_label`, label: `${item.label} label` },
          { key: `page_global_social_${item.id}_url`, label: `${item.label} URL`, type: 'url' as const },
          { key: `page_global_social_${item.id}_icon`, label: `${item.label} icon text` },
          { key: `page_global_social_${item.id}_icon_image`, label: `${item.label} uploaded icon`, type: 'image' as const },
        ]

        return (
          <span key={item.id} className="relative inline-flex">
            <a
              href={item.url || '#'}
              target="_blank"
              rel="noreferrer"
              title={item.label}
              className={
                variant === 'cards'
                  ? 'flex min-h-[58px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md'
                  : iconButtonClass
              }
            >
              <span className={`${variant === 'cards' ? 'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-xs font-bold text-blue-700' : 'flex h-full w-full items-center justify-center overflow-hidden'}`}>
                {item.iconImage && !failedIcons[item.id] ? (
                  <span
                    data-live-editable={editor.editMode ? 'true' : undefined}
                    role={editor.editMode ? 'button' : undefined}
                    tabIndex={editor.editMode ? 0 : undefined}
                    onClick={(event) => {
                      if (!editor.editMode) return
                      event.preventDefault()
                      event.stopPropagation()
                      editor.select({ key: `page_global_social_${item.id}_icon_image`, label: `${item.label} social icon image`, type: 'image', fallback: item.iconImage, relatedFields })
                    }}
                    className={`${editor.editMode ? 'cursor-pointer rounded-xl outline outline-2 outline-dashed outline-blue-400/70 outline-offset-2' : ''} flex h-full w-full items-center justify-center`}
                  >
                    <img
                      src={assetUrl(item.iconImage)}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      onError={() => setFailedIcons(current => ({ ...current, [item.id]: true }))}
                    />
                  </span>
                ) : (
                  <EditableText
                    fieldKey={`page_global_social_${item.id}_icon`}
                    label={`${item.label} social icon text`}
                    fallback={item.icon}
                    relatedFields={relatedFields}
                  />
                )}
              </span>
              {variant === 'cards' && (
                <span className="min-w-0">
                  <EditableText
                    fieldKey={`page_global_social_${item.id}_label`}
                    label={`${item.label} social label`}
                    fallback={item.label}
                    className="block truncate text-sm font-bold"
                    relatedFields={relatedFields}
                  />
                  <span className="block truncate text-xs text-slate-500">{item.url || '#'}</span>
                </span>
              )}
            </a>
            {editor.editMode && canRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  editor.removeSocialLink(item.id)
                }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/20 transition hover:bg-rose-700"
                title={`Delete ${item.label}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </span>
        )
      })}

      {editor.editMode && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            editor.addSocialLink()
          }}
          className={variant === 'cards'
            ? 'flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100'
            : 'flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-blue-300 bg-blue-50 text-blue-700 transition hover:bg-blue-100'}
          title="Add social icon"
        >
          <Plus className="h-4 w-4" />
          {variant === 'cards' && 'Add social'}
        </button>
      )}
    </div>
  )
}
