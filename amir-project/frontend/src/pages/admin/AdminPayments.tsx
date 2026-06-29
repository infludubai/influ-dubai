import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react"
import { assetUrl } from "@/utils/assets"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminTextarea, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any|null>(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [action, setAction] = useState<"verify" | "reject">("verify")

  const load = () => {
    api.get("/admin/payments").then(r => {
      setPayments(r.data.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openModal = (payment: any, actionType: "verify" | "reject") => {
    setSelectedPayment(payment)
    setAction(actionType)
    setNotes("")
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return
    setSaving(true)
    try {
      await api.post(`/admin/payments/${selectedPayment.id}/${action}`, { reason: notes })
      toast.success(`Payment ${action}d!`)
      setModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update payment.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout title="Payments"><div className="text-muted-foreground">Loading...</div></AdminLayout>

  const pendingPayments = payments.filter(p => p.status === "pending")
  const verifiedPayments = payments.filter(p => p.status === "verified")
  const rejectedPayments = payments.filter(p => p.status === "rejected")

  const PaymentGroup = ({ label, items, icon: Icon }: any) => (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No payments</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {items.map((p: any, i: number) => (
            <div key={p.id} className={`p-5 group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Order / Customer</p>
                  <p className="text-foreground font-medium">Order #{p.order_id}</p>
                  <p className="text-muted-foreground text-sm">{p.user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Amount & Method</p>
                  <p className="text-foreground font-semibold">${p.amount.toLocaleString()}</p>
                  <p className="text-muted-foreground text-sm">{p.payment_method?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Transaction ID</p>
                  <p className="text-muted-foreground text-sm font-mono">{p.transaction_id || "—"}</p>
                </div>
              </div>

              {p.screenshot_path && (
                <div className="mb-3 pb-3 border-t border-border pt-3 space-y-2">
                  <a
                    href={assetUrl('/storage/' + p.screenshot_path.replace(/^.*?public[/\\]/, '').replace(/^storage[/\\]/, ''))}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Eye className="w-3 h-3" /> View Screenshot
                  </a>
                  {/* Inline preview */}
                  <div>
                    <img
                      src={assetUrl('/storage/' + p.screenshot_path.replace(/^.*?public[/\\]/, '').replace(/^storage[/\\]/, ''))}
                      alt="Payment screenshot"
                      className="max-h-48 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(assetUrl('/storage/' + p.screenshot_path.replace(/^.*?public[/\\]/, '').replace(/^storage[/\\]/, '')), '_blank')}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                </div>
              )}

              {p.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <button onClick={() => openModal(p, "reject")}
                    className="px-3 py-1.5 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                  <button onClick={() => openModal(p, "verify")}
                    className="px-3 py-1.5 rounded text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verify
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <AdminLayout title="Payments">
      <PaymentGroup label="Pending Review" items={pendingPayments} icon={Clock} />
      <PaymentGroup label="Verified" items={verifiedPayments} icon={CheckCircle2} />
      <PaymentGroup label="Rejected" items={rejectedPayments} icon={XCircle} />

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={`${action === "verify" ? "Verify" : "Reject"} Payment`} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground text-xs mb-1">Order #{selectedPayment?.order_id}</p>
            <p className="text-foreground font-semibold text-lg">${selectedPayment?.amount.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm mt-1">{selectedPayment?.payment_method?.name}</p>
          </div>

          <Field label="Admin Notes">
            <AdminTextarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={4} placeholder="Add notes about this payment..." />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={action === "verify" ? "Verify Payment" : "Reject Payment"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
