import Link from "next/link";
import { Bell, CheckCheck, CalendarClock, ClipboardList, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserNotifications } from "@/server/queries";
import { markAllNotificationsRead } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  deadline: CalendarClock,
  reminder: Bell,
  application: ClipboardList,
  digest: Bell,
  system: Info,
} as const;

export const metadata = { title: "Notifications · Koru" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getUserNotifications(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="label-mono text-muted-foreground">Updates</p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Deadline reminders, application updates and digests.
          </p>
        </div>
        {notifications.some((n) => !n.readAt) && (
          <form action={markAllNotificationsRead}>
            <Button variant="outline" size="sm">
              <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center border px-5 py-16 text-center">
          <span className="grid h-10 w-10 place-items-center border text-muted-foreground">
            <Bell className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-medium">All caught up</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            We will nudge you before deadlines and when you start applications.
          </p>
        </div>
      ) : (
        <ul className="divide-y border">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? Info;
            const inner = (
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center border",
                    n.readAt ? "text-muted-foreground" : "border-primary/40 text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", n.readAt && "text-muted-foreground")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.readAt && (
                  <span className="mt-2 h-2 w-2 shrink-0 bg-accent" aria-label="Unread" />
                )}
              </div>
            );
            return (
              <li key={n.id} className={cn("bg-card px-4 py-4", !n.readAt && "bg-primary/5")}>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="block transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
