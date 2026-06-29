import AdminLayout from "@/components/admin/AdminLayout"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "@/api/client"
import PageLoader from "@/components/shared/PageLoader"
import toast from "react-hot-toast"

const STATUSES = ["pending_approval","payment_review","approved","in_progress","need_info","completed","rejected","cancelled"]

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  useEffect(() => {
    if(id) api.get(`/admin/orders/${id}`).then((r) => { setOrder(r.data.data); setStatus(r.data.data.status) }).finally(() => setLoading(false))
  }, [id])
  const updateStatus = async () => {
    try {
      await api.put(`/admin/orders/${id}`, { status })
      toast.success("Status updated")
      navigate("/admin/orders")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status")
    }
  }
  if (loading) return <AdminLayout title="Order"><PageLoader /></AdminLayout>
  return (
    <AdminLayout title={`Order ${order?.order_number}`}>
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Order Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Package</dt><dd className="text-foreground mt-0.5">{order.package?.name}</dd></div>
            <div><dt className="text-muted-foreground">Total</dt><dd className="text-foreground mt-0.5">${order.total_price}</dd></div>
            <div><dt className="text-muted-foreground">Client</dt><dd className="text-foreground mt-0.5">{order.user?.name}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd className="text-foreground mt-0.5">{order.user?.email}</dd></div>
            {order.project_description && <div className="col-span-2"><dt className="text-muted-foreground mb-1">Description</dt><dd className="bg-muted/50 rounded-lg p-3 text-foreground/80">{order.project_description}</dd></div>}
          </dl>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Update Status</h2>
          <div className="flex gap-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 h-10 px-3 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>
            <button onClick={updateStatus} className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold">Update</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
