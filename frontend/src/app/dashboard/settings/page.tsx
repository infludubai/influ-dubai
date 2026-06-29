"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Trash2, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

export default function SettingsPage() {
  const { accessToken, clearSession } = useAuthStore();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);

  async function exportData() {
    if (!accessToken) return;
    setExporting(true);
    try {
      const data = await api.exportMyData(accessToken);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "my-infludubai-data.json"; a.click();
      URL.revokeObjectURL(url);
      setExported(true);
    } catch { /* ignore */ }
    setExporting(false);
  }

  async function deleteAccount() {
    if (!accessToken) return;
    const confirmed = confirm("This will permanently delete your account and all your data. This cannot be undone. Are you sure?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.deleteMyAccount(accessToken);
      clearSession();
      router.push("/");
    } catch { /* ignore */ }
    setDeleting(false);
  }

  const securityItems = [
    "Passwords hashed with bcrypt (cost factor 12)",
    "API rate limiting — 100 req/min general, 10/min on auth endpoints",
    "HTTP security headers via Helmet (XSS, clickjacking, MIME sniffing protection)",
    "CORS restricted to allowed frontend origins",
    "JWT access tokens expire in 15 min; refresh tokens are rotated on use",
    "All sensitive mutations logged to audit trail",
  ];

  return (
    <DashboardShell title="Settings">
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your data and account in compliance with GDPR.</p>
        </motion.div>

        {/* Data export */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="mb-4 rounded-2xl border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Export your data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Download a JSON file of all personal data we hold — profile, campaigns, messages, and more.
              </p>
              {exported && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Download started successfully.
                </motion.p>
              )}
            </div>
            <button onClick={exportData} disabled={exporting}
              className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
              <Download className="h-4 w-4" />
              {exporting ? "Preparing…" : "Export data"}
            </button>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="mb-4 rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="font-semibold">Security measures in place</p>
          </div>
          <ul className="space-y-2">
            {securityItems.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Delete account */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
          className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="font-semibold text-red-800">Delete account</p>
              </div>
              <p className="text-sm text-red-700">
                Permanently deletes your account, profile, campaigns, and all associated data. This cannot be undone.
              </p>
            </div>
            <button onClick={deleteAccount} disabled={deleting}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
