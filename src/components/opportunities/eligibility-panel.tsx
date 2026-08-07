import { Check, X, ShieldQuestion } from "lucide-react";
import type { EligibilityResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EligibilityPanel({ result }: { result: EligibilityResult }) {
  const missing = result.results.filter((r) => !r.satisfied);

  return (
    <section className="border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ShieldQuestion className="h-[18px] w-[18px] text-primary" />
        <h2 className="font-display text-lg font-medium">Eligibility check</h2>
      </div>
      <div className="space-y-4 p-4">
        <div
          className={cn(
            "flex items-center gap-4 border px-4 py-3",
            result.eligible ? "border-primary/40 bg-primary/5" : "border-warning/30 bg-warning/5",
          )}
        >
          <span className="font-display text-3xl font-medium tabular">
            {result.requiredSatisfied}
            <span className="text-lg text-muted-foreground">/{result.requiredTotal}</span>
          </span>
          <div>
            <p className="text-sm font-medium">
              {result.eligible ? "You meet the required criteria" : "Required criteria to meet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.satisfied} of {result.total} conditions satisfied
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {result.results.map((r) => (
            <li key={r.ruleId} className="flex items-start gap-2.5 text-sm">
              {r.satisfied ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <span>
                <span className="font-medium">{r.label ?? r.field}</span>
                {r.required && !r.satisfied && (
                  <span className="label-mono ml-1.5 text-warning">required</span>
                )}
                <span className="block text-xs leading-relaxed text-muted-foreground">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        {missing.length > 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Missing: {missing.map((m) => m.label ?? m.field).join(", ")}. Update your{" "}
            <a href="/profile" className="font-medium text-primary hover:underline">
              profile
            </a>{" "}
            to get accurate checks.
          </p>
        )}
      </div>
    </section>
  );
}
