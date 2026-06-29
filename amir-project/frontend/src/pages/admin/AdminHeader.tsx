import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Field, AdminInput, SaveBtn } from "@/components/admin/AdminField"
import toast from "react-hot-toast"

const DEFAULT_HEADER = {
  logo_text: "Amir Nazir",
  logo_color: "#0c90e7",
  nav_items: [
    { label: "Home", url: "/" },
    { label: "Services", url: "/services" },
    { label: "Portfolio", url: "/portfolio" },
    { label: "Pricing", url: "/pricing" },
    { label: "About", url: "/about" },
    { label: "Blog", url: "/blog" },
    { label: "Contact", url: "/contact" },
  ],
}

export default function AdminHeader() {
  const [header, setHeader] = useState({ ...DEFAULT_HEADER })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setTimeout(() => {
      toast.success("Header settings saved!")
      setSaving(false)
    }, 600)
  }

  const updateNavItem = (idx: number, key: string, value: string) => {
    const newItems = header.nav_items.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
    )
    setHeader({ ...header, nav_items: newItems })
  }

  const removeNavItem = (idx: number) => {
    setHeader({ ...header, nav_items: header.nav_items.filter((_, i) => i !== idx) })
  }

  const addNavItem = () => {
    setHeader({ ...header, nav_items: [...header.nav_items, { label: "", url: "" }] })
  }

  return (
    <AdminLayout title="Header Settings">
      <div className="max-w-2xl space-y-6">

        {/* Logo */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logo</h2>
          <Field label="Logo Text">
            <AdminInput value={header.logo_text}
              onChange={e => setHeader({ ...header, logo_text: e.target.value })}
              placeholder="Amir Nazir" />
          </Field>
          <Field label="Logo Color">
            <div className="flex gap-3 items-center">
              <input type="color" value={header.logo_color}
                onChange={e => setHeader({ ...header, logo_color: e.target.value })}
                className="w-12 h-11 rounded cursor-pointer border border-border bg-transparent p-1" />
              <span className="text-muted-foreground text-sm font-mono">{header.logo_color}</span>
            </div>
          </Field>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted-foreground text-xs mb-3 uppercase tracking-wider font-semibold">Preview</p>
          <div className="bg-muted/30 rounded-lg px-5 py-3 flex items-center justify-between">
            <span className="font-heading font-bold text-lg" style={{ color: header.logo_color }}>
              {header.logo_text || "Your Logo"}
            </span>
            <div className="flex gap-4">
              {header.nav_items.slice(0, 4).map((item, i) => (
                <span key={i} className="text-muted-foreground text-sm">{item.label}</span>
              ))}
              {header.nav_items.length > 4 && (
                <span className="text-muted-foreground/60 text-sm">+{header.nav_items.length - 4}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navigation Items</h2>
            <button onClick={addNavItem}
              className="text-xs text-primary hover:underline">+ Add Link</button>
          </div>
          <div className="space-y-3">
            {header.nav_items.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <AdminInput value={item.label}
                  onChange={e => updateNavItem(idx, "label", e.target.value)}
                  placeholder="Label" />
                <AdminInput value={item.url}
                  onChange={e => updateNavItem(idx, "url", e.target.value)}
                  placeholder="/url" />
                <button onClick={() => removeNavItem(idx)}
                  className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors text-lg">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <SaveBtn loading={saving} label="Save Header" onClick={handleSave} />
        </div>
      </div>
    </AdminLayout>
  )
}
