import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminTextarea, AdminSelect, AdminToggle, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

const EMPTY = {
  name:"", type:"bank", instructions:"", is_active:true, sort_order:"1",
  account_details: {} as Record<string, string>
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [saving, setSaving] = useState(false)
  const [detailKey, setDetailKey] = useState("")
  const [detailValue, setDetailValue] = useState("")

  const load = () => api.get("/admin/payment-methods").then(r => setMethods(r.data.data ?? []))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({...EMPTY}); setDetailKey(""); setDetailValue(""); setModal(true) }
  const openEdit = (m: any) => {
    setEditing(m)
    setForm({
      name: m.name, type: m.type, instructions: m.instructions ?? "",
      is_active: m.is_active, sort_order: String(m.sort_order),
      account_details: m.account_details ?? {}
    })
    setDetailKey(""); setDetailValue("")
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.type) { toast.error("Name and type required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order),
      }
      if (editing) await api.put(`/admin/payment-methods/${editing.id}`, payload)
      else await api.post("/admin/payment-methods", payload)
      toast.success(editing ? "Payment method updated!" : "Payment method created!")
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/admin/payment-methods/${id}`); toast.success("Deleted."); load() }
    catch (err: any) { toast.error(err.response?.data?.message || "Cannot delete.") }
  }

  const addDetail = () => {
    if (!detailKey.trim()) return
    setForm({
      ...form,
      account_details: {...form.account_details, [detailKey]: detailValue}
    })
    setDetailKey(""); setDetailValue("")
  }

  const removeDetail = (key: string) => {
    const newDetails = {...form.account_details}
    delete newDetails[key]
    setForm({...form, account_details: newDetails})
  }

  return (
    <AdminLayout title="Payment Methods">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{methods.length} payment methods</p>
        <button onClick={openCreate}
          className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Method
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {methods.map((m, i) => (
          <div key={m.id}
            className={`flex items-center justify-between px-5 py-3.5 group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-medium">{m.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{m.type}</span>
                {!m.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground/60">Inactive</span>
                )}
              </div>
              {m.instructions && (
                <p className="text-muted-foreground/60 text-xs mt-1 line-clamp-1">{m.instructions}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(m)}
                className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(m.id, m.name)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.name}` : "New Payment Method"} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Method Name" required>
            <AdminInput value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Bank Transfer, PayPal" required />
          </Field>

          <Field label="Payment Type" required>
            <AdminSelect value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="bank">Bank Transfer</option>
              <option value="mobile_wallet">Mobile Wallet</option>
              <option value="card">Credit/Debit Card</option>
              <option value="crypto">Cryptocurrency</option>
            </AdminSelect>
          </Field>

          <Field label="Instructions">
            <AdminTextarea value={form.instructions}
              onChange={e => setForm({...form, instructions: e.target.value})}
              rows={3} placeholder="Payment instructions for customers" />
          </Field>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Account Details</label>
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <AdminInput value={detailKey} onChange={e => setDetailKey(e.target.value)}
                  placeholder="Key (e.g. bank_name)" />
                <AdminInput value={detailValue} onChange={e => setDetailValue(e.target.value)}
                  placeholder="Value" />
                <button type="button" onClick={addDetail}
                  className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {Object.entries(form.account_details).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(form.account_details).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded text-sm">
                    <div>
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-muted-foreground">: {String(v)}</span>
                    </div>
                    <button type="button" onClick={() => removeDetail(k)}
                      className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order">
              <AdminInput type="number" min="1" value={form.sort_order}
                onChange={e => setForm({...form, sort_order: e.target.value})} />
            </Field>
          </div>

          <AdminToggle checked={form.is_active} onChange={v => setForm({...form, is_active: v})}
            label="Active (available for checkout)" />

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={editing ? "Update Method" : "Create Method"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
