import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Download, FileText, Image as ImageIcon, Paperclip, Send, User, MessageSquare, Loader2, Bot, ShieldCheck, Menu, X, Smartphone } from "lucide-react"
import { assetUrl } from "@/utils/assets"
import AdminLayout from "@/components/admin/AdminLayout"
import api from "@/api/client"
import toast from "react-hot-toast"
import { DOCUMENT_UPLOAD_TYPES, splitValidFiles } from "@/utils/fileValidation"

function formatTime(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function AdminChats() {
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [sendMode, setSendMode] = useState<"chat" | "sms">("chat")
  const [clientTyping, setClientTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const lastTypingRef = useRef(0)

  const scrollToBottom = () =>
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, 50)

  const loadChats = () =>
    api.get("/admin/chats")
      .then(r => setChats(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

  const loadMessages = (chatId: number) =>
    api.get(`/admin/chats/${chatId}/messages`)
      .then(r => { setMessages(r.data.data ?? []); scrollToBottom() })
      .catch(() => {})

  const loadTypingStatus = (chatId: number) =>
    api.get(`/admin/chats/${chatId}/typing-status`)
      .then(r => setClientTyping(Boolean(r.data.data?.client)))
      .catch(() => {})

  const notifyTyping = () => {
    if (!selectedChat || sendMode !== "chat") return
    const now = Date.now()
    if (now - lastTypingRef.current < 2500) return
    lastTypingRef.current = now
    api.post(`/admin/chats/${selectedChat.id}/typing`).catch(() => {})
  }

  useEffect(() => {
    loadChats()
    // Poll chat list for new incoming chats every 5s
    chatPollRef.current = setInterval(loadChats, 5000)
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current) }
  }, [])

  useEffect(() => {
    if (!selectedChat) return
    selectedIdRef.current = selectedChat.id
    loadMessages(selectedChat.id)
    loadTypingStatus(selectedChat.id)
    pollRef.current = setInterval(() => {
      if (selectedIdRef.current) {
        loadMessages(selectedIdRef.current)
        loadTypingStatus(selectedIdRef.current)
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedChat?.id])

  const openChat = (chat: any) => {
    setSelectedChat(chat)
    setMessages([])
    setSendMode("chat")
    setSidebarOpen(false) // auto-close sidebar on mobile
  }

  const sendMessage = async () => {
    if (!input.trim() && pendingFiles.length === 0) return
    if (!selectedChat || sending) return
    if (sendMode === "sms" && !selectedChat.user?.phone) {
      toast.error("This client does not have a phone number.")
      return
    }

    setSending(true)
    const text = input.trim()
    const filesToSend = [...pendingFiles]
    setInput("")
    setPendingFiles([])
    try {
      const bodyToSend = text || (filesToSend.length > 0 ? '📎 File attached' : '')
      const endpoint = sendMode === "sms"
        ? `/admin/chats/${selectedChat.id}/send-sms`
        : `/admin/chats/${selectedChat.id}/messages`
      const res = await api.post(endpoint, { body: bodyToSend })
      const msg = res.data.data
      let uploadErrors = 0
      for (const [index, file] of filesToSend.entries()) {
        try {
          setUploadProgress(`Uploading ${file.name} (${index + 1} of ${filesToSend.length})...`)
          const fd = new FormData()
          fd.append("file", file)
          await api.post(`/admin/chats/${selectedChat.id}/messages/${msg.id}/files`, fd, {
            onUploadProgress: (event) => {
              if (!event.total) return
              setUploadProgress(`Uploading ${file.name} (${Math.round((event.loaded * 100) / event.total)}%)`)
            },
          })
        } catch (err) {
          uploadErrors++
          console.error(`[Admin chat file upload failed: ${file.name}]`, err)
        }
      }
      if (uploadErrors > 0) toast.error(`${uploadErrors} file(s) failed to upload`)
      // Reload to get files attached to message
      await loadMessages(selectedChat.id)
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unread_admin: 0 } : c))
      if (sendMode === "sms") toast.success("SMS sent to client.")
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.sms?.[0] ||
        error.response?.data?.errors?.phone?.[0]
      toast.error(message || (sendMode === "sms" ? "Failed to send SMS." : "Failed to send message."))
      setInput(text)
      setPendingFiles(filesToSend)
    } finally { setSending(false); setUploadProgress("") }
  }

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_admin ?? 0), 0)

  if (loading) return (
    <AdminLayout title="Messages">
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Messages">
      <div className="flex h-[calc(100vh-7rem)] gap-0 -mx-4 md:-mx-6 overflow-hidden rounded-xl border border-border relative">

        {/* Mobile toggle */}
        <button
          className="absolute top-3 left-3 z-20 lg:hidden p-2 bg-muted rounded-lg text-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          absolute lg:relative inset-y-0 left-0 z-10
          w-72 flex-shrink-0 bg-card border-r border-border flex flex-col
          transition-transform duration-200
        `}>
          <div className="p-4 border-b border-border pt-12 lg:pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</p>
              {totalUnread > 0 && (
                <span className="w-5 h-5 gradient-brand rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {totalUnread}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">{chats.length} total</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-10 h-10 text-foreground/10 mx-auto mb-3" />
                <p className="text-muted-foreground/60 text-sm">No conversations yet</p>
                <p className="text-muted-foreground/40 text-xs mt-1">Clients will appear here when they message you</p>
              </div>
            ) : chats.map(chat => {
              const isSelected = selectedChat?.id === chat.id
              const lastMsg = chat.latest_message ?? chat.latestMessage
              return (
                <button key={chat.id} onClick={() => openChat(chat)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors hover:bg-muted ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-foreground text-sm font-medium truncate">{chat.user?.name || "Unknown"}</p>
                        <span className="text-muted-foreground/60 text-[10px] flex-shrink-0">{formatTime(chat.last_message_at)}</span>
                      </div>
                      {lastMsg ? (
                        <p className="text-muted-foreground text-xs truncate mt-0.5">{lastMsg.body}</p>
                      ) : (
                        <p className="text-muted-foreground/50 text-xs mt-0.5 italic">No messages yet</p>
                      )}
                    </div>
                    {chat.unread_admin > 0 && (
                      <span className="w-5 h-5 gradient-brand rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {chat.unread_admin}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col bg-card min-w-0">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card flex-shrink-0 pl-14 lg:pl-5">
                <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm">{selectedChat.user?.name || "Unknown"}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="truncate">{selectedChat.user?.email}</span>
                    {selectedChat.user?.phone ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300/80">
                        <Smartphone className="h-3 w-3" />
                        {selectedChat.user.phone}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-300/80">
                        <Smartphone className="h-3 w-3" />
                        No phone
                      </span>
                    )}
                  </div>
                  {clientTyping && <p className="mt-1 text-xs font-medium text-blue-300">Client is typing...</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
                  {selectedChat.type}
                </span>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground/60 text-sm">No messages yet. Send one below.</p>
                  </div>
                ) : messages.map(msg => {
                  const isAdmin = msg.sender_type === "admin"
                  const isAi = msg.sender_type === "ai"
                  const isSms = msg.channel === "sms"
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                      {!isAdmin && (
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${isAi ? "bg-purple-600/20" : "gradient-brand"}`}>
                          {isAi ? <Bot className="w-3.5 h-3.5 text-purple-400" /> : <User className="w-3.5 h-3.5 text-foreground" />}
                        </div>
                      )}
                      <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[70%]`}>
                        {!isAdmin && (
                          <span className="text-xs text-muted-foreground/60 mb-1 px-1">
                            {isAi ? "AI Assistant" : selectedChat.user?.name}
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                          isAdmin
                            ? "gradient-brand text-white rounded-br-sm"
                            : isAi
                            ? "bg-purple-600/20 text-purple-200 border border-purple-500/20 rounded-bl-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}>
                          {/* Render links as clickable anchors */}
                          {msg.body?.split(/(https?:\/\/[^\s<>'"]+)/g).map((part: string, pi: number) =>
                            /^https?:\/\//.test(part)
                              ? <a key={pi} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-90 hover:opacity-100 break-all">{part}</a>
                              : part
                          )}
                          {/* File attachments */}
                          {msg.files?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {msg.files.map((f: any) => {
                                const isImage = f.mime_type?.startsWith('image/')
                                const url = f.public_url || assetUrl('/storage/' + f.file_path)
                                return (
                                  <a key={f.id} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted/30 border border-border text-foreground hover:bg-muted/50 transition-all">
                                    {isImage ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                                    <span className="max-w-[120px] truncate">{f.original_name}</span>
                                    <Download className="w-3 h-3 opacity-60 shrink-0" />
                                  </a>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <div className={`mt-1 flex items-center gap-1.5 px-1 text-[10px] ${isAdmin ? "text-muted-foreground/60" : "text-muted-foreground/50"}`}>
                          {isSms && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300">
                              <Smartphone className="h-2.5 w-2.5" />
                              SMS{msg.sms_status ? ` · ${msg.sms_status}` : ""}
                            </span>
                          )}
                          {msg.created_at && <span>{formatTime(msg.created_at)}</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
                {clientTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-xs text-muted-foreground">
                      Client is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-4 bg-card flex-shrink-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-lg border border-border bg-card p-1">
                    <button
                      onClick={() => setSendMode("chat")}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${sendMode === "chat" ? "bg-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setSendMode("sms")}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${sendMode === "sms" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Smartphone className="h-3 w-3" />
                      SMS
                    </button>
                  </div>
                  {sendMode === "sms" && (
                    <span className={`text-xs ${selectedChat.user?.phone ? "text-emerald-300/80" : "text-amber-300/80"}`}>
                      {selectedChat.user?.phone ? `Sending to ${selectedChat.user.phone}` : "Add client phone number first"}
                    </span>
                  )}
                </div>
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-lg px-2.5 py-1 text-xs text-primary font-medium">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="max-w-[100px] truncate">{f.name}</span>
                        <button onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {sendMode === "chat" && (
                    <>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-muted-foreground hover:text-foreground border border-border rounded-xl transition flex-shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input ref={fileInputRef} type="file" multiple className="hidden"
                        onChange={e => {
                          const { accepted, rejected } = splitValidFiles(Array.from(e.target.files ?? []), DOCUMENT_UPLOAD_TYPES)
                          rejected.forEach((message) => toast.error(message))
                          if (accepted.length) setPendingFiles(p => [...p, ...accepted])
                          e.target.value = ""
                        }} />
                    </>
                  )}
                  <input
                    value={input}
                    onChange={e => { setInput(e.target.value); notifyTyping() }}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={sendMode === "sms" ? "Type SMS to client..." : "Type reply or attach files…"}
                    disabled={sending}
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary placeholder-white/30 disabled:opacity-60"
                  />
                  <button onClick={sendMessage} disabled={(!input.trim() && pendingFiles.length === 0) || sending || (sendMode === "sms" && !selectedChat.user?.phone)}
                    className={`p-2.5 text-foreground rounded-xl hover:opacity-90 disabled:opacity-40 transition flex-shrink-0 ${sendMode === "sms" ? "bg-emerald-500" : "gradient-brand"}`}>
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                {uploadProgress && <p className="mt-2 text-right text-xs font-medium text-primary">{uploadProgress}</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
                <p className="text-muted-foreground/60 text-sm">Select a conversation to start replying</p>
                <p className="text-muted-foreground/40 text-xs mt-1">New messages from clients appear in the sidebar automatically</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
