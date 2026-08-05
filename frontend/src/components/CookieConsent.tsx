"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "infludubai.cookie-consent";

/**
 * GDPR-style consent banner. Defaults to the privacy-preserving option:
 * nothing beyond strictly-necessary storage is enabled unless the visitor
 * actively accepts, and declining is a single click of equal prominence.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Storage blocked (private mode / strict settings) — don't nag.
    }
  }, []);

  function decide(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {
      /* nothing we can do; just close */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
        <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
        <p className="min-w-[200px] flex-1 text-xs leading-relaxed text-muted-foreground">
          We use strictly-necessary cookies to keep you signed in. With your
          consent we&apos;d also like to measure how the site is used to improve
          it. See our{" "}
          <Link href="/cookies" className="text-primary hover:underline">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-muted"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Accept
          </button>
          <button
            onClick={() => decide("declined")}
            aria-label="Dismiss"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
