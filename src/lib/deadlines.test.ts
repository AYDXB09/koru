import { describe, expect, it } from "vitest";
import {
  daysUntil,
  classifyUrgency,
  reminderSchedule,
  deadlineLabel,
  startOfDay,
} from "@/lib/deadlines";

describe("daysUntil", () => {
  it("computes whole-day difference", () => {
    const now = new Date("2026-08-07T10:00:00");
    const deadline = new Date("2026-08-10T23:00:00");
    expect(daysUntil(deadline, now)).toBe(3);
  });

  it("returns negative for past deadlines", () => {
    const now = new Date("2026-08-07");
    const deadline = new Date("2026-08-01");
    expect(daysUntil(deadline, now)).toBe(-6);
  });
});

describe("classifyUrgency", () => {
  const now = new Date("2026-08-07");

  it("returns none when no deadline", () => {
    expect(classifyUrgency(null, now)).toBe("none");
  });

  it("classifies urgent within 7 days", () => {
    expect(classifyUrgency(new Date("2026-08-10"), now)).toBe("urgent");
  });

  it("classifies soon within 30 days", () => {
    expect(classifyUrgency(new Date("2026-08-20"), now)).toBe("soon");
  });

  it("classifies normal beyond 30 days", () => {
    expect(classifyUrgency(new Date("2026-09-20"), now)).toBe("normal");
  });

  it("classifies expired", () => {
    expect(classifyUrgency(new Date("2026-08-01"), now)).toBe("expired");
  });
});

describe("reminderSchedule", () => {
  const now = new Date("2026-08-07");
  const deadline = new Date("2026-09-01");

  it("creates reminders at 14, 7, 3, 1 days before", () => {
    const reminders = reminderSchedule(deadline, now, [14, 7, 3, 1]);
    expect(reminders.map((r) => r.daysBefore)).toEqual([14, 7, 3, 1]);
  });

  it("skips offsets already passed", () => {
    const nearDeadline = new Date("2026-08-10");
    const reminders = reminderSchedule(nearDeadline, now, [14, 7, 3, 1]);
    expect(reminders.map((r) => r.daysBefore)).toEqual([3, 1]);
  });

  it("computes reminder dates on the right day", () => {
    const reminders = reminderSchedule(deadline, now, [1]);
    expect(startOfDay(reminders[0].date).getTime()).toBe(startOfDay(new Date("2026-08-31")).getTime());
  });
});

describe("deadlineLabel", () => {
  const now = new Date("2026-08-07");

  it("labels rolling", () => {
    expect(deadlineLabel(null, now)).toBe("Rolling deadline");
  });

  it("labels due today", () => {
    expect(deadlineLabel(new Date("2026-08-07"), now)).toBe("Due today");
  });

  it("labels due tomorrow", () => {
    expect(deadlineLabel(new Date("2026-08-08"), now)).toBe("Due tomorrow");
  });

  it("labels generic countdown", () => {
    expect(deadlineLabel(new Date("2026-08-12"), now)).toBe("Due in 5 days");
  });

  it("labels closed", () => {
    expect(deadlineLabel(new Date("2026-08-01"), now)).toBe("Closed 6d ago");
  });
});
