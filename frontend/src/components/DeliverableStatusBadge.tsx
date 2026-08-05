import type { DeliverableStatus } from "@/lib/api";

const STATUS_META: Record<
  DeliverableStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Not started",
    className: "bg-muted text-muted-foreground border-border",
  },
  SUBMITTED: {
    label: "In review",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/25",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border line-through",
  },
};

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Formats a due date with an overdue hint — null-safe. */
export function DueDate({
  date,
  done,
}: {
  date: string | null;
  done: boolean;
}) {
  if (!date) return null;
  const due = new Date(date);
  const overdue = !done && due.getTime() < Date.now();
  return (
    <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>
      {overdue ? "Overdue — due " : "Due "}
      {due.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
    </span>
  );
}
