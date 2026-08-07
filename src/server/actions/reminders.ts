"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { daysUntil } from "@/lib/deadlines";
import * as ai from "@/lib/ai";

/**
 * Notification engine.
 * - Materialises due, unsent reminders into notifications.
 * - Surfaces incomplete tasks due within the next 3 days.
 * - Produces the weekly deadline digest.
 * Designed to run on a cron (or on dashboard load for the MVP).
 */

async function recentNotificationExists(userId: string, title: string): Promise<boolean> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: { userId, title, createdAt: { gt: dayAgo } },
  });
  return Boolean(existing);
}

export async function processDueReminders(): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: { sent: false, date: { lte: new Date() } },
    include: { application: { include: { opportunity: { select: { title: true } } } } },
  });

  let created = 0;
  for (const reminder of due) {
    const oppTitle = reminder.application?.opportunity.title;
    const title = oppTitle ? `${oppTitle}: ${reminder.title}` : reminder.title;
    if (await recentNotificationExists(reminder.userId, title)) {
      await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } });
      continue;
    }
    await prisma.notification.create({
      data: {
        userId: reminder.userId,
        type: reminder.type,
        title,
        body: reminder.applicationId ? `Open your application workspace to keep on track.` : undefined,
        link: reminder.applicationId ? `/applications/${reminder.applicationId}` : "/dashboard",
      },
    });
    await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } });
    created++;
  }
  return created;
}

export async function surfaceDueTasks(userId: string): Promise<number> {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      application: { userId },
      completed: false,
      dueDate: { not: null, lte: inThreeDays },
    },
    include: { application: { include: { opportunity: { select: { title: true } } } } },
    take: 10,
  });

  let created = 0;
  for (const task of tasks) {
    const days = task.dueDate ? daysUntil(task.dueDate) : 0;
    const title = `Task due: ${task.title}`;
    if (await recentNotificationExists(userId, title)) continue;
    await prisma.notification.create({
      data: {
        userId,
        type: "task",
        title,
        body: days <= 0 ? "This task is due today." : `Due in ${days} day${days === 1 ? "" : "s"}.`,
        link: `/applications/${task.applicationId}`,
      },
    });
    created++;
  }
  return created;
}

export async function generateWeeklyDigest(userId: string): Promise<string> {
  const apps = await prisma.application.findMany({
    where: { userId, status: { notIn: ["submitted", "accepted", "rejected", "withdrawn"] } },
    include: { opportunity: true },
  });

  const items = apps
    .filter((a) => a.opportunity.deadline && daysUntil(a.opportunity.deadline) >= 0 && daysUntil(a.opportunity.deadline) <= 7)
    .map((a) => ({
      title: a.opportunity.title,
      detail: `${daysUntil(a.opportunity.deadline!)} day${daysUntil(a.opportunity.deadline!) === 1 ? "" : "s"} until the deadline. ${a.completion}% complete.`,
      link: `/applications/${a.id}`,
    }));

  if (items.length === 0) {
    const digest = "You have no deadlines within the next 7 days. Enjoy the calm and keep making progress on open applications.";
    await prisma.notification.create({
      data: { userId, type: "digest", title: "Weekly digest", body: digest },
    });
    return digest;
  }

  const summary = await ai.weeklyDigest(items);
  await prisma.notification.create({
    data: { userId, type: "digest", title: "Weekly deadline digest", body: summary },
  });
  return summary;
}

export async function runNotificationPipeline() {
  const user = await requireUser();
  await processDueReminders();
  await surfaceDueTasks(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function runWeeklyDigest() {
  const user = await requireUser();
  const summary = await generateWeeklyDigest(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return summary;
}
