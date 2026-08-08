"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { buildTaskPlan } from "@/lib/plan";
import { jparse } from "@/lib/json";
import { reminderSchedule } from "@/lib/deadlines";
import { getOpportunityRules } from "@/server/queries";
import { profileLike, profileFacts } from "@/server/serializers";
import { buildPersonalStatement } from "@/lib/smartfill";
import type { ProfileFacts } from "@/lib/smartfill";
import * as ai from "@/lib/ai";

const statusSchema = z.enum(["not-started", "in-progress", "ready-to-submit", "submitted", "accepted", "rejected", "withdrawn"]);

export async function startApplication(opportunityId: string) {
  const user = await requireUser();
  const app = await createApplication(user.id, opportunityId);
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  redirect(`/applications/${app.id}`);
}

/**
 * Creates an application for a user against an opportunity, generating the
 * task plan, deadline reminders and a notification. Returns the existing
 * application if one is already open for that opportunity. Used by the
 * "start application" flow and by onboarding to seed a plan of work.
 */
export async function createApplication(userId: string, opportunityId: string) {
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error("Opportunity not found.");

  const existing = await prisma.application.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
  });
  if (existing) return existing;

  const dto = {
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    providerId: opp.providerId,
    providerName: "",
    providerVerified: false,
    category: opp.category as never,
    deadline: opp.deadline,
    isRolling: opp.isRolling,
    countryScope: opp.countryScope,
    description: opp.description,
    officialUrl: opp.officialUrl,
    applicationUrl: opp.applicationUrl,
    fundingAmount: opp.fundingAmount,
    currency: opp.currency,
    amountLow: opp.amountLow,
    amountHigh: opp.amountHigh,
    status: opp.status,
    verificationLevel: opp.verificationLevel,
    estimatedHours: opp.estimatedHours,
    difficulty: opp.difficulty,
    ageMin: opp.ageMin,
    ageMax: opp.ageMax,
    requiredDocuments: jparse<string[]>(opp.requiredDocuments, []),
    stages: jparse(opp.stages, []),
    faq: jparse(opp.faq, []),
    sourceUrl: opp.sourceUrl,
    lastVerifiedAt: opp.lastVerifiedAt,
  } as const;

  const planned = buildTaskPlan(dto as never);

  const app = await prisma.application.create({
    data: {
      userId,
      opportunityId: opp.id,
      status: "in-progress",
      completion: 0,
    },
  });

  await prisma.task.createMany({
    data: planned.map((t) => ({
      applicationId: app.id,
      title: t.title,
      description: t.description,
      category: t.category,
      sortOrder: t.sortOrder,
      priority: "medium",
    })),
  });

  // Deadline reminders (14/7/3/1 days out).
  if (opp.deadline) {
    const reminders = reminderSchedule(opp.deadline);
    if (reminders.length > 0) {
      await prisma.reminder.createMany({
        data: reminders.map((r) => ({
          userId,
          applicationId: app.id,
          title: `${opp.title}: ${r.title}`,
          date: r.date,
          type: r.type,
        })),
      });
    }
  }

  await prisma.notification.create({
    data: {
      userId,
      type: "application",
      title: `Started: ${opp.title}`,
      body: `A guided checklist has been created for this application.`,
      link: `/applications/${app.id}`,
    },
  });

  await recomputeCompletion(app.id);
  return app;
}

export async function startApplicationBySlug(slug: string) {
  await requireUser();
  const opp = await prisma.opportunity.findUnique({ where: { slug } });
  if (!opp) throw new Error("Opportunity not found.");
  return startApplication(opp.id);
}

export async function recomputeCompletion(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tasks: true, documents: true, opportunity: true },
  });
  if (!app) return 0;

  const total = app.tasks.length;
  const done = app.tasks.filter((t) => t.completed).length;
  const taskFrac = total === 0 ? 1 : done / total;

  const required = jparse<string[]>(app.opportunity.requiredDocuments, []);
  const uploadedTypes = new Set(app.documents.map((d) => d.type));
  const covered = required.filter((req) => {
    const norm = req.toLowerCase();
    for (const t of uploadedTypes) {
      if (t === norm || norm.includes(t.replace(/-/g, " ").split(" ")[0])) return true;
    }
    return false;
  }).length;
  const docFrac = required.length === 0 ? 1 : covered / required.length;

  let completion = Math.round(100 * (0.7 * taskFrac + 0.3 * docFrac));
  if (app.status === "submitted") completion = 100;

  await prisma.application.update({ where: { id: applicationId }, data: { completion } });
  return completion;
}

const taskInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(40).default("other"),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export async function addTask(applicationId: string, input: z.infer<typeof taskInput>) {
  const user = await requireUser();
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");

  const data = taskInput.parse(input);
  const maxOrder = await prisma.task.aggregate({ where: { applicationId }, _max: { sortOrder: true } });

  await prisma.task.create({
    data: {
      applicationId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  await recomputeCompletion(applicationId);
  revalidatePath(`/applications/${applicationId}`);
}

export async function toggleTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({
    where: { id: taskId, application: { userId: user.id } },
  });
  if (!task) throw new Error("Task not found.");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : null,
    },
  });
  await recomputeCompletion(task.applicationId);
  revalidatePath(`/applications/${task.applicationId}`);
}

export async function updateTask(
  taskId: string,
  input: Partial<z.infer<typeof taskInput>>,
) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({
    where: { id: taskId, application: { userId: user.id } },
  });
  if (!task) throw new Error("Task not found.");

  const data = taskInput.partial().parse(input);
  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
    },
  });
  revalidatePath(`/applications/${task.applicationId}`);
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({
    where: { id: taskId, application: { userId: user.id } },
  });
  if (!task) throw new Error("Task not found.");
  await prisma.task.delete({ where: { id: taskId } });
  await recomputeCompletion(task.applicationId);
  revalidatePath(`/applications/${task.applicationId}`);
}

export async function updateApplicationNotes(applicationId: string, notes: string) {
  const user = await requireUser();
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");
  await prisma.application.update({
    where: { id: applicationId },
    data: { notes: notes.slice(0, 4000) },
  });
  revalidatePath(`/applications/${applicationId}`);
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const user = await requireUser();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Invalid status.");
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");

  const now = parsed.data === "submitted" ? new Date() : null;
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: parsed.data,
      submittedAt: now ?? app.submittedAt,
      ...(parsed.data === "submitted" ? { completion: 100 } : {}),
    },
  });

  if (parsed.data === "submitted") {
    await prisma.reminder.updateMany({ where: { applicationId }, data: { sent: true } });
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "application",
        title: "Application submitted",
        body: "Good work — your application has been marked as submitted.",
        link: `/applications/${applicationId}`,
      },
    });
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
}

export async function deleteApplication(applicationId: string) {
  const user = await requireUser();
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");
  await prisma.application.delete({ where: { id: applicationId } });
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function getEligibilityViewForApplication(applicationId: string) {
  const user = await requireUser();
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
    include: { opportunity: true },
  });
  if (!app) return null;
  const rules = await getOpportunityRules(app.opportunityId);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return { rules, profile: profile ? profileLike(profile) : null };
}

// ---------------------------------------------------------------------------
// Application form ("fill out and finish")
// ---------------------------------------------------------------------------

const formAnswersSchema = z.record(z.string(), z.string().max(4000));

export interface SaveFormResult {
  ok: boolean;
  error?: string;
}

/** Persist the guided form answers for an application. */
export async function saveApplicationForm(
  applicationId: string,
  answers: Record<string, string>,
): Promise<SaveFormResult> {
  const user = await requireUser();
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) return { ok: false, error: "Application not found." };

  const parsed = formAnswersSchema.safeParse(answers);
  if (!parsed.success) return { ok: false, error: "One or more answers are too long." };

  try {
    await prisma.application.update({
      where: { id: applicationId },
      data: { formAnswers: JSON.stringify(parsed.data) },
    });
    await recomputeCompletion(applicationId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save the form." };
  }

  revalidatePath(`/applications/${applicationId}`);
  return { ok: true };
}

export interface ApplicationFormData {
  answers: Record<string, string>;
  profile: ProfileFacts | null;
  opportunity: {
    title: string;
    description: string;
    providerName: string;
    applicationUrl: string | null;
    requiredDocuments: string[];
    stages: { name: string; description: string; order: number }[];
  };
}

/** Load the form answers plus the grounded profile and opportunity data. */
export async function getApplicationForm(applicationId: string): Promise<ApplicationFormData> {
  const user = await requireUser();
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
    include: { opportunity: { include: { provider: { select: { organization: true } } } } },
  });
  if (!app) throw new Error("Application not found.");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  return {
    answers: jparse<Record<string, string>>(app.formAnswers, {}),
    profile: profile ? profileFacts(user.name, profile) : null,
    opportunity: {
      title: app.opportunity.title,
      description: app.opportunity.description,
      providerName: app.opportunity.provider.organization,
      applicationUrl: app.opportunity.applicationUrl,
      requiredDocuments: jparse<string[]>(app.opportunity.requiredDocuments, []),
      stages: jparse(app.opportunity.stages, []),
    },
  };
}

export interface DraftResult {
  ok: boolean;
  text?: string;
  error?: string;
}

/** Draft a grounded answer for a form field from the user's own data. */
export async function draftApplicationForm(
  applicationId: string,
  field: "proposal" | "personalStatement",
): Promise<DraftResult> {
  const user = await requireUser();
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
    include: { opportunity: true },
  });
  if (!app) return { ok: false, error: "Application not found." };

  try {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

    if (field === "proposal") {
      const description =
        app.notes?.trim() || profile?.bio?.trim() || app.opportunity.description;
      const text = await ai.suggestOutline({ title: app.opportunity.title, description });
      return { ok: true, text };
    }

    if (!profile) {
      return {
        ok: true,
        text: "Complete your profile first so Koru can draft a personal statement grounded in your details.",
      };
    }

    const text = buildPersonalStatement(profileFacts(user.name, profile));
    if (!text.trim()) {
      return {
        ok: true,
        text: "Add a few details to your profile so Koru can draft a personal statement from your facts.",
      };
    }
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not draft the answer." };
  }
}
