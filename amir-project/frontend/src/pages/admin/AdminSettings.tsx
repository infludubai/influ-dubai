import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, X, Loader2, Images, Check } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Field, AdminInput, AdminTextarea, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

// ── Image Library Modal ────────────────────────────────────────────────────────
function ImageLibraryModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/admin/settings/images")
      .then(r => setImages(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Image Library</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Click an image to use it</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Images className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">No images uploaded yet</p>
              <p className="text-muted-foreground/50 text-xs mt-1">Upload an image first, then it will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {images.map(img => (
                <button key={img.url} type="button"
                  onClick={() => { onSelect(img.url); onClose() }}
                  className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/60 transition aspect-square bg-muted/50">
                  <img src={img.url} alt={img.name}
                    className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition flex items-center justify-center">
                    <Check className="w-5 h-5 text-foreground opacity-0 group-hover:opacity-100 transition drop-shadow" />
                  </div>
                  <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition">{img.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single image slot (upload + library + preview + size) ──────────────────────
function ImageSlot({
  label,
  hint,
  fieldKey,
  value,
  onChange,
}: {
  label: string
  hint: string
  fieldKey: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("key", fieldKey)
      fd.append("file", file)
      const res = await api.post("/admin/settings/upload-image", fd)
      const url = res.data?.url
      if (url) { onChange(url); toast.success("Uploaded!") }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed")
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground/60 -mt-1">{hint}</p>

      {/* Preview */}
      <div className="h-24 rounded-xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value} alt="" className="max-h-20 max-w-full object-contain p-2" />
        ) : (
          <p className="text-muted-foreground/50 text-xs">No image</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <input ref={inputRef} type="file" className="hidden" accept="image/*,.ico"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = "" }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-xs hover:bg-muted transition disabled:opacity-60">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        <button type="button" onClick={() => setShowLibrary(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-xs hover:bg-muted transition">
          <Images className="w-3.5 h-3.5" /> Pick from library
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="px-3 py-2 rounded-lg border border-red-800/40 text-red-400 text-xs hover:bg-red-900/20 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showLibrary && (
        <ImageLibraryModal onSelect={onChange} onClose={() => setShowLibrary(false)} />
      )}
    </div>
  )
}

// ── Logo section card ──────────────────────────────────────────────────────────
function LogoSection({
  title,
  where,
  children,
}: {
  title: string
  where: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-5">
      <div className="pb-3 border-b border-border">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Appears on: <span className="text-muted-foreground">{where}</span></p>
      </div>
      {children}
    </div>
  )
}

// ── Size inputs ────────────────────────────────────────────────────────────────
function SizeInputs({
  widthKey,
  heightKey,
  widthValue,
  heightValue,
  onChange,
}: {
  widthKey: string
  heightKey: string
  widthValue: string
  heightValue: string
  onChange: (key: string, val: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Width (px)</p>
        <input type="number" value={widthValue} onChange={e => onChange(widthKey, e.target.value)}
          placeholder="e.g. 120"
          className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Height (px)</p>
        <input type="number" value={heightValue} onChange={e => onChange(heightKey, e.target.value)}
          placeholder="e.g. 40"
          className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground/40" />
      </div>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
const GROUPS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Logos & Brand" },
  { id: "seo", label: "SEO" },
  { id: "social", label: "Social Media" },
  { id: "email", label: "Email" },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    api.get("/admin/settings").then(r => {
      const s: Record<string, any> = {}
      ;(r.data.data ?? []).forEach((item: any) => { s[item.key] = item.value })
      setSettings(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put("/admin/settings", { settings })
      toast.success("Settings saved!")
      // Refresh navbar / live editor without page reload
      window.dispatchEvent(new Event("builder:settings-saved"))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings.")
    } finally { setSaving(false) }
  }

  if (loading) return <AdminLayout title="Settings"><div className="text-muted-foreground">Loading…</div></AdminLayout>

  const generalFields = [
    { key: "site_name", label: "Site Name", type: "text" },
    { key: "site_description", label: "Site Description", type: "textarea" },
    { key: "site_tagline", label: "Site Tagline", type: "text" },
    { key: "frontend_url", label: "Website URL for Emails", type: "text" },
    { key: "contact_email", label: "Contact Email", type: "email" },
    { key: "phone_number", label: "Phone Number", type: "text" },
    { key: "address", label: "Address", type: "textarea" },
  ]

  const seoFields = [
    { key: "meta_description", label: "Default Meta Description", type: "textarea" },
    { key: "meta_keywords", label: "Meta Keywords", type: "textarea" },
    { key: "og_image", label: "Open Graph Image URL", type: "text" },
    { key: "google_analytics", label: "Google Analytics ID", type: "text" },
  ]

  const socialFields = [
    { key: "facebook_url", label: "Facebook Profile URL", type: "text" },
    { key: "twitter_url", label: "Twitter / X Profile URL", type: "text" },
    { key: "linkedin_url", label: "LinkedIn Profile URL", type: "text" },
    { key: "instagram_url", label: "Instagram Profile URL", type: "text" },
    { key: "whatsapp_url", label: "WhatsApp Link (wa.me/...)", type: "text" },
    { key: "github_url", label: "GitHub Profile URL", type: "text" },
  ]

  const emailFields = [
    { key: "email_from_name", label: "Email From Name", type: "text" },
    { key: "email_from_address", label: "Email From Address", type: "email" },
  ]

  const fieldsByGroup: Record<string, typeof generalFields> = {
    general: generalFields,
    seo: seoFields,
    social: socialFields,
    email: emailFields,
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {GROUPS.map(g => (
            <button key={g.id} onClick={() => setActiveTab(g.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === g.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {g.label}
            </button>
          ))}
        </div>

        {/* Logos & Brand tab */}
        {activeTab === "branding" ? (
          <div className="space-y-4">

            {/* 0 — Header & Navbar */}
            <LogoSection title="Header & Navbar Logo" where="Public website header, navigation bar (all pages)">
              <p className="text-[11px] text-muted-foreground/60 -mt-2 pb-1">
                This is the logo that appears in the top navigation bar on your public website. Changes here are also reflected in the Builder.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <ImageSlot
                  label="Dark / Color Logo"
                  hint="Light backgrounds — desktop header scrolled & mobile menu"
                  fieldKey="page_global_header_logo_image_dark"
                  value={settings["page_global_header_logo_image_dark"] ?? ""}
                  onChange={url => handleChange("page_global_header_logo_image_dark", url)}
                />
                <ImageSlot
                  label="Light / White Logo"
                  hint="Dark backgrounds — top of page in dark mode"
                  fieldKey="page_global_header_logo_image_light"
                  value={settings["page_global_header_logo_image_light"] ?? ""}
                  onChange={url => handleChange("page_global_header_logo_image_light", url)}
                />
              </div>
              <SizeInputs
                widthKey="page_global_header_logo_width" heightKey="page_global_header_logo_height"
                widthValue={settings["page_global_header_logo_width"] ?? ""}
                heightValue={settings["page_global_header_logo_height"] ?? ""}
                onChange={handleChange}
              />
            </LogoSection>

            {/* 1 — Login & Signup */}
            <LogoSection title="Login & Signup Pages" where="Login page, Register page (not the header)">
              <div className="grid grid-cols-2 gap-4">
                <ImageSlot
                  label="Dark / Color Logo"
                  hint="Shows in light mode (white background)"
                  fieldKey="logo_url"
                  value={settings["logo_url"] ?? ""}
                  onChange={url => handleChange("logo_url", url)}
                />
                <ImageSlot
                  label="Light / White Logo"
                  hint="Shows in dark mode (dark background)"
                  fieldKey="logo_url_light"
                  value={settings["logo_url_light"] ?? ""}
                  onChange={url => handleChange("logo_url_light", url)}
                />
              </div>
              <SizeInputs
                widthKey="logo_auth_width" heightKey="logo_auth_height"
                widthValue={settings["logo_auth_width"] ?? ""}
                heightValue={settings["logo_auth_height"] ?? ""}
                onChange={handleChange}
              />
            </LogoSection>

            {/* 2 — Admin Panel */}
            <LogoSection title="Admin Panel Sidebar" where="Admin dashboard, admin sidebar">
              <p className="text-[11px] text-muted-foreground/60 -mt-2 pb-1">
                If left empty, the <span className="text-foreground/55">Light / White Logo</span> from Login & Signup is used automatically.
                Upload here only if you want a different logo for the admin sidebar.
              </p>
              <ImageSlot
                label="Admin Sidebar Logo (optional override)"
                hint="Recommended: white or light-colored PNG with transparent background"
                fieldKey="logo_admin_url"
                value={settings["logo_admin_url"] ?? ""}
                onChange={url => handleChange("logo_admin_url", url)}
              />
              <SizeInputs
                widthKey="logo_admin_width" heightKey="logo_admin_height"
                widthValue={settings["logo_admin_width"] ?? ""}
                heightValue={settings["logo_admin_height"] ?? ""}
                onChange={handleChange}
              />
            </LogoSection>

            {/* 3 — Favicon */}
            <LogoSection title="Favicon" where="Browser tab icon for all pages">
              <ImageSlot
                label="Favicon (.ico or .png)"
                hint="Recommended size: 32×32 or 64×64 pixels"
                fieldKey="favicon_url"
                value={settings["favicon_url"] ?? ""}
                onChange={url => handleChange("favicon_url", url)}
              />
            </LogoSection>

            {/* 4 — Email */}
            <LogoSection title="Email Templates" where="All system emails (invoices, OTP, notifications)">
              <ImageSlot
                label="Email Logo"
                hint="Shown at the top of every email. Use a version that looks good on white background."
                fieldKey="email_logo_url"
                value={settings["email_logo_url"] ?? ""}
                onChange={url => handleChange("email_logo_url", url)}
              />
            </LogoSection>

          </div>
        ) : (
          /* All other tabs */
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            {activeTab === "email" && (
              <LogoSection title="Email Logo" where="All system emails">
                <ImageSlot
                  label="Email Logo"
                  hint="Shown at the top of every email. Dark logo recommended — it's inverted to white on the dark header."
                  fieldKey="email_logo_url"
                  value={settings["email_logo_url"] ?? ""}
                  onChange={url => handleChange("email_logo_url", url)}
                />
              </LogoSection>
            )}
            {activeTab === "social" && (
              <LogoSection title="Email Footer Icons" where="All system email footers">
                <p className="text-[11px] text-muted-foreground/60 -mt-2 pb-1">
                  Upload custom icons to display as clickable links in email footers. Set the profile URLs below to activate them.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <ImageSlot
                    label="WhatsApp Icon"
                    hint="32×32 or 64×64 PNG / SVG recommended"
                    fieldKey="whatsapp_icon"
                    value={settings["whatsapp_icon"] ?? ""}
                    onChange={url => handleChange("whatsapp_icon", url)}
                  />
                  <ImageSlot
                    label="Instagram Icon"
                    hint="32×32 or 64×64 PNG / SVG recommended"
                    fieldKey="instagram_icon"
                    value={settings["instagram_icon"] ?? ""}
                    onChange={url => handleChange("instagram_icon", url)}
                  />
                </div>
              </LogoSection>
            )}
            {(fieldsByGroup[activeTab] || []).map(field => (
              <Field key={field.key} label={field.label}>
                {field.type === "textarea" ? (
                  <AdminTextarea value={settings[field.key] ?? ""} rows={2}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`} />
                ) : (
                  <AdminInput type={field.type} value={settings[field.key] ?? ""}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`} />
                )}
              </Field>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <SaveBtn loading={saving} label="Save Settings" onClick={handleSave} />
        </div>
      </div>
    </AdminLayout>
  )
}
