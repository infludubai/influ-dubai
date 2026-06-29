import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Bot,
  Loader2,
  LogIn,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
  Image as ImageIcon,
} from "lucide-react"
import api from "@/api/client"
import { useAuthStore } from "@/store/authStore"
import toast from "react-hot-toast"
import { IMAGE_UPLOAD_TYPES, splitValidFiles } from "@/utils/fileValidation"

type LocalMessage = {
  id: string
  sender: "user" | "ai"
  body: string
  created_at?: string
}

type SupportMessage = {
  id: number
  sender_type: "client" | "admin" | "ai"
  body: string
  created_at?: string
}

const QUICK_QUESTIONS = [
  { icon: "briefcase", text: "What services do you offer?" },
  { icon: "price", text: "What are your prices?" },
  { icon: "work", text: "Can I see your portfolio?" },
  { icon: "human", text: "Talk to a human" },
]

function quickIcon(icon: string) {
  const className = "w-4 h-4 text-blue-600"
  if (icon === "human") return <ShieldCheck className={className} />
  if (icon === "price") return <span className="text-blue-600 text-sm font-bold">$</span>
  if (icon === "work") return <span className="text-blue-600 text-sm font-bold">#</span>
  return <MessageCircle className={className} />
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [chatId, setChatId] = useState<number | null>(null)
  const [humanMode, setHumanMode] = useState(false)
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatIdRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastTypingRef = useRef(0)

  useEffect(() => {
    chatIdRef.current = chatId
  }, [chatId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages, supportMessages, loading, supportLoading, humanMode])

  const addLocalMsg = (sender: "user" | "ai", body: string) => {
    setLocalMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), sender, body, created_at: new Date().toISOString() },
    ])
  }

  const loadSupportMessages = async (id: number, showLoader = false) => {
    if (showLoader) setSupportLoading(true)
    try {
      const res = await api.get(`/client/chats/${id}/messages`)
      setSupportMessages(res.data.data ?? [])
    } catch {
      if (showLoader) addLocalMsg("ai", "I could not load support messages right now. Please try again.")
    } finally {
      if (showLoader) setSupportLoading(false)
    }
  }

  const loadTypingStatus = async (id: number) => {
    try {
      const res = await api.get(`/client/chats/${id}/typing-status`)
      setAdminTyping(Boolean(res.data.data?.admin))
    } catch { /* noop */ }
  }

  const notifyTyping = () => {
    if (!humanMode || !isAuthenticated || !chatIdRef.current) return
    const now = Date.now()
    if (now - lastTypingRef.current < 2500) return
    lastTypingRef.current = now
    api.post(`/client/chats/${chatIdRef.current}/typing`).catch(() => {})
  }

  const startSupportChat = async (openingText?: string) => {
    setHumanMode(true)

    if (!isAuthenticated) {
      addLocalMsg("ai", "Please log in to message Amir directly here. You can still email info@a-mir.com anytime.")
      return
    }

    setSupportLoading(true)
    try {
      const res = await api.post("/client/chats")
      const supportChat = res.data.data
      setChatId(supportChat.id)
      await loadSupportMessages(supportChat.id)

      if (openingText?.trim()) {
        const sent = await api.post(`/client/chats/${supportChat.id}/messages`, { body: openingText.trim() })
        setSupportMessages((prev) => [...prev, sent.data.data])
      } else if (supportMessages.length === 0) {
        addLocalMsg("ai", "You are connected with Amir. Send your message below and replies will appear here.")
      }
    } catch {
      addLocalMsg("ai", "Support chat could not connect. Please email info@a-mir.com or try again in a moment.")
    } finally {
      setSupportLoading(false)
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!isOpen || !humanMode || !isAuthenticated) return

    pollRef.current = setInterval(() => {
      if (chatIdRef.current) {
        loadSupportMessages(chatIdRef.current)
        loadTypingStatus(chatIdRef.current)
      }
    }, 4000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isOpen, humanMode, isAuthenticated])

  const sendAiMessage = async (text: string) => {
    const wantsHuman =
      text.toLowerCase().includes("talk to") ||
      text.toLowerCase().includes("human") ||
      text.toLowerCase().includes("speak to") ||
      text.toLowerCase().includes("real person") ||
      text.toLowerCase().includes("amir")

    addLocalMsg("user", text)

    if (wantsHuman) {
      await startSupportChat(text.toLowerCase().includes("talk to") ? undefined : text)
      return
    }

    setLoading(true)
    try {
      const res = await api.post("/ai/chat", { message: text })
      addLocalMsg("ai", res.data.reply || "How can I help you?")
    } catch {
      addLocalMsg("ai", "Sorry, I am having trouble right now. You can message Amir directly from this chat if you are logged in.")
    } finally {
      setLoading(false)
    }
  }

  const sendSupportMessage = async (text: string) => {
    if (!isAuthenticated) {
      addLocalMsg("user", text)
      addLocalMsg("ai", "Please log in first so Amir can reply to you directly in this chat.")
      return
    }

    let id = chatId
    if (!id) {
      await startSupportChat()
      id = chatIdRef.current
    }
    if (!id) return

    setSupportLoading(true)
    try {
      const res = await api.post(`/client/chats/${id}/messages`, { body: text })
      const msg = res.data.data

      let uploadErrors = 0
      for (const [index, file] of pendingImages.entries()) {
        try {
          setUploadProgress(`Uploading ${file.name} (${index + 1} of ${pendingImages.length})...`)
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/client/chats/${id}/messages/${msg.id}/files`, fd, {
            onUploadProgress: (event) => {
              if (!event.total) return
              setUploadProgress(`Uploading ${file.name} (${Math.round((event.loaded * 100) / event.total)}%)`)
            },
          })
        } catch (err) {
          uploadErrors++
          console.error(`[Chat widget image upload failed: ${file.name}]`, err)
        }
      }
      if (uploadErrors > 0) toast.error(`${uploadErrors} image(s) failed to upload.`)
      setPendingImages([])

      // Reload messages
      await loadSupportMessages(id)
    } catch {
      addLocalMsg("ai", "That message did not send. Please try again.")
      setInput(text)
    } finally {
      setSupportLoading(false)
      setUploadProgress("")
      inputRef.current?.focus()
    }
  }

  const sendMessage = async (text: string) => {
    const body = text.trim()
    const hasText = body.length > 0
    const hasImages = pendingImages.length > 0
    if ((!hasText && !hasImages) || loading || supportLoading) return
    setInput("")

    if (humanMode) {
      await sendSupportMessage(body || (hasImages ? 'File attached' : ''))
      return
    }

    await sendAiMessage(body)
  }

  const reset = () => {
    setLocalMessages([])
    setSupportMessages([])
    setInput("")
    setHumanMode(false)
    setChatId(null)
  }

  const openLogin = () => {
    const returnTo = encodeURIComponent(window.location.pathname)
    window.location.href = `/login?returnTo=${returnTo}`
  }

  const hasMessages = localMessages.length > 0 || supportMessages.length > 0

  return (
    <div className="fixed bottom-3 right-3 z-50 font-sans sm:bottom-4 sm:right-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 18 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="absolute bottom-16 right-0 flex h-[min(600px,calc(100dvh-7rem))] w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 md:w-[420px]"
          >
            <div className="gradient-brand text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {hasMessages && (
                  <button onClick={reset} className="p-1 hover:bg-white/20 rounded-lg transition" aria-label="Start over">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  {humanMode ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">
                    {humanMode ? "Amir Nazir" : "Amir Assistant"}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                    <span className="text-white/75 text-[10px]">
                      {humanMode ? "Direct support messages" : "AI answers + human support"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition" aria-label="Close chat">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-muted/30">
              {!hasMessages && !humanMode ? (
                <div className="h-full flex flex-col justify-center items-center text-center px-2">
                  <MessageCircle className="w-12 h-12 text-blue-500/20 mb-3" />
                  <p className="text-foreground font-semibold text-base mb-2">Hi, how can I help?</p>
                  <p className="text-muted-foreground text-xs mb-5">Ask a question or message Amir directly.</p>
                  <div className="grid grid-cols-1 gap-2.5 w-full">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q.text}
                        onClick={() => sendMessage(q.text)}
                        className="p-2.5 text-left bg-card border border-border rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition text-foreground text-sm font-medium flex items-center gap-2.5"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          {quickIcon(q.icon)}
                        </span>
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {localMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        msg.sender === "user"
                          ? "gradient-brand text-white rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.body}
                      </div>
                    </motion.div>
                  ))}

                  {supportMessages.map((msg) => {
                    const isClient = msg.sender_type === "client"
                    const isAi = msg.sender_type === "ai"
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${isClient ? "justify-end" : "justify-start"}`}
                      >
                        {!isClient && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            isAi ? "bg-purple-100" : "gradient-brand"
                          }`}>
                            {isAi ? <Bot className="w-3.5 h-3.5 text-purple-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                          </div>
                        )}
                        <div className={`flex flex-col ${isClient ? "items-end" : "items-start"} max-w-[78%]`}>
                          {!isClient && (
                            <span className="text-[10px] text-muted-foreground mb-1 px-1">
                              {isAi ? "AI Assistant" : "Amir"}
                            </span>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isClient
                              ? "gradient-brand text-white rounded-br-sm"
                              : isAi
                              ? "bg-purple-50 text-purple-900 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-200 dark:border-purple-800/30 rounded-bl-sm"
                              : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                          }`}>
                            {msg.body}
                          </div>
                          {msg.created_at && (
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(msg.created_at)}</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}

                  {humanMode && !isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3"
                    >
                      <p className="text-blue-950 font-semibold text-sm">Log in to chat with Amir here</p>
                      <button
                        onClick={openLogin}
                        className="w-full gradient-brand text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Client login
                      </button>
                      <a
                        href="mailto:info@a-mir.com"
                        className="flex items-center justify-center gap-2 text-blue-700 text-xs font-semibold hover:text-blue-900 transition"
                      >
                        <Mail className="w-4 h-4" />
                        info@a-mir.com
                      </a>
                    </motion.div>
                  )}

                  {humanMode && isAuthenticated && (
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700 border border-blue-100">
                        <ShieldCheck className="w-3 h-3" />
                        Messages are saved to {user?.name ? `${user.name}'s` : "your"} account
                      </span>
                    </div>
                  )}

                  {humanMode && adminTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2 text-xs text-muted-foreground shadow-sm">
                        Amir is typing...
                      </div>
                    </motion.div>
                  )}

                  {(loading || supportLoading) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        <span className="text-xs text-muted-foreground">{uploadProgress || (supportLoading ? "Connecting..." : "Sending...")}</span>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-border p-3 bg-card flex-shrink-0 space-y-2">
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingImages.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt="pending"
                        className="h-16 w-16 object-cover rounded-lg border border-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {humanMode && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || supportLoading}
                    className="p-2.5 border border-border text-muted-foreground rounded-xl hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-40"
                    aria-label="Attach image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const { accepted, rejected } = splitValidFiles(Array.from(e.target.files ?? []), IMAGE_UPLOAD_TYPES)
                    rejected.forEach((message) => toast.error(message))
                    if (accepted.length) setPendingImages(prev => [...prev, ...accepted])
                    e.target.value = ''
                  }}
                />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); notifyTyping() }}
                  onKeyDown={(e) => e.key === "Enter" && !loading && !supportLoading && sendMessage(input)}
                  placeholder={humanMode ? "Type your message for Amir..." : "Ask anything..."}
                  disabled={loading || supportLoading}
                  className="min-w-0 flex-1 px-3.5 py-2.5 border border-border bg-background rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 placeholder:text-muted-foreground transition disabled:opacity-60"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={(!input.trim() && pendingImages.length === 0) || loading || supportLoading}
                  className="p-2.5 gradient-brand text-white rounded-xl hover:opacity-90 transition disabled:opacity-40"
                  aria-label="Send message"
                >
                  {loading || supportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-white shadow-lg transition-shadow hover:shadow-xl relative"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </motion.button>
    </div>
  )
}
