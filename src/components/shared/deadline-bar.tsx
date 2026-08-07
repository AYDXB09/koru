import { cn } from "@/lib/utils";
import { classifyUrgency, URGENCY_LABEL, daysUntil } from "@/lib/deadlines";

const TONE = {
  urgent: "text-destructive",
  soon: "text-warning",
  normal: "text-primary",
  expired: "text-muted-foreground",
  none: "text-muted-foreground",
} as const;

export function DeadlineBar({
  deadline,
  now = new Date(),
}: {
  deadline: Date;
  now?: Date;
}) {
  const urgency = classifyUrgency(deadline, now);
  const days = daysUntil(deadline, now);
  const tone = TONE[urgency];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", tone)}
      title={deadline.toLocaleDateString()}
    >
      <span className="h-1 w-1 bg-current" />
      {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : URGENCY_LABEL[urgency]}
      {days > 0 && <span className="tabular text-muted-foreground">· {days}d left</span>}
      {urgency === "expired" && <span>· closed</span>}
    </span>
  );
}
