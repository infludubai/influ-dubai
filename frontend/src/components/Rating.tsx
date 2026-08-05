"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";

/** Read-only star display with an optional review count. */
export function RatingStars({
  value,
  count,
  size = 14,
  showEmpty = false,
}: {
  value: number | null | undefined;
  count?: number | null;
  size?: number;
  showEmpty?: boolean;
}) {
  if (value == null || !count) {
    return showEmpty ? (
      <span className="text-xs text-muted-foreground">No reviews yet</span>
    ) : null;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }
        />
      ))}
      <span className="ml-0.5 text-xs font-semibold">{value.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </span>
  );
}

/** Interactive 1–5 picker used in the review form. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${
              n <= active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function VerifiedBadge({
  status,
  size = "sm",
}: {
  status: string | null | undefined;
  size?: "sm" | "md";
}) {
  if (status !== "VERIFIED") return null;
  const px = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      title="Identity and audience verified by InfluDubai"
      className="inline-flex items-center gap-1 text-blue-500"
    >
      <BadgeCheck className={px} />
      {size === "md" && <span className="text-xs font-semibold">Verified</span>}
    </span>
  );
}
