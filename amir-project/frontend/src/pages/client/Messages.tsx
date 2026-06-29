import { useEffect, useState, useRef } from "react"
import { Send, MessageCircle, Loader2, ShieldCheck, Bot, Paperclip, X, Download, FileText, Image as ImageIcon } from "lucide-react"
import api from "@/api/client"
import { assetUrl } from "@/utils/assets"
import { useAuthStore } from "@/store/authStore"
import PageLoader from "@/components/shared/PageLoader"
import ClientPageHeader from "@/components/client/ClientPageHeader"
import toast from "react-hot-toast"
import { DOCUMENT_UPLOAD_TYPES, splitValidFiles } from "@/utils/fileValidation"

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Render message text with clickable links */
function MessageText({ body, isClient }: { body: string; isClient: boolean }) {
  const URL_RE = /(https?:\/\/[^\s<>'"]+)/g
  const parts = body.split(URL_RE)
  return (
    <span>
      {parts.map((p, i) =>
        URL_RE.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer"
            className={`underline underline-offset-2 break-all ${isClient ? "text-white/90 hover:text-white" : "text-primary hover:text-primary/80"}`}
            onClick={e => e.stopPropagation()}>
            {p}
          </a>
        ) : p
      )}
    </span>
  )
}

/** Render attached files in a message */
function FileAttachments({ files, isClient }: { files: any[]; isClient: boolean }) {
  if (!files?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.map((f: any) => {
        const isImage = f.mime_type?.startsWith('image/')
        const url = f.public_url || assetUrl('/storage/' + f.file_path)
        return (
          <a key={f.id} href={url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 ${isClient ? "bg-white/20 border-white/25 text-white" : "bg-card border-border text-foreground"}`}>
            {isImage ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
            <span className="max-w-[140px] truncate">{f.original_name}</span>
            <Download className="w-3 h-3 shrink-0 opacity-60" />
          </a>
        )
      })}
    </div>
  )
}

export default function Messages() {
  const { user } = useAuthStore()
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [adminTyping, setAdminTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState("")
  const [isPollingActive, setIsPollingActive] = useState(() => typeof document === "undefined" || !document.hidden)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatIdRef = useRef<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastTypingRef = useRef(0)

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

  const loadMessages = (chatId: number) =>
    api.get(`/client/chats/${chatId}/messages`)
      .then((r) => { setMessages(r.data.data ?? []); scrollToBottom() })
      .catch(() => {})

  const loadTypingStatus = (chatId: number) =>
    api.get(`/client/chats/${chatId}/typing-status`)
      .then((r) => setAdminTyping(Boolean(r.data.data?.admin)))
      .catch(() => {})

  const notifyTyping = () => {
    if (!chat) return
    const now = Date.now()
    if (now - lastTypingRef.current < 2500) return
    lastTypingRef.current = now
    api.post(`/client/chats/${chat.id}/typing`).catch(() => {})
  }

  useEffect(() => {
    api.get("/client/chats").then((r) => {
      const chats = r.data.data ?? []
      if (chats.length > 0) {
        setChat(chats[0]); chatIdRef.current = chats[0].id
        return loadMessages(chats[0].id)
      } else {
        return api.post("/client/chats").then((cr) => {
          setChat(cr.data.data); chatIdRef.current = cr.data.data.id; setMessages([])
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const update = () => setIsPollingActive(!document.hidden && document.hasFocus())
    window.addEventListener("focus", update)
    window.addEventListener("blur", update)
    document.addEventListener("visibilitychange", update)
    update()
    return () => {
      window.removeEventListener("focus", update)
      window.removeEventListener("blur", update)
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  useEffect(() => {
    if (!isPollingActive) return
    pollRef.current = setInterval(() => {
      if (chatIdRef.current) { loadMessages(chatIdRef.current); loadTypingStatus(chatIdRef.current) }
    }, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isPollingActive])

  const send = async () => {
    const body = text.trim()
    if ((!body && pendingFiles.length === 0) || !chat || sending) return
    setSending(true)
    const bodyToSend = body || (pendingFiles.length > 0 ? '📎 File attached' : '')
    setText("")
    const filesToUpload = [...pendingFiles]
    setPendingFiles([])
    try {
      const res = await api.post(`/client/chats/${chat.id}/messages`, { body: bodyToSend })
      const msg = res.data.data
      // Upload each pending file
      let uploadErrors = 0
      for (const [index, file] of filesToUpload.entries()) {
        try {
          setUploadProgress(`Uploading ${file.name} (${index + 1} of ${filesToUpload.length})...`)
          const fd = new FormData()
          fd.append("file", file)
          await api.post(`/client/chats/${chat.id}/messages/${msg.id}/files`, fd, {
            onUploadProgress: (event) => {
              if (!event.total) return
              setUploadProgress(`Uploading ${file.name} (${Math.round((event.loaded * 100) / event.total)}%)`)
            },
          })
        } catch (err) {
          uploadErrors++
          console.error(`[Message file upload failed: ${file.name}]`, err)
        }
      }
      if (uploadErrors > 0) toast.error(`${uploadErrors} file(s) failed to upload`)
      await loadMessages(chat.id)
    } catch (err: any) {
      setText(body)
      setPendingFiles(filesToUpload)
      toast.error(err.response?.data?.message || "Message could not be sent.")
    } finally {
      setSending(false)
      setUploadProgress("")
      inputRef.current?.focus()
    }
  }

  if (loading) return <div className="pt-24"><PageLoader /></div>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col p-4 pb-6">
        <ClientPageHeader title="Support Messages" description="Chat directly with Amir. Replies usually within a few hours." />

        <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden" style={{ minHeight: '520px' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/30">
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Amir Nazir — Support</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-xs text-muted-foreground">Online · replies within a few hours</span>
              </div>
              {adminTyping && <p className="mt-1 text-xs font-medium text-blue-600">Amir is typing...</p>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MessageCircle className="w-14 h-14 text-muted-foreground/20 mb-4" />
                <p className="font-semibold text-foreground text-sm">Start the conversation</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Send a message or upload files about your project. Amir will reply personally.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isClient = m.sender_type === "client"
                const isAi = m.sender_type === "ai"
                return (
                  <div key={m.id} className={`flex gap-2 ${isClient ? "justify-end" : "justify-start"}`}>
                    {!isClient && (
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${isAi ? "bg-purple-100" : "gradient-brand"}`}>
                        {isAi ? <Bot className="w-3.5 h-3.5 text-purple-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}
                    <div className={`flex flex-col ${isClient ? "items-end" : "items-start"} max-w-[75%]`}>
                      {!isClient && (
                        <span className="text-xs text-muted-foreground mb-1 px-1">{isAi ? "AI Assistant" : "Amir"}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isClient ? "gradient-brand text-white rounded-br-sm"
                        : isAi ? "bg-purple-50 text-purple-900 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-200 dark:border-purple-800/30 rounded-bl-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        <MessageText body={m.body} isClient={isClient} />
                        <FileAttachments files={m.files} isClient={isClient} />
                      </div>
                      {m.created_at && (
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(m.created_at)}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {adminTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-xs text-muted-foreground">Amir is typing...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-primary font-medium">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition flex-shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                onChange={e => {
                  const { accepted, rejected } = splitValidFiles(Array.from(e.target.files ?? []), DOCUMENT_UPLOAD_TYPES)
                  rejected.forEach((message) => toast.error(message))
                  if (accepted.length) setPendingFiles(prev => [...prev, ...accepted])
                  e.target.value = ""
                }} />
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => { setText(e.target.value); notifyTyping() }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message or attach files…"
                disabled={sending}
                className="flex-1 h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={(!text.trim() && pendingFiles.length === 0) || sending}
                className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-90 disabled:opacity-40 transition"
              >
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {uploadProgress || "Enter to send · attach JPG, PNG, WebP, PDF, or TXT · links are clickable"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
