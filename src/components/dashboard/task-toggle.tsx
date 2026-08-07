import { CheckCircle2, Circle } from "lucide-react";
import { toggleTask } from "@/server/actions/applications";
import { cn } from "@/lib/utils";

export function TaskToggle({
  taskId,
  completed,
  label,
}: {
  taskId: string;
  completed: boolean;
  label: string;
}) {
  return (
    <form action={toggleTask.bind(null, taskId)}>
      <button
        type="submit"
        className="group flex w-full items-start gap-2.5 text-left"
        aria-label={completed ? `Mark "${label}" as not done` : `Mark "${label}" as done`}
      >
        {completed ? (
          <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
        ) : (
          <Circle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
        <span className={cn("text-sm", completed ? "text-muted-foreground line-through" : "")}>
          {label}
        </span>
      </button>
    </form>
  );
}
