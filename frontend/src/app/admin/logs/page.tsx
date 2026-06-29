"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { MessageSquare, Mail, FileText } from "lucide-react";

type LogEntry = { type: string; at: string; detail: string };

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  MESSAGE:    { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-blue-50 text-blue-700" },
  INVITATION: { icon: <Mail className="h-3.5 w-3.5" />,         color: "bg-purple-50 text-purple-700" },
  PROPOSAL:   { icon: <FileText className="h-3.5 w-3.5" />,     color: "bg-green-50 text-green-700" },
};

export default function AdminLogsPage() {
  const { accessToken } = useAuthStore();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api.adminGetLogs(accessToken, page).then(res => setLog(res.log)).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken, page]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Audit Log</h1>

      <div className="rounded-2xl border bg-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !log.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No activity yet</div>
        ) : (
          <div className="divide-y">
            {log.map((entry, i) => {
              const meta = TYPE_META[entry.type] ?? TYPE_META.MESSAGE;
              return (
                <div key={i} className="flex items-start gap-4 px-6 py-4">
                  <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.detail}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{entry.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">Previous</button>
        <span className="px-3 py-1.5 text-sm text-muted-foreground">Page {page}</span>
        <button disabled={log.length < 50} onClick={() => setPage(p => p + 1)}
          className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
      </div>
    </div>
  );
}
