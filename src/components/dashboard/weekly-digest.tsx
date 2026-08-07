"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { runWeeklyDigest } from "@/server/actions/reminders";

export function WeeklyDigestButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await runWeeklyDigest();
          if (typeof res === "string") {
            toast.success("Weekly digest generated", {
              description: "Open Notifications to read it.",
            });
          } else {
            toast.error("Couldn't generate digest.");
          }
        })
      }
    >
      <Sparkles className={pending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
      {pending ? "Generating…" : "Generate weekly digest"}
    </Button>
  );
}
