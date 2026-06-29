import { useEffect, useState } from "react"
import { Plus, ExternalLink, Send, CheckCircle2, Clock, FileText, Eye, Loader2 } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import EmailModal from "@/components/admin/EmailModal"
import { Field, AdminInput, AdminSelect, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

const STATUS_COLORS: Record<string, string> = {
  draft:  "bg-muted text-muted-foreground",
  sent:   "bg-blue-500/15 text-blue-400",
  paid:   "bg-green-500/15 text-green-400",
  overdue:"bg-red-500/15 text-red-400",
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [action, setAction] = useState<"create" | "view">("view")
  const [saving, setSaving] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState<any>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  // Create form state
  const [form, setForm] = useState({
    order_id: "",
    due_date: "",
    tax_rate: "0",
    notes: "",
    status: "draft",
    line_items: [{ description: "", quantity: 1, unit_price: "" }],
  })

  const load = () => {
    api.get("/admin/invoices")
      .then(r => setInvoices(r.data.data ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get("/admin/orders?per_page=100").then(r => setOrders(r.data.data ?? [])).catch(() => {})
  }, [])

  const openCreate = () => {
    setAction("create")
    setForm({
      order_id: "", due_date: "", tax_rate: "0", notes: "", status: "draft",
      line_items: [{ description: "", quantity: 1, unit_price: "" }],
    })
    setModal(true)
  }

  const openView = (inv: any) => {
    setSelectedInvoice(inv)
    setAction("view")
    setModal(true)
  }

  const addLineItem = () => {
    setForm({ ...form, line_items: [...form.line_items, { description: "", quantity: 1, unit_price: "" }] })
  }

  const removeLineItem = (idx: number) => {
    setForm({ ...form, line_items: form.line_items.filter((_, i) => i !== idx) })
  }

  const updateLineItem = (idx: number, key: string, value: any) => {
    const updated = form.line_items.map((item, i) => i === idx ? { ...item, [key]: value } : item)
    setForm({ ...form, line_items: updated })
  }

  const subtotal = form.line_items.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price || "0") * (item.quantity || 1))
  }, 0)
  const tax = subtotal * (parseFloat(form.tax_rate || "0") / 100)
  const total = subtotal + tax

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    // order_id is optional — standalone invoices are allowed
    setSaving(true)
    try {
      await api.post("/admin/invoices", {
        order_id: form.order_id ? parseInt(form.order_id) : null,
        due_date: form.due_date,
        tax_rate: parseFloat(form.tax_rate),
        notes: form.notes,
        status: form.status,
        line_items: form.line_items.map(item => ({
          label: item.description,
          qty: parseInt(String(item.quantity)) || 1,
          unit_price: parseFloat(item.unit_price || "0"),
        })),
      })
      toast.success("Invoice created!")
      setModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create invoice.")
    } finally { setSaving(false) }
  }

  const handleSendClick = (invoice: any) => {
    setSendingInvoice(invoice)
  }

  const handleSend = async (email: string) => {
    if (!sendingInvoice) return
    setSendingId(sendingInvoice.id)
    try {
      const res = await api.post(`/admin/invoices/${sendingInvoice.id}/send`, { email })
      toast.success(res.data.message || "Invoice sent!")
      setSendingInvoice(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invoice.")
    } finally {
      setSendingId(null)
    }
  }

  const handleMarkPaid = async (invoiceId: number) => {
    try {
      await api.post(`/admin/invoices/${invoiceId}/mark-paid`)
      toast.success("Invoice marked as paid!")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update invoice.")
    }
  }

  const handleViewInvoice = async (invoiceId: number) => {
    setDownloadingId(invoiceId)
    try {
      const res = await api.get(`/admin/invoices/${invoiceId}/download`, { responseType: "blob" })
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/html" }))
      const tab = window.open(url, "_blank")
      // Revoke after tab has loaded
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      if (!tab) toast.error("Allow pop-ups to view the invoice.")
    } catch {
      toast.error("Failed to load invoice.")
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return (
    <AdminLayout title="Invoices">
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Invoices">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground text-sm">{invoices.length} invoices</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-green-500/15 text-green-400">
              {invoices.filter(i => i.status === "paid").length} paid
            </span>
            <span className="px-2 py-1 rounded bg-blue-500/15 text-blue-400">
              {invoices.filter(i => i.status === "sent").length} sent
            </span>
            <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
              {invoices.filter(i => i.status === "draft").length} draft
            </span>
          </div>
        </div>
        <button onClick={openCreate}
          className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">No invoices yet. Create one from an existing order.</p>
          <button onClick={openCreate}
            className="mt-4 gradient-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {invoices.map((inv, i) => (
            <div key={inv.id}
              className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="col-span-2">
                <p className="text-foreground text-sm font-mono font-semibold">{inv.invoice_number}</p>
                <p className="text-muted-foreground text-xs">Order #{inv.order_id}</p>
              </div>
              <div className="col-span-3">
                <p className="text-foreground text-sm">{inv.user?.name || "—"}</p>
                <p className="text-muted-foreground text-xs truncate">{inv.user?.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-foreground font-semibold">${Number(inv.total || 0).toLocaleString()}</p>
                {inv.tax_amount > 0 && (
                  <p className="text-muted-foreground text-xs">+${Number(inv.tax_amount).toFixed(2)} tax</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-sm">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="col-span-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
                  {inv.status}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openView(inv)} title="View"
                  className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleViewInvoice(inv.id)} disabled={downloadingId === inv.id} title="View / Save as PDF"
                  className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  {downloadingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                </button>
                {inv.status === "draft" && (
                  <button onClick={() => handleSendClick(inv)} disabled={sendingId === inv.id} title="Send to client"
                    className="p-1.5 rounded hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 transition-colors disabled:opacity-50">
                    {sendingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                )}
                {inv.status === "sent" && (
                  <button onClick={() => handleMarkPaid(inv.id)} title="Mark as paid"
                    className="p-1.5 rounded hover:bg-green-500/20 text-muted-foreground hover:text-green-400 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AdminModal open={modal} onClose={() => setModal(false)}
        title={action === "create" ? "New Invoice" : `Invoice ${selectedInvoice?.invoice_number}`}
        size="lg">

        {action === "view" && selectedInvoice ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Invoice Number</p>
                <p className="text-foreground font-mono font-semibold">{selectedInvoice.invoice_number}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selectedInvoice.status] || ""}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Client</p>
                <p className="text-foreground text-sm">{selectedInvoice.user?.name}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Total Amount</p>
                <p className="text-foreground font-bold text-lg">${Number(selectedInvoice.total || 0).toLocaleString()}</p>
              </div>
            </div>

            {selectedInvoice.line_items?.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Line Items</p>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {selectedInvoice.line_items.map((item: any, i: number) => (
                    <div key={i} className={`flex justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="text-muted-foreground">{item.label ?? item.description} x {item.qty ?? item.quantity}</span>
                      <span className="text-foreground font-medium">${Number(item.total ?? ((item.qty ?? item.quantity ?? 1) * (item.unit_price ?? 0))).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border px-4 py-3 flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">${Number(selectedInvoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-border">
              <button onClick={() => handleViewInvoice(selectedInvoice.id)}
                disabled={downloadingId === selectedInvoice.id}
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 transition-colors">
                {downloadingId === selectedInvoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} View / Save PDF
              </button>
              {selectedInvoice.status === "draft" && (
                <button onClick={() => { handleSendClick(selectedInvoice); setModal(false) }}
                  disabled={sendingId === selectedInvoice.id}
                  className="flex-1 gradient-brand text-white px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all">
                  {sendingId === selectedInvoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to Client
                </button>
              )}
              {selectedInvoice.status === "sent" && (
                <button onClick={() => { handleMarkPaid(selectedInvoice.id); setModal(false) }}
                  className="flex-1 gradient-brand text-white px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all">
                  <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Linked Order (optional)">
                <select
                  value={form.order_id}
                  onChange={e => setForm({ ...form, order_id: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">— Standalone invoice (no order) —</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.order_number} — {o.user?.name ?? 'Unknown'} ({o.package?.name ?? 'Custom'})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Due Date">
                <AdminInput type="date" value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </Field>
              <Field label="Tax Rate (%)">
                <AdminInput type="number" min="0" max="100" step="0.5" value={form.tax_rate}
                  onChange={e => setForm({ ...form, tax_rate: e.target.value })} placeholder="0" />
              </Field>
              <Field label="Status">
                <AdminSelect value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </AdminSelect>
              </Field>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Line Items</label>
                <button type="button" onClick={addLineItem}
                  className="text-xs text-primary hover:underline">+ Add Item</button>
              </div>
              <div className="space-y-2">
                {form.line_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <AdminInput value={item.description}
                        onChange={e => updateLineItem(idx, "description", e.target.value)}
                        placeholder="Description" />
                    </div>
                    <div className="col-span-2">
                      <AdminInput type="number" min="1" value={item.quantity}
                        onChange={e => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        placeholder="Qty" />
                    </div>
                    <div className="col-span-3">
                      <AdminInput type="number" min="0" step="0.01" value={item.unit_price}
                        onChange={e => updateLineItem(idx, "unit_price", e.target.value)}
                        placeholder="Price" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {form.line_items.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(idx)}
                          className="text-red-400/60 hover:text-red-400 text-lg leading-none">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-muted/30 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {parseFloat(form.tax_rate) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({form.tax_rate}%)</span><span>${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-2">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => setModal(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
                Cancel
              </button>
              <SaveBtn loading={saving} label="Create Invoice" />
            </div>
          </form>
        )}
      </AdminModal>
      <EmailModal
        isOpen={Boolean(sendingInvoice)}
        title={`Send ${sendingInvoice?.invoice_number || "invoice"}`}
        message="The client will receive the branded invoice email."
        defaultEmail={sendingInvoice?.user?.email || ""}
        loading={Boolean(sendingId)}
        onClose={() => !sendingId && setSendingInvoice(null)}
        onSend={handleSend}
      />
    </AdminLayout>
  )
}
