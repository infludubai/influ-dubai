"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download, Trash2, ShieldCheck, AlertTriangle, CheckCircle2,
  Sun, Moon, Monitor, Bell, Lock, User, Palette,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useTheme } from "@/components/ThemeProvider";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06 } }),
};

const SECURITY_ITEMS = [
  "Passwords hashed with bcrypt (cost factor 12)",
  "Rate limiting — 100 req/min general, 10/min on auth endpoints",
  "HTTP security headers via Helmet (XSS, clickjacking, MIME sniffing protection)",
  "CORS restricted to allowed frontend origins",
  "JWT access tokens expire in 15 min; refresh tokens are rotated on use",
  "All sensitive mutations logged to audit trail",
];

export default function SettingsPage() {
  const { accessToken, user, clearSession } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, platform: true, campaigns: true, messages: true });

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
    const confirmed = confirm("This will permanently delete your account and all data. This cannot be undone. Are you sure?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.deleteMyAccount(accessToken);
      clearSession();
      router.push("/");
    } catch { /* ignore */ }
    setDeleting(false);
  }

  const THEME_OPTIONS = [
    { value: "light",  label: "Light",  icon: Sun },
    { value: "system", label: "System", icon: Monitor },
    { value: "dark",   label: "Dark",   icon: Moon },
  ] as const;

  const NOTIF_ROWS = [
    { key: "email",     label: "Email notifications",   desc: "Receive activity summaries to your inbox" },
    { key: "platform",  label: "Platform alerts",       desc: "In-app notifications for key events" },
    { key: "campaigns", label: "Campaign updates",      desc: "Status changes, new proposals, and milestones" },
    { key: "messages",  label: "New messages",          desc: "Notify when you receive a new message" },
  ] as const;

  return (
    <DashboardShell title="Settings">
      <motion.div
        className="mx-auto max-w-2xl space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {/* Account info */}
        <motion.section variants={fadeUp} className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Account</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Display name</p>
              <p className="text-sm font-medium">{user?.displayName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-sm font-medium">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {user?.role ?? "—"}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account status</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            </div>
          </div>
        </motion.section>

        {/* Appearance */}
        <motion.section variants={fadeUp} className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Appearance</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">Choose how InfluDubai AI looks for you.</p>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  theme === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section variants={fadeUp} className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            {NOTIF_ROWS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${notifs[key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${notifs[key] ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Security */}
        <motion.section variants={fadeUp} className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold">Security & Privacy</h2>
          </div>
          <ul className="space-y-2.5">
            {SECURITY_ITEMS.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Data export */}
        <motion.section variants={fadeUp} className="rounded-2xl border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Export your data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Download a JSON export of all personal data we hold — profile, campaigns, messages, and more. GDPR-compliant.
              </p>
              {exported && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Download started.
                </motion.p>
              )}
            </div>
            <button onClick={exportData} disabled={exporting}
              className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
              <Download className="h-4 w-4" />
              {exporting ? "Preparing…" : "Export"}
            </button>
          </div>
        </motion.section>

        {/* Danger zone */}
        <motion.section variants={fadeUp} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="font-semibold text-destructive">Delete account</p>
              </div>
              <p className="text-sm text-destructive/80">
                Permanently deletes your account, profile, campaigns, and all data. This cannot be undone.
              </p>
            </div>
            <button onClick={deleteAccount} disabled={deleting}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-destructive/30 bg-background px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.section>
      </motion.div>
    </DashboardShell>
  );
}
