import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Receipt, ExternalLink, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import api from "@/api/client"
import toast from "react-hot-toast"
import PageLoader from "@/components/shared/PageLoader"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import { fadeUp, staggerContainer } from "@/utils/motion"

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft:   { color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",  icon: Clock },
  sent:    { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",    icon: Receipt },
  paid:    { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  overdue: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",      icon: AlertCircle },
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState<number | null>(null)

  useEffect(() => {
    api.get("/client/invoices").then((r) => setInvoices(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="pt-24"><PageLoader /></div>

  const handleViewInvoice = async (invoiceId: number) => {
    setOpeningId(invoiceId)
    try {
      const res = await api.get(`/client/invoices/${invoiceId}/download`, { responseType: "blob" })
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/html" }))
      const tab = window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      if (!tab) toast.error("Allow pop-ups to view the invoice.")
    } catch {
      toast.error("Failed to load invoice.")
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <ClientPageHeader title="Invoices" description="View payment records and download invoice PDFs." />
        </motion.div>

        {invoices.length === 0 ? (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-card rounded-2xl border border-border p-16 text-center shadow-sm">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invoices will appear here after your order is confirmed.</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {invoices.map((inv, i) => {
              const cfg = statusConfig[inv.status] || statusConfig.draft
              const Icon = cfg.icon
              return (
                <motion.div key={inv.id} variants={fadeUp} custom={i}
                  className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{inv.invoice_number}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        <span className="font-medium text-foreground">${Number(inv.total).toFixed(2)}</span>
                        {inv.due_date && <span className="ml-2 text-xs">· Due {new Date(inv.due_date).toLocaleDateString()}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{inv.status}
                    </span>
                    <button
                      onClick={() => handleViewInvoice(inv.id)}
                      disabled={openingId === inv.id}
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity disabled:opacity-50">
                      {openingId === inv.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ExternalLink className="w-4 h-4" />}
                      View PDF
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
