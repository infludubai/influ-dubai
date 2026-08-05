"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

/**
 * Bookmark toggle for a creator. Optimistic: the icon flips immediately and
 * reverts if the request fails, so browsing a grid never feels laggy.
 */
export function ShortlistToggle({
  creatorProfileId,
  saved,
  onChange,
  size = 16,
}: {
  creatorProfileId: string;
  saved: boolean;
  onChange?: (saved: boolean) => void;
  size?: number;
}) {
  const { accessToken, user } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  const canSave = user?.role === "BRAND" || user?.role === "AGENCY";
  if (!canSave || !accessToken) return null;

  async function toggle(e: React.MouseEvent) {
    // Cards are wrapped in a Link — don't navigate when bookmarking.
    e.preventDefault();
    e.stopPropagation();

    const next = !isSaved;
    setIsSaved(next);
    setBusy(true);
    try {
      if (next) await api.addToShortlist(accessToken!, creatorProfileId);
      else await api.removeFromShortlist(accessToken!, creatorProfileId);
      onChange?.(next);
    } catch {
      setIsSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={isSaved ? "Remove from saved creators" : "Save creator"}
      aria-label={isSaved ? "Remove from saved creators" : "Save creator"}
      aria-pressed={isSaved}
      className={`rounded-lg p-1.5 transition-colors ${
        isSaved
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {busy ? (
        <Loader2 width={size} height={size} className="animate-spin" />
      ) : (
        <Bookmark
          width={size}
          height={size}
          className={isSaved ? "fill-current" : ""}
        />
      )}
    </button>
  );
}
