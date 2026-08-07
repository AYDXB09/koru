import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/shared/score";
import { deadlineLabel } from "@/lib/deadlines";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await requireUser();
  const { apps } = await getDashboardData(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="label-mono text-muted-foreground">Workspace</p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight">Applications</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Every application is an executable project. Open one to see its task plan and documents.
          </p>
        </div>
        <Button asChild>
          <Link href="/opportunities">
            <Plus className="mr-1.5 h-4 w-4" /> Start a new application
          </Link>
        </Button>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border px-5 py-20 text-center">
          <p className="font-display text-lg font-medium">No applications yet</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Find an opportunity you qualify for and turn it into an executable checklist.
          </p>
          <Button asChild className="mt-2">
            <Link href="/opportunities">Browse opportunities</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, i) => (
            <Link
              key={app.id}
              href={`/applications/${app.id}`}
              className="group flex flex-col border bg-card transition-colors hover:border-primary/40"
            >
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="label-mono text-muted-foreground">{app.opportunity.providerName}</p>
                    <h3 className="mt-1.5 line-clamp-2 font-display text-[17px] font-medium leading-snug">
                      {app.opportunity.title}
                    </h3>
                  </div>
                  <ScoreRing value={app.completion} size={40} label="Completion" />
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>{app.deadline ? deadlineLabel(app.deadline) : "Rolling deadline"}</span>
                    <span className="tabular">
                      {app.taskCounts.done}/{app.taskCounts.total} tasks
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="label-mono">{APPLICATION_STATUS_LABELS[app.status] ?? app.status}</span>
                    <span className="flex items-center gap-3">
                      <span className="tabular font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
