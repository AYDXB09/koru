import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { deadlineLabel, daysUntil } from "@/lib/deadlines";
import { CATEGORY_LABELS, type OpportunityDto } from "@/lib/types";
import { FitScore } from "@/components/shared/score";
import { cn } from "@/lib/utils";

export function OpportunityCard({
  opportunity,
  fitScore,
  likelihood,
  index,
}: {
  opportunity: OpportunityDto;
  fitScore?: number;
  likelihood?: number;
  index?: string;
}) {
  const isClosed = opportunity.deadline && daysUntil(opportunity.deadline) < 0 && !opportunity.isRolling;

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="group flex h-full flex-col border bg-card transition-colors hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-mono text-muted-foreground">{opportunity.providerName}</p>
            <h3 className="mt-1.5 font-display text-[17px] font-medium leading-snug decoration-primary/50 decoration-2 underline-offset-4 transition-colors group-hover:text-primary">
              {opportunity.title}
            </h3>
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {opportunity.description}
        </p>

        <div className="mt-auto flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{CATEGORY_LABELS[opportunity.category] ?? opportunity.category}</span>
          <span className="h-1 w-1 bg-accent/60" />
          <span className="text-muted-foreground">
            {DIFFICULTY_LABELS[opportunity.difficulty] ?? opportunity.difficulty}
          </span>
          <span className="h-1 w-1 bg-accent/60" />
          <span className="tabular text-muted-foreground">~{opportunity.estimatedHours}h</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-t px-5 py-3">
        <div className="min-w-0">
          <p className={cn("text-sm font-medium leading-none text-primary")}>
            {opportunity.fundingAmount ?? (isClosed ? "Closed" : "Funded")}
          </p>
          <p className={cn("mt-1.5 text-xs", isClosed ? "text-destructive" : "text-muted-foreground")}>
            {isClosed
              ? "Deadline passed"
              : opportunity.isRolling
                ? "Rolling · apply any time"
                : `${deadlineLabel(opportunity.deadline)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {likelihood !== undefined && (
            <span className="hidden text-xs text-muted-foreground sm:inline" title={`Estimated likelihood ${likelihood}%`}>
              {likelihood}% likely
            </span>
          )}
          {fitScore !== undefined && <FitScore score={fitScore} />}
          {index !== undefined && (
            <span className="tabular font-mono text-xs text-accent">{index}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
