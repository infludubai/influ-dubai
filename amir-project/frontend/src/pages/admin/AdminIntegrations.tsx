import { useEffect, useState } from "react"
import { Code2, KeyRound, Loader2, Mail, Save, Send, ShieldCheck, Smartphone, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import api from "@/api/client"
import AdminLayout from "@/components/admin/AdminLayout"

const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
const textareaClass = `${inputClass} min-h-28 resize-y`

const defaults: Record<string, string> = {
  google_adsense_client: "",
  google_adsense_ads_txt: "",
  google_site_verification: "",
  google_site_verification_script: "",
  google_tag_manager_id: "",
  custom_head_scripts: "",
  custom_body_scripts: "",
  google_client_id: "",
  google_client_secret: "",
  github_client_id: "",
  github_client_secret: "",
  smtp_enabled: "0",
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  smtp_encryption: "tls",
  smtp_from_address: "",
  smtp_from_name: "Amir Nazir",
  twilio_sms_enabled: "0",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_from_number: "",
  twilio_webhook_token: "",
}

export default function AdminIntegrations() {
  const [settings, setSettings] = useState<Record<string, string>>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)

  const sendTestEmail = async () => {
    setTestingEmail(true)
    try {
      const r = await api.post("/admin/settings/test-email", {})
      toast.success(r.data.message)
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Test email failed.")
    } finally {
      setTestingEmail(false)
    }
  }

  const clearCache = async () => {
    setClearingCache(true)
    try {
      const r = await api.post("/admin/settings/clear-cache", {})
      toast.success(r.data.message || "Cache cleared successfully.")
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Could not clear cache.")
    } finally {
      setClearingCache(false)
    }
  }

  useEffect(() => {
    api.get("/admin/settings").then((response) => {
      const next = { ...defaults }
      ;(response.data.data || []).forEach((item: any) => {
        if (item.key in next) next[item.key] = item.value || ""
      })
      setSettings(next)
    }).catch(() => toast.error("Could not load integrations.")).finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: string) => setSettings((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await api.put("/admin/settings", { settings })
      toast.success("Integrations saved.")
      window.dispatchEvent(new Event("builder:settings-saved"))
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not save integrations.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout title="Integrations"><div className="text-muted-foreground">Loading...</div></AdminLayout>

  return (
    <AdminLayout title="Integrations">
      <div className="max-w-5xl space-y-6">
        <section className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Integrations</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">Tracking, social login, and email delivery</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/55">
            Add website tracking scripts, OAuth keys, and SMTP settings from one place. Public script fields render on the live website; secrets stay admin-only.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel icon={Code2} title="Website Tracking">
            <Field label="Google AdSense Publisher ID">
              <input value={settings.google_adsense_client} onChange={(event) => set("google_adsense_client", event.target.value)} className={inputClass} placeholder="ca-pub-xxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="ads.txt Content">
              <textarea value={settings.google_adsense_ads_txt} onChange={(event) => set("google_adsense_ads_txt", event.target.value)} className={textareaClass} placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0" />
            </Field>
            <div className="rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-xs leading-5 text-blue-100">
              Saved ads.txt content will be available at <span className="font-semibold text-foreground">/ads.txt</span> for Google AdSense verification.
            </div>
            <Field label="Google Site Verification Token">
              <input value={settings.google_site_verification} onChange={(event) => set("google_site_verification", event.target.value)} className={inputClass} placeholder="content value from google-site-verification meta tag" />
            </Field>
            <Field label="Google Verification Script / Meta Tag">
              <textarea value={settings.google_site_verification_script} onChange={(event) => set("google_site_verification_script", event.target.value)} className={textareaClass} placeholder='<meta name="google-site-verification" content="..." />' />
            </Field>
            <Field label="Google Tag Manager ID">
              <input value={settings.google_tag_manager_id} onChange={(event) => set("google_tag_manager_id", event.target.value)} className={inputClass} placeholder="GTM-XXXXXXX" />
            </Field>
            <Field label="Custom Head Scripts">
              <textarea value={settings.custom_head_scripts} onChange={(event) => set("custom_head_scripts", event.target.value)} className={textareaClass} placeholder="<script>...</script>" />
            </Field>
            <Field label="Custom Body Scripts">
              <textarea value={settings.custom_body_scripts} onChange={(event) => set("custom_body_scripts", event.target.value)} className={textareaClass} placeholder="<noscript>...</noscript>" />
            </Field>
          </Panel>

          <Panel icon={KeyRound} title="Social Login Keys">
            <Field label="Google Client ID">
              <input value={settings.google_client_id} onChange={(event) => set("google_client_id", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Google Client Secret">
              <input type="password" value={settings.google_client_secret} onChange={(event) => set("google_client_secret", event.target.value)} className={inputClass} />
            </Field>
            <Field label="GitHub Client ID">
              <input value={settings.github_client_id} onChange={(event) => set("github_client_id", event.target.value)} className={inputClass} />
            </Field>
            <Field label="GitHub Client Secret">
              <input type="password" value={settings.github_client_secret} onChange={(event) => set("github_client_secret", event.target.value)} className={inputClass} />
            </Field>
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              OAuth buttons can use these keys later, but full OAuth callback flow remains disabled until routes and provider setup are explicitly enabled.
            </div>
          </Panel>
        </div>

        <Panel icon={Mail} title="SMTP Email Settings">
          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            Enable SMTP from settings
            <input type="checkbox" checked={settings.smtp_enabled === "1"} onChange={(event) => set("smtp_enabled", event.target.checked ? "1" : "0")} className="h-4 w-4 accent-primary" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SMTP Host"><input value={settings.smtp_host} onChange={(event) => set("smtp_host", event.target.value)} className={inputClass} placeholder="smtp.example.com" /></Field>
            <Field label="SMTP Port"><input value={settings.smtp_port} onChange={(event) => set("smtp_port", event.target.value)} className={inputClass} placeholder="587" /></Field>
            <Field label="SMTP Username"><input value={settings.smtp_username} onChange={(event) => set("smtp_username", event.target.value)} className={inputClass} /></Field>
            <Field label="SMTP Password"><input type="password" value={settings.smtp_password} onChange={(event) => set("smtp_password", event.target.value)} className={inputClass} /></Field>
            <Field label="Encryption">
              <select value={settings.smtp_encryption} onChange={(event) => set("smtp_encryption", event.target.value)} className={inputClass}>
                <option value="tls">TLS — port 587 (Namecheap recommended)</option>
                <option value="smtps">SSL — port 465</option>
                <option value="">None — port 25</option>
              </select>
            </Field>
            <Field label="From Email"><input value={settings.smtp_from_address} onChange={(event) => set("smtp_from_address", event.target.value)} className={inputClass} placeholder="info@example.com" /></Field>
            <Field label="From Name"><input value={settings.smtp_from_name} onChange={(event) => set("smtp_from_name", event.target.value)} className={inputClass} /></Field>
          </div>
        </Panel>

        <Panel icon={Smartphone} title="SMS Messaging">
          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            Enable Twilio SMS
            <input type="checkbox" checked={settings.twilio_sms_enabled === "1"} onChange={(event) => set("twilio_sms_enabled", event.target.checked ? "1" : "0")} className="h-4 w-4 accent-primary" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Twilio Account SID">
              <input value={settings.twilio_account_sid} onChange={(event) => set("twilio_account_sid", event.target.value)} className={inputClass} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Twilio Auth Token">
              <input type="password" value={settings.twilio_auth_token} onChange={(event) => set("twilio_auth_token", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Twilio From Number">
              <input value={settings.twilio_from_number} onChange={(event) => set("twilio_from_number", event.target.value)} className={inputClass} placeholder="+15551234567" />
            </Field>
            <Field label="Webhook Token">
              <input value={settings.twilio_webhook_token} onChange={(event) => set("twilio_webhook_token", event.target.value)} className={inputClass} placeholder="random-secret-token" />
            </Field>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-100">
            Set your Twilio inbound message webhook to <span className="font-semibold text-foreground">/api/sms/twilio/webhook?token=YOUR_TOKEN</span>. Incoming SMS messages are matched to users by phone number and appear in Admin Messages.
          </div>
        </Panel>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              onClick={sendTestEmail}
              disabled={testingEmail}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Test Email
            </button>
            <button
              onClick={clearCache}
              disabled={clearingCache}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {clearingCache ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear Cache
            </button>
          </div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Integrations"}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

function Panel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> {label}
      </span>
      {children}
    </label>
  )
}
