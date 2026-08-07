import type { OpportunityDto } from "@/lib/types";

/**
 * Turns an opportunity into an executable plan: a default checklist of tasks
 * derived from required documents, application stages, and logistics.
 * Deterministic — used when an application workspace is created.
 */

export interface PlannedTask {
  title: string;
  description: string;
  category: "document" | "proposal" | "budget" | "logistics" | "other";
  sortOrder: number;
}

export function buildTaskPlan(opportunity: OpportunityDto): PlannedTask[] {
  const tasks: PlannedTask[] = [];
  let order = 0;

  const push = (
    title: string,
    description: string,
    category: PlannedTask["category"],
  ) => {
    tasks.push({ title, description, category, sortOrder: order++ });
  };

  // Stages from the opportunity definition.
  if (opportunity.stages.length > 0) {
    for (const stage of [...opportunity.stages].sort((a, b) => a.order - b.order)) {
      push(
        `Complete stage: ${stage.name}`,
        stage.description || `Work through the "${stage.name}" stage of the application.`,
        "other",
      );
    }
  }

  // Documents required by the opportunity.
  for (const doc of opportunity.requiredDocuments) {
    push(`Upload: ${doc}`, `Prepare and upload your ${doc.toLowerCase()} for this application.`, "document");
  }

  // Proposal for funding/research/grant type opportunities.
  if (
    ["startup-funding", "research-grant", "climate-grant", "community-grant", "business-support"].includes(
      opportunity.category,
    )
  ) {
    push(
      "Draft your proposal",
      "Use the AI assistant to outline your proposal, then write the full version.",
      "proposal",
    );
    push(
      "Prepare a budget",
      "Itemise the funding you need with a simple budget breakdown (FJD).",
      "budget",
    );
  }

  // Logistics around submission.
  if (opportunity.applicationUrl) {
    push("Review application portal", "Open the official application portal and confirm every field required.", "logistics");
  }
  push("Final review before submitting", "Re-check every requirement and document before you submit.", "logistics");

  return tasks;
}

/** Estimated completion days based on planned tasks and a simple 45-min per task assumption. */
export function estimateDays(tasks: PlannedTask[]): number {
  const totalMinutes = tasks.reduce((sum) => sum + 45, 0);
  return Math.max(1, Math.ceil(totalMinutes / 90)); // ~1.5h effective per day
}

export function estimateChance(doneMinutes: number, totalMinutes: number): number {
  if (totalMinutes <= 0) return 0;
  return Math.min(99, Math.max(5, Math.round((doneMinutes / totalMinutes) * 95)));
}
