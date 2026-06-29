import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ordersApi } from "@/api/orders"
import PageLoader from "@/components/shared/PageLoader"
import { ShoppingBag, ArrowRight, Clock } from "lucide-react"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import { fadeUp, staggerContainer } from "@/utils/motion"

const statusColors: Record<string,string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  need_info:        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  approved:         "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  in_progress:      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed:        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected:         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled:        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { ordersApi.list().then((r) => setOrders(r.data.data ?? [])).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="pt-24"><PageLoader /></div>
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <ClientPageHeader title="Orders" description="Track every project order and open full project details." />
        </motion.div>

        {orders.length === 0 ? (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-card rounded-2xl border border-border p-16 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Link to="/pricing" className="gradient-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">Browse Packages</Link>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
            {orders.map((o, i) => (
              <motion.div key={o.id} variants={fadeUp} custom={i}
                className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between hover:border-primary/20 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{o.order_number}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {o.status.replace(/_/g," ")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{o.package?.name} · <span className="font-medium text-foreground">${Number(o.total_price).toLocaleString()}</span></p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link to={`/dashboard/orders/${o.id}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                  View <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
