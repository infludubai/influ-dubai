import { useEffect, useState } from "react"
import { Loader2, Mail, X } from "lucide-react"

type EmailModalProps = {
  isOpen: boolean
  title?: string
  message?: string
  defaultEmail?: string
  loading?: boolean
  onClose: () => void
  onSend: (email: string) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EmailModal({
  isOpen,
  title = "Send email",
  message = "Enter the recipient email address.",
  defaultEmail = "",
  loading = false,
  onClose,
  onSend,
}: EmailModalProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail)
      setError("")
    }
  }, [defaultEmail, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose()
      if (event.key === "Enter" && !loading) submit()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  })

  if (!isOpen) return null

  const submit = () => {
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.")
      return
    }
    onSend(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/50">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close email modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">Recipient email</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) setError("")
              }}
              placeholder="client@example.com"
              className={`h-11 w-full rounded-xl border bg-slate-950 px-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 ${
                error ? "border-red-400" : "border-white/10"
              }`}
            />
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
