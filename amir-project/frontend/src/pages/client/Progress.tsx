import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, Clock, Loader2, Upload, X } from "lucide-react"
import api from "@/api/client"
import { assetUrl } from "@/utils/assets"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import toast from "react-hot-toast"

const STATUS_STEPS = [
  { key: "pending",          label: "Order Received",  desc: "Your order has been received and is under review." },
  { key: "payment_verified", label: "Payment Verified", desc: "Your payment has been confirmed." },
  { key: "in_progress",      label: "In Progress",     desc: "Work has started on your project." },
  { key: "review",           label: "Under Review",    desc: "Your project is being reviewed before delivery." },
  { key: "delivered",        label: "Delivered",       desc: "Your project has been delivered. Please review and confirm." },
  { key: "completed",        label: "Completed",       desc: "Project completed successfully!" },
]

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    pending: 0, payment_review: 0, pending_approval: 0,
    payment_verified: 1, approved: 1,
    in_progress: 2,
    need_info: 2,   // shows at same position but with warning overlay
    review: 3,
    delivered: 4,
    completed: 5,
  }
  return map[status] ?? 0
}

function ProgressBar({ current }: { current: number }) {
  const pct = Math.min((current / (STATUS_STEPS.length - 1)) * 100, 100)
  return (
    <div className="relative h-2 bg-muted rounded-full mb-8">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute left-0 top-0 h-full gradient-brand rounded-full"
      />
    </div>
  )
}

export default function Progress() {
  const [orders, setOrders] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get("/client/orders")
      .then(r => {
        const list = r.data.data ?? []
        setOrders(list)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const currentStep = selected ? getStepIndex(selected.status) : 0
  const isNeedInfo = selected?.status === "need_info"

  const uploadInfoFiles = async () => {
    if (!selected || uploadFiles.length === 0) return
    setUploading(true)
    let ok = 0
    for (const file of uploadFiles) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        await api.post(`/client/orders/${selected.id}/files`, fd)
        ok++
      } catch { /* silent */ }
    }
    setUploading(false)
    setUploadFiles([])
    if (ok > 0) toast.success(`${ok} file${ok > 1 ? 's' : ''} uploaded successfully!`)
    else toast.error("Upload failed. Please try again.")
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <ClientPageHeader title="Project Progress" description="Track the status of your active projects." />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">No orders yet. Start by ordering a service.</p>
            <Link to="/pricing" className="gradient-brand text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order selector */}
            {orders.length > 1 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-sm font-medium mb-3">Select Order</p>
                <div className="space-y-2">
                  {orders.map(order => (
                    <button key={order.id} onClick={() => setSelected(order)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${selected?.id === order.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/30"}`}>
                      <span>Order #{order.order_number}</span>
                      {order.status === "need_info" && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Action Needed
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress tracker */}
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden">

                {/* ── NEED INFO ALERT ── */}
                {isNeedInfo && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40 p-5">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">Action Required — Amir Needs Your Help</p>
                        <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                          {selected.notes || "Please upload the requested files or information to continue your project."}
                        </p>

                        {/* File upload */}
                        <div className="space-y-3">
                          {uploadFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {uploadFiles.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1 text-xs text-amber-800 dark:text-amber-300 font-medium">
                                  <span className="max-w-[120px] truncate">{f.name}</span>
                                  <button onClick={() => setUploadFiles(p => p.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              {uploadFiles.length > 0 ? `${uploadFiles.length} file(s) selected` : "Select Files to Upload"}
                            </button>
                            <input ref={fileInputRef} type="file" multiple className="hidden"
                              onChange={e => { setUploadFiles(p => [...p, ...Array.from(e.target.files ?? [])]); e.target.value = "" }} />
                            {uploadFiles.length > 0 && (
                              <button
                                onClick={uploadInfoFiles}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
                              >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? "Uploading…" : "Upload Now"}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-amber-600">
                            Or send files/info via{" "}
                            <Link to="/dashboard/messages" className="underline font-medium hover:text-amber-800">Messages</Link>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="gradient-brand p-6 text-white">
                  <p className="text-white/70 text-sm mb-1">Order #{selected.order_number}</p>
                  <h2 className="font-heading font-bold text-xl">{selected.package?.name || "Custom Order"}</h2>
                  <p className="text-white/80 text-sm mt-1">Total: ${Number(selected.total_price || 0).toLocaleString()}</p>
                </div>

                <div className="p-6">
                  <ProgressBar current={currentStep} />

                  <div className="space-y-4">
                    {STATUS_STEPS.map((step, idx) => {
                      const done = idx < currentStep
                      const active = idx === currentStep
                      return (
                        <div key={step.key}
                          className={`flex items-start gap-4 p-4 rounded-xl transition-all ${active ? "bg-primary/5 border border-primary/15" : done ? "opacity-80" : "opacity-40"}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {done ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : active && isNeedInfo ? <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                              : active ? <Clock className="w-5 h-5 text-primary animate-pulse" />
                              : <Circle className="w-5 h-5 text-slate-200" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${done ? "text-green-700" : active ? (isNeedInfo ? "text-amber-600" : "text-primary") : "text-muted-foreground"}`}>
                              {step.label}
                              {active && isNeedInfo && <span className="ml-2 text-xs text-amber-600 font-normal">(waiting for your files)</span>}
                            </p>
                            {(done || active) && (
                              <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                            )}
                          </div>
                          {(done || active) && (
                            <span className={`text-xs px-2 py-1 rounded-full ${done ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : isNeedInfo ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-primary/10 text-primary"}`}>
                              {done ? "Done" : isNeedInfo ? "Needs Files" : "Active"}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {selected.notes && !isNeedInfo && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes from Amir</p>
                      <p className="text-sm text-foreground">{selected.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
