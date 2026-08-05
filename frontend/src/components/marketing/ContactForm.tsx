"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const TOPICS = [
  { value: "GENERAL", label: "General enquiry" },
  { value: "BRAND", label: "Running campaigns (brand)" },
  { value: "CREATOR", label: "Creator support" },
  { value: "AGENCY", label: "Agency / enterprise plan" },
  { value: "PARTNERSHIP", label: "Partnership" },
];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        topic,
        message: message.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please email hello@infludubai.com instead.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-600" />
        <p className="text-lg font-bold">Message sent</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Thanks {name.split(" ")[0] || "for reaching out"} — we&apos;ll reply to{" "}
          <span className="font-medium text-foreground">{email}</span> within one
          business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium">
            Company{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="topic" className="mb-1.5 block text-sm font-medium">
            Topic
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputClass}
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          minLength={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you're trying to do and we'll point you in the right direction."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 sm:w-auto"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send message
      </button>

      <p className="mt-3 text-xs text-muted-foreground">
        We use your details only to reply to this enquiry. See our{" "}
        <a href="/privacy" className="text-primary hover:underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
