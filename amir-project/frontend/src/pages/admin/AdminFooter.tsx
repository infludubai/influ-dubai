import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Field, AdminInput, AdminTextarea, SaveBtn } from "@/components/admin/AdminField"
import toast from "react-hot-toast"

export default function AdminFooter() {
  const [saving, setSaving] = useState(false)
  const [footer, setFooter] = useState({
    companyName: "Amir Nazir",
    description: "Premium digital services for your business.",
    copyright: "© 2026 Amir Nazir. All rights reserved.",
    email: "info@a-mir.com",
    phone: "+92 300 XXXXXXX",
    address: "Islamabad, Pakistan",
    twitter: "", linkedin: "", github: "", instagram: "",
    quickLinks: [
      { label: "Services", url: "/services" },
      { label: "Portfolio", url: "/portfolio" },
      { label: "Pricing", url: "/pricing" },
    ],
  })

  const updateLink = (idx: number, key: string, val: string) => {
    const ql = footer.quickLinks.map((l, i) => i === idx ? { ...l, [key]: val } : l)
    setFooter({ ...footer, quickLinks: ql })
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { toast.success("Footer settings saved!"); setSaving(false) }, 600)
  }

  return (
    <AdminLayout title="Footer Settings">
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted-foreground text-xs mb-3 uppercase tracking-wider font-semibold">Preview</p>
          <div className="bg-card rounded-lg p-5 text-xs">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="font-bold text-foreground mb-1">{footer.companyName}</p>
                <p className="text-muted-foreground">{footer.description}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Quick Links</p>
                {footer.quickLinks.map((l, i) => <p key={i} className="text-muted-foreground">{l.label}</p>)}
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Contact</p>
                <p className="text-muted-foreground">{footer.email}</p>
                <p className="text-muted-foreground">{footer.phone}</p>
              </div>
            </div>
            <p className="text-muted-foreground/60 text-center border-t border-border pt-3">{footer.copyright}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Company Info</h2>
          <Field label="Company Name"><AdminInput value={footer.companyName} onChange={e => setFooter({ ...footer, companyName: e.target.value })} /></Field>
          <Field label="Description"><AdminTextarea value={footer.description} onChange={e => setFooter({ ...footer, description: e.target.value })} rows={2} /></Field>
          <Field label="Copyright"><AdminInput value={footer.copyright} onChange={e => setFooter({ ...footer, copyright: e.target.value })} /></Field>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact</h2>
          <Field label="Email"><AdminInput type="email" value={footer.email} onChange={e => setFooter({ ...footer, email: e.target.value })} /></Field>
          <Field label="Phone"><AdminInput value={footer.phone} onChange={e => setFooter({ ...footer, phone: e.target.value })} /></Field>
          <Field label="Address"><AdminInput value={footer.address} onChange={e => setFooter({ ...footer, address: e.target.value })} /></Field>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Links</h2>
          {([["Twitter", "twitter"], ["LinkedIn", "linkedin"], ["GitHub", "github"], ["Instagram", "instagram"]] as const).map(([label, key]) => (
            <Field key={key} label={label}>
              <AdminInput value={(footer as any)[key]} onChange={e => setFooter({ ...footer, [key]: e.target.value })} placeholder={`https://${key}.com/...`} />
            </Field>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Links</h2>
            <button onClick={() => setFooter({ ...footer, quickLinks: [...footer.quickLinks, { label: "", url: "" }] })}
              className="text-xs text-primary hover:underline">+ Add Link</button>
          </div>
          <div className="space-y-2">
            {footer.quickLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <AdminInput value={link.label} onChange={e => updateLink(idx, "label", e.target.value)} placeholder="Label" />
                <AdminInput value={link.url} onChange={e => updateLink(idx, "url", e.target.value)} placeholder="/url" />
                <button onClick={() => setFooter({ ...footer, quickLinks: footer.quickLinks.filter((_, i) => i !== idx) })}
                  className="w-9 flex items-center justify-center text-red-400/60 hover:text-red-400 text-xl flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <SaveBtn loading={saving} label="Save Footer" onClick={handleSave} />
        </div>
      </div>
    </AdminLayout>
  )
}
