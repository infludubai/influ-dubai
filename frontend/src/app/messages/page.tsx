"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, ArrowLeft, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { io, Socket } from "socket.io-client";

type Conversation = Awaited<ReturnType<typeof api.listConversations>>[number];
type Message = Awaited<ReturnType<typeof api.getMessages>>[number];

let socket: Socket | null = null;

function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`${dim} shrink-0 rounded-xl object-cover`} />;
  }
  return (
    <div className={`${dim} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo-400/20 font-bold text-primary`}>
      {initials}
    </div>
  );
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    initSocket();
    loadConversations().then(() => {
      const startWith = searchParams.get("with");
      if (startWith) startConversation(startWith);
    });
    return () => { socket?.disconnect(); socket = null; };
  }, [accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function initSocket() {
    socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001"}/messaging`, {
      auth: { token: accessToken },
    });
    socket.on("new_message", (msg: Message) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
  }

  async function loadConversations() {
    setLoading(true);
    const convs = await api.listConversations(accessToken!).catch(() => []);
    setConversations(convs);
    setLoading(false);
  }

  async function startConversation(otherUserId: string) {
    const conv = await api.startConversation(accessToken!, otherUserId);
    await loadConversations();
    openConversation(conv.id);
  }

  async function openConversation(convId: string) {
    setActiveConvId(convId);
    setMobileChatOpen(true);
    socket?.emit("join_conversation", convId);
    const msgs = await api.getMessages(accessToken!, convId);
    setMessages(msgs);
    setTimeout(() => inputRef.current?.focus(), 100);
    // mark as read locally
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c));
  }

  async function sendMessage() {
    if (!text.trim() || !activeConvId || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    if (socket?.connected) {
      socket.emit("send_message", { conversationId: activeConvId, content });
    } else {
      const msg = await api.sendMessage(accessToken!, activeConvId, content);
      setMessages(prev => [...prev, msg as Message]);
    }
    setSending(false);
  }

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherName = activeConv?.otherDisplayName ?? "Unknown";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b bg-background/90 px-6 py-3 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-bold">InfluDubai <span className="gradient-text">AI</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation sidebar */}
        <aside className={`${mobileChatOpen ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 shrink-0 flex-col border-r`}>
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold">Messages</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              {conversations.reduce((n, c) => n + c.unread, 0) > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary font-semibold">
                  {conversations.reduce((n, c) => n + c.unread, 0)} unread
                </span>
              )}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1,2,3,4].map(i => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-muted" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <p className="font-semibold">No conversations yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Message a creator or brand from their profile to get started.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map(conv => {
                  const name = conv.otherDisplayName ?? "Unknown";
                  const lastMsg = conv.messages[0];
                  const isActive = conv.id === activeConvId;

                  return (
                    <button key={conv.id} onClick={() => openConversation(conv.id)}
                      className={`w-full rounded-2xl p-3.5 text-left transition-all ${
                        isActive ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/50"
                      }`}>
                      <div className="flex items-center gap-3">
                        <Avatar name={name} imageUrl={conv.otherImageUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${conv.unread > 0 ? "font-bold" : "font-medium"}`}>{name}</span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {lastMsg && (
                                <span className="text-[10px] text-muted-foreground">{timeLabel(lastMsg.createdAt)}</span>
                              )}
                              {conv.unread > 0 && (
                                <span className="gradient-brand flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                                  {conv.unread > 9 ? "9+" : conv.unread}
                                </span>
                              )}
                            </div>
                          </div>
                          {conv.otherRole && (
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{conv.otherRole}</span>
                          )}
                          {lastMsg && (
                            <p className={`mt-0.5 truncate text-xs ${conv.unread > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className={`${!mobileChatOpen ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}>
          {activeConvId ? (
            <>
              {/* Chat header */}
              <div className="flex shrink-0 items-center gap-3 border-b bg-background px-5 py-3">
                <button onClick={() => setMobileChatOpen(false)}
                  className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Avatar name={otherName} imageUrl={activeConv?.otherImageUrl} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{otherName}</p>
                  {activeConv?.otherRole && (
                    <p className="text-xs text-muted-foreground">{activeConv.otherRole}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{messages.length} messages</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const mine = msg.senderId === user?.id;
                    const showDate = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-4 flex items-center gap-3">
                            <div className="flex-1 border-t" />
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <div className="flex-1 border-t" />
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            mine
                              ? "gradient-brand text-white rounded-br-sm"
                              : "bg-card border rounded-bl-sm"
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {mine && msg.readAt && " · Read"}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm p-4">
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Message… (Enter to send)"
                    className="input-glow flex-1 rounded-2xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background transition-all"
                  />
                  <button onClick={sendMessage} disabled={!text.trim() || sending}
                    className="gradient-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md hover:opacity-90 disabled:opacity-40 transition-all">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center gap-4 px-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <div>
                <p className="text-lg font-semibold">No conversation selected</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Choose a conversation from the sidebar, or visit a creator or brand profile to start one.
                </p>
              </div>
              <Link href="/marketplace">
                <button className="gradient-brand rounded-2xl px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
                  Browse creators
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
