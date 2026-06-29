import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Star, CheckCircle2, X, Copy } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminTextarea, AdminSelect, AdminToggle, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

const EMPTY = {
  name:"", description:"", short_description:"", price:"", price_aed:"", currency:"USD",
  delivery_days:"", revisions:"3", features:[] as string[],
  is_featured:false, is_active:true, sort_order:"0",
}

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [featureInput, setFeatureInput] = useState("")
  const [saving, setSaving] = useState(false)

  const load = () => api.get("/admin/packages").then(r => setPackages(r.data.data ?? []))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({...EMPTY}); setModal(true) }
  const openEdit = (pkg: any) => {
    setEditing(pkg)
    setForm({
      name: pkg.name ?? "", description: pkg.description ?? "",
      short_description: pkg.short_description ?? "",
      price: String(pkg.price ?? ""), price_aed: String(pkg.price_aed ?? ""),
      currency: pkg.currency ?? "USD",
      delivery_days: String(pkg.delivery_days ?? ""),
      revisions: String(pkg.revisions ?? "3"),
      features: Array.isArray(pkg.features) ? pkg.features : [],
      is_featured: !!pkg.is_featured, is_active: pkg.is_active !== false,
      sort_order: String(pkg.sort_order ?? "0"),
    })
    setModal(true)
  }

  const openDuplicate = (pkg: any) => {
    setEditing(null)
    setForm({
      name: `${pkg.name} (Copy)`,
      description: pkg.description ?? "",
      short_description: pkg.short_description ?? "",
      price: String(pkg.price ?? ""),
      price_aed: String(pkg.price_aed ?? ""),
      currency: pkg.currency ?? "USD",
      delivery_days: String(pkg.delivery_days ?? ""),
      revisions: String(pkg.revisions ?? "3"),
      features: Array.isArray(pkg.features) ? [...pkg.features] : [],
      is_featured: false,
      is_active: true,
      sort_order: String(pkg.sort_order ?? "0"),
    })
    setModal(true)
  }

  const addFeature = () => {
    if (!featureInput.trim()) return
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }))
    setFeatureInput("")
  }
  const removeFeature = (i: number) =>
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.delivery_days) { toast.error("Name, price & delivery days required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        price_aed: form.price_aed ? parseFloat(form.price_aed) : null,
        delivery_days: parseInt(form.delivery_days),
        revisions: parseInt(form.revisions),
        sort_order: parseInt(form.sort_order),
      }
      if (editing) await api.put(`/admin/packages/${editing.id}`, payload)
      else await api.post("/admin/packages", payload)
      toast.success(editing ? "Package updated!" : "Package created!")
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await api.delete(`/admin/packages/${id}`); toast.success("Deleted."); load() }
    catch (err: any) { toast.error(err.response?.data?.message || "Cannot delete — has active orders.") }
  }

  return (
    <AdminLayout title="Packages">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{packages.length} packages</p>
        <button onClick={openCreate}
          className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-card rounded-xl border border-border p-5 hover:border-border transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-sm truncate">{pkg.name}</h3>
                  {pkg.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-muted-foreground text-xs line-clamp-1">{pkg.short_description}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openDuplicate(pkg)} title="Duplicate"
                  className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEdit(pkg)}
                  className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(pkg.id, pkg.name)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-heading font-bold text-xl text-foreground">
                  {Number(pkg.price) === 0 ? "Custom" : `$${Number(pkg.price).toLocaleString()}`}
                </span>
                {pkg.price_aed && Number(pkg.price_aed) > 0 && (
                  <span className="text-muted-foreground text-xs ml-2">/ AED {Number(pkg.price_aed).toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{pkg.delivery_days}d</span>
                <span className={`w-2 h-2 rounded-full ${pkg.is_active ? "bg-green-400" : "bg-muted-foreground/40"}`} />
              </div>
            </div>
            {Array.isArray(pkg.features) && pkg.features.length > 0 && (
              <ul className="space-y-1">
                {pkg.features.slice(0, 4).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary/60 flex-shrink-0" /> {f}
                  </li>
                ))}
                {pkg.features.length > 4 && (
                  <li className="text-xs text-muted-foreground/50 pl-4">+{pkg.features.length - 4} more</li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.name}` : "New Package"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Package Name" required>
              <AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="e.g. Business Website" required />
            </Field>
            <Field label="Currency">
              <AdminSelect value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                {["USD","EUR","GBP","PKR","AED"].map(c => <option key={c}>{c}</option>)}
              </AdminSelect>
            </Field>
          </div>
          <Field label="Short Description" hint="Shown on pricing cards (~80 chars)">
            <AdminInput value={form.short_description}
              onChange={e => setForm({...form, short_description: e.target.value})}
              placeholder="One-line summary of the package" />
          </Field>
          <Field label="Full Description" required>
            <AdminTextarea value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={3} placeholder="Detailed description for package page" required />
          </Field>
          {/* Pricing */}
          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing — enter one or both currencies</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (USD $)" required>
                <AdminInput type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})} placeholder="299" required />
              </Field>
              <Field label="Price (AED د.إ)" hint="Shows currency toggle on pricing page">
                <AdminInput type="number" min="0" step="0.01" value={form.price_aed}
                  onChange={e => setForm({...form, price_aed: e.target.value})} placeholder="1,099" />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Delivery (days)" required>
              <AdminInput type="number" min="1" value={form.delivery_days}
                onChange={e => setForm({...form, delivery_days: e.target.value})} placeholder="7" required />
            </Field>
            <Field label="Revisions" hint="-1 = unlimited">
              <AdminInput type="number" min="-1" value={form.revisions}
                onChange={e => setForm({...form, revisions: e.target.value})} placeholder="3" />
            </Field>
            <Field label="Sort Order">
              <AdminInput type="number" min="0" value={form.sort_order}
                onChange={e => setForm({...form, sort_order: e.target.value})} placeholder="0" />
            </Field>
          </div>

          <Field label="Features List" hint="Press Enter or click Add after each feature">
            <div className="flex gap-2 mb-2">
              <AdminInput value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature() } }}
                placeholder="e.g. Mobile responsive design" className="flex-1" />
              <button type="button" onClick={addFeature}
                className="px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium whitespace-nowrap">
                + Add
              </button>
            </div>
            {form.features.length > 0 && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 group/item">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm flex-1">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)}
                      className="text-muted-foreground/40 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div className="flex flex-wrap gap-6 py-1">
            <AdminToggle checked={form.is_active} onChange={v => setForm({...form, is_active: v})}
              label="Active (visible on site)" />
            <AdminToggle checked={form.is_featured} onChange={v => setForm({...form, is_featured: v})}
              label="Featured (highlighted card)" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={editing ? "Update Package" : "Create Package"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
