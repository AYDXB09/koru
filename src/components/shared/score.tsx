import { cn } from "@/lib/utils";

export function ScoreRing({
  value,
  size = 44,
  stroke = 4,
  className,
  label,
  tone,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
  tone?: "teal" | "amber" | "muted";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;

  const color =
    tone === "amber"
      ? "text-warning"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-primary";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          className={cn("stroke-current transition-all duration-700", color)}
        />
      </svg>
      <span className="absolute font-display text-xs font-medium tabular">{Math.round(clamped)}</span>
    </div>
  );
}

export function FitScore({ score }: { score: number }) {
  const tone = score >= 70 ? "text-primary" : score >= 40 ? "text-warning" : "text-muted-foreground";
  return (
    <span className={cn("font-mono text-xs font-medium tabular", tone)} title="Fit score">
      {score}% fit
    </span>
  );
}
