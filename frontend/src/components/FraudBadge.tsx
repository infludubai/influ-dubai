import { ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

const RISK_META: Record<RiskLevel, { label: string; icon: React.ElementType; classes: string; dot: string }> = {
  LOW:    { label: "Low risk",    icon: ShieldCheck, classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  MEDIUM: { label: "Medium risk", icon: ShieldAlert, classes: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
  HIGH:   { label: "High risk",   icon: ShieldX,     classes: "bg-red-50 text-red-700 border-red-200",           dot: "bg-red-500" },
};

export function FraudBadge({
  level,
  score,
  size = "sm",
}: {
  level: RiskLevel | string | null | undefined;
  score?: number | null;
  size?: "xs" | "sm" | "md";
}) {
  if (!level) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
      <Shield className="h-3 w-3" /> Not analyzed
    </span>
  );

  const meta = RISK_META[level as RiskLevel] ?? RISK_META.MEDIUM;
  const Icon = meta.icon;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] gap-1",
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-sm gap-2",
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${meta.classes} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : size === "md" ? "h-4 w-4" : "h-3 w-3"} />
      {meta.label}
      {score !== null && score !== undefined && (
        <span className="opacity-60">({score.toFixed(0)})</span>
      )}
    </span>
  );
}

export function FraudScoreRing({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 60 ? "#ef4444" : score >= 30 ? "#f59e0b" : "#10b981";

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold leading-none" style={{ color }}>{score.toFixed(0)}</p>
        <p className="text-[9px] text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}
