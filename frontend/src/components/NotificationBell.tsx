"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      const [notifs, count] = await Promise.all([
        api.getNotifications(accessToken).catch(() => [] as Notification[]),
        api.getUnreadCount(accessToken).catch(() => 0),
      ]);
      setItems(notifs);
      setUnread(Number(count));
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [accessToken]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAll() {
    if (!accessToken) return;
    await api.markAllNotificationsRead(accessToken);
    setItems(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
  }

  if (!accessToken) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-muted">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="gradient-brand absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-semibold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No notifications</p>
            ) : items.map(n => (
              <div key={n.id} className={`border-b p-4 last:border-0 ${!n.readAt ? "bg-primary/3" : ""}`}>
                {n.link ? (
                  <Link href={n.link} onClick={() => setOpen(false)}>
                    <p className="text-sm font-medium hover:text-primary">{n.title}</p>
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{n.title}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
