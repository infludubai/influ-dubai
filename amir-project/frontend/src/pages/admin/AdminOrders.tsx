import AdminLayout from "@/components/admin/AdminLayout"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "@/api/client"

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => { api.get("/admin/orders").then((r) => setOrders(r.data.data ?? [])) }, [])
  return (
    <AdminLayout title="Orders">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">{["Order#","Client","Package","Total","Status",""].map((h) => <th key={h} className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">{o.order_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.user?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.package?.name}</td>
                <td className="px-4 py-3 text-foreground">${o.total_price}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">{o.status?.replace("_"," ")}</span></td>
                <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="text-primary text-xs hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
