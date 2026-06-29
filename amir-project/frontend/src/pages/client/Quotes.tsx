import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react"
import api from "@/api/client"
import PageLoader from "@/components/shared/PageLoader"
import { Link } from "react-router-dom"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import { fadeUp, staggerContainer } from "@/utils/motion"

const statusConfig: Record<string, { color: string; icon: any }> = {
  pending:  { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",   icon: Clock },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",       icon: XCircle },
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get("/client/quotes").then((r) => setQuotes(r.data.data ?? [])).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="pt-24"><PageLoader /></div>
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <ClientPageHeader
            title="Custom Quotes"
            description="Review your custom quote requests and request new work."
            action={<Link to="/contact" className="rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">Request Quote</Link>}
          />
        </motion.div>

        {quotes.length === 0 ? (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-card rounded-2xl border border-border p-16 text-center shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No quotes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Request a custom quote for any project.</p>
            <Link to="/contact" className="mt-4 inline-block gradient-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Request a Quote
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {quotes.map((q, i) => {
              const cfg = statusConfig[q.status] || statusConfig.pending
              const Icon = cfg.icon
              return (
                <motion.div key={q.id} variants={fadeUp} custom={i}
                  className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-semibold text-sm">{q.service_type || "Custom Quote"}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{q.status}
                    </span>
                  </div>
                  {q.message && <p className="text-muted-foreground text-sm mt-2 ml-13 line-clamp-2">{q.message}</p>}
                  {q.quoted_price && (
                    <p className="text-sm font-semibold text-primary mt-2">Quoted: ${Number(q.quoted_price).toLocaleString()}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(q.created_at).toLocaleDateString()}</p>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
