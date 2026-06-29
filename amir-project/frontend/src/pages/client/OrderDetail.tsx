import { useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ordersApi } from "@/api/orders"
import api from "@/api/client"
import PageLoader from "@/components/shared/PageLoader"
import { ArrowLeft, Upload, X, FileText, Image as ImageIcon, Download, AlertCircle } from "lucide-react"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import toast from "react-hot-toast"
import { DOCUMENT_UPLOAD_TYPES, splitValidFiles } from "@/utils/fileValidation"
import { assetUrl } from "@/utils/assets"

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadOrder = () => {
    if (id) {
      ordersApi.get(Number(id))
        .then((r) => {
          setOrder(r.data.data)
          ordersApi.files(Number(id))
            .then((fr) => setFiles(fr.data.data ?? []))
            .catch(() => {})
        })
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { loadOrder() }, [id])

  const uploadFiles = async () => {
    if (!id || pendingFiles.length === 0) return
    setUploading(true)
    let uploaded = 0
    let failed = 0
    const failedFiles: File[] = []
    try {
      for (const [index, file] of pendingFiles.entries()) {
        const fd = new FormData()
        fd.append('file', file)
        try {
          setUploadProgress(`Uploading ${file.name} (${index + 1} of ${pendingFiles.length})...`)
          await api.post(`/client/orders/${id}/files`, fd, {
            onUploadProgress: (event) => {
              if (!event.total) return
              setUploadProgress(`Uploading ${file.name} (${Math.round((event.loaded * 100) / event.total)}%)`)
            },
          })
          uploaded++
        } catch (err) {
          failed++
          failedFiles.push(file)
          console.error(`[Order file upload failed: ${file.name}]`, err)
        }
      }
      if (uploaded > 0) toast.success(`${uploaded} file(s) uploaded`)
      if (failed > 0) toast.error(`${failed} file(s) failed to upload`)
      setPendingFiles(failedFiles)
      loadOrder()
    } finally {
      setUploading(false)
      setUploadProgress("")
    }
  }

  const statusColor = {
    pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    need_info: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  } as Record<string, string>

  if (loading) return <div className="pt-24"><PageLoader /></div>
  if (!order) return <div className="pt-24 text-center text-muted-foreground">Order not found.</div>

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <ClientPageHeader
          title={order.order_number}
          description={order.package?.name || "Order details"}
          action={<Link to="/dashboard/orders" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"><ArrowLeft className="h-4 w-4" /> Orders</Link>}
        />

        {order.status === 'need_info' && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-200 text-sm">Action Required</p>
              <p className="text-orange-800 dark:text-orange-300 text-xs mt-1">Please upload the requested project files or information below to continue.</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
          <div className="flex justify-between items-start pb-6 border-b border-border">
            <div>
              <h1 className="font-heading font-bold text-xl">{order.order_number}</h1>
              <p className="text-muted-foreground text-sm">{order.package?.name}</p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColor[order.status] || statusColor.pending_approval}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">${order.total_price}</dd></div>
            <div><dt className="text-muted-foreground">Date</dt><dd>{new Date(order.created_at).toLocaleDateString()}</dd></div>
            {order.project_description && <div className="col-span-2"><dt className="text-muted-foreground mb-1">Project Description</dt><dd className="bg-muted/50 rounded-lg p-3 text-sm">{order.project_description}</dd></div>}
          </dl>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-sm mb-4">Project Files</h3>
            {files.length > 0 ? (
              <div className="space-y-2 mb-4">
                {files.map((f: any) => {
                  const isImage = f.mime_type?.startsWith('image/')
                  return (
                    <a key={f.id} href={assetUrl('/storage/' + f.file_path)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                      {isImage ? <ImageIcon className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-primary shrink-0" />}
                      <span className="flex-1 text-sm font-medium group-hover:underline truncate">{f.original_name}</span>
                      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No files uploaded yet.</p>
            )}

            {(order.status === 'need_info' || pendingFiles.length > 0) && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div>
                  <input ref={fileInputRef} type="file" multiple className="hidden"
                    onChange={(e) => {
                      const { accepted, rejected } = splitValidFiles(Array.from(e.target.files ?? []), DOCUMENT_UPLOAD_TYPES)
                      rejected.forEach((message) => toast.error(message))
                      if (accepted.length) setPendingFiles(prev => [...prev, ...accepted])
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    Add Files
                  </button>
                </div>

                {pendingFiles.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {pendingFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="flex-1 text-sm font-medium text-primary truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                            className="text-primary/50 hover:text-primary transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={uploadFiles}
                      disabled={uploading}
                      className="w-full gradient-brand text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-all"
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                    {uploadProgress && <p className="text-center text-xs font-medium text-primary">{uploadProgress}</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
