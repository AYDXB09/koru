import { REMINDER_OFFSET_DAYS } from "@/lib/constants";

/**
 * Deadline manager.
 * Computes urgency, days-remaining, and the reminder schedule for a deadline.
 * Pure functions, fully unit-testable.
 */

export type Urgency = "urgent" | "soon" | "normal" | "expired" | "none";

export interface ReminderCandidate {
  date: Date;
  daysBefore: number;
  title: string;
  type: "deadline";
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(deadline: Date, now: Date = new Date()): number {
  const ms = startOfDay(deadline).getTime() - startOfDay(now).getTime();
  return Math.round(ms / 86_400_000);
}

export function classifyUrgency(deadline: Date | null, now: Date = new Date()): Urgency {
  if (!deadline) return "none";
  const days = daysUntil(deadline, now);
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "normal";
}

export const URGENCY_LABEL: Record<Urgency, string> = {
  urgent: "Urgent",
  soon: "Coming up",
  normal: "On track",
  expired: "Deadline passed",
  none: "Rolling",
};

/** Offsets in days before the deadline where a reminder should fire. */
export function reminderSchedule(
  deadline: Date,
  now: Date = new Date(),
  offsets: readonly number[] = REMINDER_OFFSET_DAYS,
): ReminderCandidate[] {
  const days = daysUntil(deadline, now);
  const candidates: ReminderCandidate[] = [];
  for (const offset of offsets) {
    if (days < offset) continue; // skip offsets already passed
    const date = startOfDay(new Date(deadline));
    date.setDate(date.getDate() - offset);
    candidates.push({
      date,
      daysBefore: offset,
      title: `${offset} day${offset === 1 ? "" : "s"} until deadline`,
      type: "deadline",
    });
  }
  return candidates;
}

/** Human description used on cards. */
export function deadlineLabel(deadline: Date | null, now: Date = new Date()): string {
  if (!deadline) return "Rolling deadline";
  const days = daysUntil(deadline, now);
  if (days < 0) return `Closed ${Math.abs(days)}d ago`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
