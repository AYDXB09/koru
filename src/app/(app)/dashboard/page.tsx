import Link from "next/link";
import { Compass, ClipboardList, CalendarClock, Hourglass, Archive, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData, getOpportunityFits, getUserDocuments, profileForEngine, getClosingSoon } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/shared/score";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { WeeklyDigestButton } from "@/components/dashboard/weekly-digest";
import { TaskToggle } from "@/components/dashboard/task-toggle";
import { deadlineLabel, daysUntil } from "@/lib/deadlines";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function fijiDateString() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Fiji",
  }).format(new Date());
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [data, fits, closingSoon] = await Promise.all([
    getDashboardData(user.id),
    getOpportunityFits(user.id),
    getClosingSoon(user.id, 6),
  ]);
  const profile = await profileForEngine(user.id);

  const profileComplete = Boolean(
    profile?.age && profile?.education && profile?.city && profile?.fundingInterests?.length,
  );

  const topMatches = fits.slice(0, 3);
  const hoursSaved = data.apps.reduce((sum, a) => sum + a.opportunity.estimatedHours, 0);
  const docs = await getUserDocuments(user.id);
  const reusableDocs = docs.filter((x) => x.isReusable).length;

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      {/* Masthead */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <p className="label-mono text-muted-foreground">{fijiDateString()}</p>
          <h1 className="mt-1 font-display text-4xl font-light tracking-tight">
            {greeting}, <span className="text-primary">{user.name.split(" ")[0]}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <WeeklyDigestButton />
          <Button asChild>
            <Link href="/opportunities">
              <Compass className="mr-1.5 h-4 w-4" /> Find opportunities
            </Link>
          </Button>
        </div>
      </div>

      {!profileComplete && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-warning/40 bg-warning/5 px-4 py-3">
          <p className="text-sm">
            Your profile is incomplete. Fit scores and eligibility checks need your age, education, location
            and funding interests.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">Complete profile</Link>
          </Button>
        </div>
      )}

      {/* Stat cells */}
      <dl className="mt-8 grid grid-cols-2 gap-px border bg-border lg:grid-cols-4">
        <StatCell index="01" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Active applications" value={data.activeApps.length} />
        <StatCell index="02" icon={<CalendarClock className="h-[18px] w-[18px]" />} label="Upcoming deadlines" value={data.upcomingDeadlines.length} />
        <StatCell index="03" icon={<Hourglass className="h-[18px] w-[18px]" />} label="Hours of work planned" value={hoursSaved} />
        <StatCell index="04" icon={<Archive className="h-[18px] w-[18px]" />} label="Reusable documents" value={reusableDocs} />
      </dl>

      {/* Closing soon across the index */}
      {closingSoon.length > 0 && (
        <section className="mt-8 border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2.5">
            <p className="label-mono flex items-center gap-2 text-muted-foreground">
              <span className="live-dot" aria-hidden="true" /> Closing soon across the index
            </p>
            <Link href="/opportunities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Browse <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="ledger-rule">
            {closingSoon.map((o, i) => (
              <Link
                key={o.id}
                href={`/opportunities/${o.slug}`}
                className="group flex items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60"
              >
                <span className="tabular w-6 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-primary">{o.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.providerName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-primary">{o.fundingAmount || "Open"}</p>
                  <p className={`mt-0.5 text-[11px] ${o.daysLeft !== null && o.daysLeft <= 7 ? "font-medium text-accent" : "text-muted-foreground"}`}>
                    {o.daysLeft !== null ? `${o.daysLeft} ${o.daysLeft === 1 ? "day" : "days"} left` : "open"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Focus queue */}
          <section>
            <div className="mb-4 flex items-end justify-between border-b pb-2">
              <h2 className="font-display text-xl font-medium">Your focus queue</h2>
              <Link href="/applications" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                All applications <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.todayTasks.length === 0 ? (
              <div className="border px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">Nothing due right now.</p>
                <p className="mt-1 text-xs text-muted-foreground">Start an application to generate a guided checklist.</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/opportunities">Browse opportunities</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {data.todayTasks.map((t, i) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="tabular w-5 shrink-0 font-mono text-[11px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <TaskToggle taskId={t.id} completed={t.completed} label={t.title} />
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {t.dueDate && (
                        <span className="tabular text-xs text-muted-foreground">
                          {daysUntil(t.dueDate) < 0 ? "Overdue" : deadlineLabel(t.dueDate)}
                        </span>
                      )}
                      <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
                        {t.application.opportunity.title}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upcoming deadlines */}
          <section>
            <div className="mb-4 flex items-end justify-between border-b pb-2">
              <h2 className="font-display text-xl font-medium">Upcoming deadlines</h2>
              <Link href="/opportunities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Browse <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.upcomingDeadlines.length === 0 && (
              <div className="border px-5 py-6 text-sm text-muted-foreground">
                No applications with deadlines yet. Add an application to see deadlines here.
              </div>
            )}
            <div className="divide-y border">
              {data.upcomingDeadlines.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/applications/${a.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="tabular w-6 shrink-0 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <ScoreRing value={a.completion} size={38} label="Completion" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-medium">{a.opportunity.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.deadline ? deadlineLabel(a.deadline) : "Rolling deadline"}
                      <span className="mx-1.5 text-primary/40">·</span>
                      {a.taskCounts.done}/{a.taskCounts.total} tasks
                    </p>
                  </div>
                  <span className="label-mono text-muted-foreground">{APPLICATION_STATUS_LABELS[a.status] ?? a.status}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Best matches */}
        <section>
          <div className="mb-4 flex items-end justify-between border-b pb-2">
            <h2 className="font-display text-xl font-medium">Best matches</h2>
            <Link href="/opportunities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topMatches.map((o, i) => (
              <div key={o.id} className="relative">
                <span className="tabular absolute -left-1 top-2 z-10 bg-background px-1 font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <OpportunityCard opportunity={o} fitScore={o.fitScore} likelihood={o.likelihood} />
              </div>
            ))}
            {topMatches.length === 0 && (
              <div className="border px-5 py-6 text-sm text-muted-foreground">
                Complete your profile to get personalised matches.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCell({
  index,
  icon,
  label,
  value,
}: {
  index: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background p-5">
      <div className="flex items-start justify-between">
        <span className="tabular font-mono text-[11px] text-accent">{index}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center border text-primary">{icon}</span>
      </div>
      <dd className={cn("mt-4 font-display text-3xl font-light tabular leading-none")}>{value}</dd>
      <dt className="mt-1.5 text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
