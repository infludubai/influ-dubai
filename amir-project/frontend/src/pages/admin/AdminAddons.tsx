import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminTextarea, AdminSelect, AdminToggle, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

const EMPTY = {
  name:"", description:"", price:"", delivery_days_extra:"0",
  billing_type:"one_time", is_active:true, sort_order:"0",
}

export default function AdminAddons() {
  const [addons, setAddons] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [saving, setSaving] = useState(false)

  const load = () => api.get("/admin/addons").then(r => setAddons(r.data.data ?? []))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({...EMPTY}); setModal(true) }
  const openEdit = (a: any) => {
    setEditing(a)
    setForm({
      name: a.name, description: a.description ?? "",
      price: String(a.price), delivery_days_extra: String(a.delivery_days_extra ?? 0),
      billing_type: a.billing_type ?? "one_time",
      is_active: a.is_active, sort_order: String(a.sort_order),
    })
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error("Name and price required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        delivery_days_extra: parseInt(form.delivery_days_extra),
        sort_order: parseInt(form.sort_order),
      }
      if (editing) await api.put(`/admin/addons/${editing.id}`, payload)
      else await api.post("/admin/addons", payload)
      toast.success(editing ? "Add-on updated!" : "Add-on created!")
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/admin/addons/${id}`); toast.success("Deleted."); load() }
    catch (err: any) { toast.error(err.response?.data?.message || "Cannot delete.") }
  }

  const monthly = addons.filter(a => a.billing_type === "monthly")
  const oneTime = addons.filter(a => a.billing_type !== "monthly")

  return (
    <AdminLayout title="Add-ons">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{addons.length} add-ons</p>
        <button onClick={openCreate}
          className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Add-on
        </button>
      </div>

      {[{ label: "One-Time Add-ons", items: oneTime }, { label: "Monthly Add-ons", items: monthly }].map(group => (
        group.items.length > 0 && (
          <div key={group.label} className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.label}</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {group.items.map((a, i) => (
                <div key={a.id}
                  className={`flex items-center justify-between px-5 py-3.5 group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-medium">{a.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.billing_type === "monthly"
                          ? "bg-purple-500/15 text-purple-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {a.billing_type === "monthly" ? "Monthly" : "One-time"}
                      </span>
                      {!a.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground/60">Inactive</span>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-muted-foreground/60 text-xs mt-0.5 truncate">{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground text-sm">${Number(a.price).toLocaleString()}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(a.id, a.name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.name}` : "New Add-on"} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Add-on Name" required>
            <AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. WhatsApp Chat Integration" required />
          </Field>
          <Field label="Description">
            <AdminTextarea value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={2} placeholder="Brief description shown to client" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" required>
              <AdminInput type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})} placeholder="49" required />
            </Field>
            <Field label="Billing Type">
              <AdminSelect value={form.billing_type}
                onChange={e => setForm({...form, billing_type: e.target.value})}>
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly recurring</option>
              </AdminSelect>
            </Field>
            <Field label="Extra Delivery Days">
              <AdminInput type="number" min="0" value={form.delivery_days_extra}
                onChange={e => setForm({...form, delivery_days_extra: e.target.value})} placeholder="0" />
            </Field>
            <Field label="Sort Order">
              <AdminInput type="number" min="0" value={form.sort_order}
                onChange={e => setForm({...form, sort_order: e.target.value})} placeholder="0" />
            </Field>
          </div>
          <AdminToggle checked={form.is_active} onChange={v => setForm({...form, is_active: v})}
            label="Active (visible in checkout)" />
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={editing ? "Update Add-on" : "Create Add-on"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
