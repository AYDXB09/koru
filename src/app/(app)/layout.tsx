import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUnreadNotificationCount } from "@/server/queries";
import { processDueReminders, surfaceDueTasks } from "@/server/actions/reminders";
import { maybeAutoSync } from "@/lib/ingestion";
import { AppShellClient } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // First visit: run the onboarding wizard before the workspace unlocks.
  if (!user.onboardedAt) redirect("/onboarding");

  // Lightweight pipeline on each authenticated visit (MVP cron):
  // pull new opportunities from due sources, then fire due reminders.
  await maybeAutoSync().catch(() => undefined);
  await processDueReminders().catch(() => undefined);
  await surfaceDueTasks(user.id).catch(() => undefined);

  const unread = await getUnreadNotificationCount(user.id);

  return (
    <AppShellClient
      unread={unread}
      userName={user.name}
      userEmail={user.email}
    >
      {children}
    </AppShellClient>
  );
}
