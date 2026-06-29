import { useEffect, useState } from "react"
import { Send, Eye } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminTextarea, AdminSelect, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<any|null>(null)
  const [quoteForm, setQuoteForm] = useState({ status: "quoted", quoted_price: "", message: "" })
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get("/admin/quotes").then(r => {
      setQuotes(r.data.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openQuoteModal = (quote: any) => {
    setSelectedQuote(quote)
    setQuoteForm({
      status: quote.status || "quoted",
      quoted_price: quote.quoted_price ? String(quote.quoted_price) : "",
      message: ""
    })
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote) return
    setSaving(true)
    try {
      await api.put(`/admin/quotes/${selectedQuote.id}`, {
        status: quoteForm.status,
        quoted_price: quoteForm.quoted_price ? parseFloat(quoteForm.quoted_price) : null,
        admin_message: quoteForm.message
      })
      toast.success("Quote updated and sent!")
      setModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update quote.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout title="Custom Quotes"><div className="text-muted-foreground">Loading...</div></AdminLayout>

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/15 text-blue-400",
      reviewing: "bg-yellow-500/15 text-yellow-400",
      quoted: "bg-purple-500/15 text-purple-400",
      accepted: "bg-green-500/15 text-green-400",
      rejected: "bg-red-500/15 text-red-400",
    }
    return colors[status] || "bg-muted text-muted-foreground"
  }

  return (
    <AdminLayout title="Custom Quotes">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{quotes.length} quote requests</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {quotes.map((quote, i) => (
          <div key={quote.id}
            className={`p-5 group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-foreground text-sm font-medium mb-1">{quote.name}</p>
                <p className="text-muted-foreground text-xs mb-2">{quote.email}</p>
                <p className="text-muted-foreground text-xs">{quote.company}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(quote.status)}`}>
                  {quote.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Service Type</p>
                <p className="text-foreground text-sm">{quote.service_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Budget Range</p>
                <p className="text-foreground text-sm">${quote.budget_range}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Deadline</p>
                <p className="text-foreground text-sm">{quote.deadline ? new Date(quote.deadline).toLocaleDateString() : "—"}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-muted-foreground text-xs mb-1">Description</p>
              <p className="text-muted-foreground text-sm line-clamp-2">{quote.description}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => openQuoteModal(quote)}
                className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 transition-colors">
                <Send className="w-4 h-4" /> Send Quote
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={`Quote for ${selectedQuote?.name}`} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Status">
            <AdminSelect value={quoteForm.status} onChange={e => setQuoteForm({...quoteForm, status: e.target.value})}>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="quoted">Quoted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </AdminSelect>
          </Field>

          <Field label="Quoted Price ($)">
            <AdminInput type="number" min="0" step="0.01"
              value={quoteForm.quoted_price} onChange={e => setQuoteForm({...quoteForm, quoted_price: e.target.value})}
              placeholder="0.00" />
          </Field>

          <Field label="Message to Client">
            <AdminTextarea value={quoteForm.message} onChange={e => setQuoteForm({...quoteForm, message: e.target.value})}
              rows={4} placeholder="Add any notes or details about this quote..." />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label="Send Quote" />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
