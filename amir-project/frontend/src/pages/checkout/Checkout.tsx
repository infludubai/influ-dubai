import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Package, Plus, FileText, CreditCard, PartyPopper, Scan, Loader2, X } from 'lucide-react'
import { packagesApi } from '@/api/packages'
import { checkoutApi } from '@/api/orders'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { DOCUMENT_UPLOAD_TYPES, IMAGE_UPLOAD_TYPES, fileValidationError, formatFileSize, splitValidFiles } from '@/utils/fileValidation'

const STEPS = [
  { id: 1, label: 'Package', icon: Package },
  { id: 2, label: 'Add-ons', icon: Plus },
  { id: 3, label: 'Project Info', icon: FileText },
  { id: 4, label: 'Payment', icon: CreditCard },
]

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { step, setStep, package: pkg, setPackage, addons, toggleAddon,
          projectInfo, setProjectInfo, paymentMethodId, setPaymentMethod,
          transactionId, setTransactionId, total, clear } = useCartStore()

  const [packages, setPackages] = useState<any[]>([])
  const [availAddons, setAvailAddons] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [form, setForm] = useState({ company_name: user?.company_name || '', website_type: '', project_description: '', business_industry: '', existing_url: '' })
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractTransactionId = async (file: File) => {
    setExtracting(true)
    try {
      const fd = new FormData()
      fd.append('screenshot', file)
      const res = await api.post('/checkout/extract-transaction', fd)
      const tid = res.data?.transaction_id
      if (tid) {
        setTransactionId(tid)
        toast.success(`Transaction ID extracted: ${tid}`)
      }
    } catch { /* silent — user can type manually */ } finally {
      setExtracting(false)
    }
  }

  useEffect(() => {
    // Pre-fill form with user's onboarding data
    if (user?.company_name) {
      setForm(f => ({ ...f, company_name: user.company_name || '' }))
    }
    packagesApi.list().then((r) => setPackages(r.data.data ?? []))
    packagesApi.addons().then((r) => setAvailAddons(r.data.data ?? []))
    packagesApi.paymentMethods().then((r) => setPaymentMethods(r.data.data ?? []))
    const slug = params.get('package')
    if (slug && !pkg) {
      packagesApi.get(slug).then((r) => { if (r.data.data) setPackage(r.data.data) })
    }
  }, [user?.company_name, user?.id])

  const placeOrder = async () => {
    if (!pkg || !paymentMethodId) { toast.error('Please select a package and payment method.'); return }
    if (!transactionId.trim()) { toast.error('Please enter your transaction ID.'); return }
    if (!screenshot) { toast.error('Please upload your payment screenshot.'); return }
    setLoading(true)
    try {
      // Ensure existing_url has a protocol prefix
      let existingUrl = form.existing_url.trim()
      if (existingUrl && !existingUrl.match(/^https?:\/\//)) {
        existingUrl = 'https://' + existingUrl
      }
      const payload = {
        package_id: pkg.id,
        addon_ids: addons.map((a) => a.id),
        ...form,
        existing_url: existingUrl || null,
        project_description: form.project_description || 'N/A',
        payment_method_id: paymentMethodId,
        transaction_id: transactionId || null,
      }
      const res = await checkoutApi.place(payload)
      const newOrderId = res.data.order.id
      setOrderId(newOrderId)
      if (screenshot) {
        try {
          setUploadProgress("Uploading payment screenshot...")
          await checkoutApi.uploadScreenshot(newOrderId, screenshot)
        } catch (err) {
          console.error("[Payment screenshot upload failed]", err)
          toast.error("Order was created, but payment screenshot upload failed. Please contact support.")
        }
      }
      // Upload project files
      let uploadSuccess = 0
      let uploadErrors = 0
      for (const [index, file] of projectFiles.entries()) {
        try {
          setUploadProgress(`Uploading ${file.name} (${index + 1} of ${projectFiles.length})...`)
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/client/orders/${newOrderId}/files`, fd, {
            onUploadProgress: (event) => {
              if (!event.total) return
              const pct = Math.round((event.loaded * 100) / event.total)
              setUploadProgress(`Uploading ${file.name} (${pct}%)`)
            },
          })
          uploadSuccess++
        } catch (err) {
          uploadErrors++
          console.error(`[Project file upload failed: ${file.name}]`, err)
        }
      }
      if (uploadErrors > 0) toast.error(`${uploadErrors} file(s) failed to upload. ${uploadSuccess} uploaded.`)
      else if (uploadSuccess > 0) toast.success(`${uploadSuccess} project file(s) uploaded.`)
      setSuccess(true)
      clear()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order.')
    } finally {
      setLoading(false)
      setUploadProgress("")
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        className="bg-card rounded-3xl p-12 text-center max-w-md shadow-xl border border-border">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 gradient-brand rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
          <PartyPopper className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="font-heading font-bold text-2xl mb-2">Order Placed!</h2>
        <p className="text-muted-foreground mb-6">Your order has been received and is pending review. We'll contact you shortly.</p>
        <button onClick={() => navigate('/dashboard/orders')}
          className="gradient-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
          View My Orders
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-2 text-center">Complete Your Order</h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">Follow the steps below to place your order</p>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10 gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium cursor-pointer transition-all ${step === s.id ? 'gradient-brand text-white shadow-md' : step > s.id ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-card border border-border text-muted-foreground'}`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-card rounded-2xl border border-border p-5 sm:p-8 shadow-sm">

            {/* Step 1: Choose Package */}
            {step === 1 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-6">Choose a Package</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.filter((p) => p.price > 0).map((p) => (
                    <div key={p.id} onClick={() => setPackage(p)}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${pkg?.id === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      {p.is_featured && <span className="text-xs text-primary font-semibold mb-2 block">★ Popular</span>}
                      <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
                      <p className="text-muted-foreground text-xs mb-3">{p.short_description}</p>
                      <p className="font-heading font-bold text-xl">${p.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.delivery_days} day delivery</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => pkg ? setStep(2) : toast.error('Please select a package')}
                    className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">
                    Continue to Add-ons →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Add-ons */}
            {step === 2 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-2">Optional Add-ons</h2>
                <p className="text-muted-foreground text-sm mb-6">Enhance your package with additional services</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto pr-2">
                  {availAddons.map((a) => {
                    const selected = addons.some((x) => x.id === a.id)
                    return (
                      <div key={a.id} onClick={() => toggleAddon(a)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{a.name}</p>
                          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{a.description}</p>
                          <p className="text-primary text-sm font-semibold mt-1">${a.price} <span className="text-xs text-muted-foreground font-normal">{a.billing_type}</span></p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Package</span><span>${pkg?.price.toLocaleString()}</span></div>
                  {addons.map((a) => <div key={a.id} className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">+ {a.name}</span><span>${a.price}</span></div>)}
                  <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span>${total().toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="border border-border px-5 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors">← Back</button>
                  <button onClick={() => setStep(3)} className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">Continue →</button>
                </div>
              </div>
            )}

            {/* Step 3: Project Info */}
            {step === 3 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-6">Project Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  {[['company_name','Company Name','Your Company Ltd'],['website_type','Website/Service Type','e.g. Business Website'],['business_industry','Business Industry','e.g. E-Commerce, Healthcare'],['existing_url','Existing Website URL (if any)','https://example.com']].map(([k,l,ph]) => (
                    <div key={k} className="space-y-1.5">
                      <label className="text-sm font-medium">{l}</label>
                      <input value={form[k as keyof typeof form]} onChange={(e) => setForm({...form,[k]:e.target.value})} placeholder={ph}
                        className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60" />
                    </div>
                  ))}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium">Project Description <span className="text-destructive">*</span></label>
                    <textarea required value={form.project_description} onChange={(e) => setForm({...form,project_description:e.target.value})} rows={4}
                      placeholder="Describe your project, goals, and any specific requirements..."
                      className="w-full px-3.5 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/60" />
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Project Files <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                      <span className="text-xs text-muted-foreground font-normal">Upload PDFs, images, designs</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? [])
                          const { accepted, rejected } = splitValidFiles(files, DOCUMENT_UPLOAD_TYPES)
                          rejected.forEach((message) => toast.error(message))
                          if (accepted.length) {
                            setProjectFiles(prev => [...prev, ...accepted])
                            toast.success(`${accepted.length} file(s) ready to upload when you place the order.`)
                          }
                          e.target.value = ''
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-11 px-3.5 rounded-lg border border-input text-sm font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {projectFiles.length > 0 ? `Add More Files (${projectFiles.length} selected)` : 'Add Files'}
                      </button>
                    </div>
                    {projectFiles.length > 0 && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-primary">{projectFiles.length} file(s) selected</p>
                            <p className="text-xs text-muted-foreground">They will upload after payment when you place the order.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProjectFiles([])}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary/70 hover:bg-primary/10 hover:text-primary"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="space-y-2">
                        {projectFiles.map((f, i) => (
                          <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
                            <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate font-medium text-foreground">{f.name}</span>
                            <span className="shrink-0 text-muted-foreground">{formatFileSize(f.size)}</span>
                            <button
                              type="button"
                              onClick={() => setProjectFiles(prev => prev.filter((_, j) => j !== i))}
                              className="text-primary/50 hover:text-primary transition-colors"
                              aria-label={`Remove ${f.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="border border-border px-5 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors">← Back</button>
                  <button onClick={() => { if (!form.project_description.trim()) { toast.error('Please describe your project.'); return } setStep(4) }}
                    className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">Continue →</button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-6">Payment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {paymentMethods.map((m) => (
                    <div key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${paymentMethodId === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-muted-foreground text-xs mt-1">{m.type}</p>
                    </div>
                  ))}
                </div>
                {paymentMethodId && (() => {
                  const m = paymentMethods.find((x) => x.id === paymentMethodId)
                  return m ? (
                    <div className="bg-muted/50 rounded-xl p-5 mb-5">
                      <p className="font-medium text-sm mb-2">Payment Instructions</p>
                      <p className="text-muted-foreground text-sm mb-3">{m.instructions}</p>
                      {m.account_details && Object.entries(m.account_details).map(([k, v]) => (
                        <p key={k} className="text-sm"><strong className="text-foreground">{k.replace(/_/g,' ')}:</strong> {v as string}</p>
                      ))}
                    </div>
                  ) : null
                })()}
                <div className="space-y-4 mb-6">
                  {/* Screenshot upload — first so OCR can auto-fill transaction ID */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Payment Screenshot <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground font-normal ml-1">(JPG, PNG, WebP)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          if (file) {
                            const error = fileValidationError(file, IMAGE_UPLOAD_TYPES, 5 * 1024 * 1024)
                            if (error) {
                              toast.error(error)
                              e.target.value = ''
                              return
                            }
                          }
                          setScreenshot(file)
                          if (file) extractTransactionId(file)
                        }}
                        className="w-full h-11 px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm file:mr-3 file:text-xs file:font-medium file:bg-primary file:text-white file:border-none file:rounded-lg file:px-3 file:py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    {screenshot && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{screenshot.name}</span>
                        {extracting && <span className="ml-auto flex items-center gap-1 text-primary"><Loader2 className="w-3 h-3 animate-spin" /> Reading transaction ID…</span>}
                      </div>
                    )}
                  </div>

                  {/* Transaction ID — auto-filled by OCR, or entered manually */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Transaction ID <span className="text-red-500">*</span>
                      {extracting && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1" />}
                    </label>
                    <div className="relative">
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder={extracting ? 'Extracting from screenshot…' : 'Auto-filled or enter manually'}
                        className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 pr-10"
                      />
                      {transactionId && <CheckCircle2 className="absolute right-3 top-3 w-4.5 h-4.5 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Automatically read from your screenshot. Edit if incorrect.</p>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6">
                  <div className="flex justify-between font-bold text-lg"><span>Order Total</span><span>${total().toLocaleString()}</span></div>
                  <p className="text-muted-foreground text-xs mt-1">Order will be reviewed after payment confirmation</p>
                </div>
                {projectFiles.length > 0 && (
                  <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Project files queued</p>
                      <button onClick={() => setStep(3)} className="text-xs font-semibold text-primary hover:underline">Edit files</button>
                    </div>
                    <div className="space-y-1.5">
                      {projectFiles.slice(0, 3).map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="min-w-0 flex-1 truncate">{file.name}</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                    {projectFiles.length > 3 && <p className="mt-2 text-xs text-muted-foreground">+{projectFiles.length - 3} more file(s)</p>}
                  </div>
                )}
                <div className="flex justify-between">
                  <button onClick={() => setStep(3)} className="border border-border px-5 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors">← Back</button>
                  <button onClick={placeOrder} disabled={loading || !paymentMethodId}
                    className="gradient-brand text-white font-semibold px-7 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</> : '✓ Place Order'}
                  </button>
                </div>
                {uploadProgress && <p className="mt-3 text-right text-xs font-medium text-primary">{uploadProgress}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
