import { cn } from "@/lib/utils";

/**
 * Low-fidelity placeholder block used inside wireframes to represent
 * content that will be designed/built in a later phase (images, charts,
 * rich media, etc). Intentionally plain so it doesn't read as "final UI".
 */
export function WireframeBlock({
  label,
  className,
  height = "h-24",
}: {
  label: string;
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 text-center text-xs text-muted-foreground",
        height,
        className
      )}
    >
      {label}
    </div>
  );
}
