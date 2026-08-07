"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { evaluateEligibility } from "@/lib/eligibility";
import { jparse } from "@/lib/json";
import { profileLike, serializeOpportunity, serializeRule } from "@/server/serializers";
import * as ai from "@/lib/ai";

export interface AiResult {
  ok: boolean;
  text?: string;
  error?: string;
}

async function profileFor(userId: string) {
  const p = await prisma.profile.findUnique({ where: { userId } });
  return p ? profileLike(p) : null;
}

/** Explain the eligibility assessment for an opportunity, grounded in rules + profile. */
export async function aiExplainEligibility(opportunityId: string): Promise<AiResult> {
  const user = await requireUser();
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) return { ok: false, error: "Opportunity not found." };
    const rules = await prisma.eligibilityRule.findMany({ where: { opportunityId } });
    const profile = await profileFor(user.id);
    if (!profile) {
      return { ok: false, error: "Complete your profile first so Koru can assess your eligibility." };
    }
    const result = evaluateEligibility(profile, rules.map(serializeRule));
    const text = await ai.explainEligibility(result);
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}

/** Generate a step-by-step checklist from the opportunity's official requirements. */
export async function aiChecklist(opportunityId: string): Promise<AiResult> {
  await requireUser();
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { provider: { select: { organization: true, verified: true } } },
    });
    if (!opp) return { ok: false, error: "Opportunity not found." };
    const dto = serializeOpportunity(opp);
    const text = await ai.generateChecklist({
      title: dto.title,
      requiredDocuments: dto.requiredDocuments,
      stages: dto.stages.map((s) => ({ name: s.name, description: s.description })),
    });
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}

/** Answer a question using only official FAQ + requirements data. */
export async function aiAsk(opportunityId: string, question: string): Promise<AiResult> {
  await requireUser();
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) return { ok: false, error: "Opportunity not found." };
    if (question.trim().length < 3) return { ok: false, error: "Ask a real question." };
    const text = await ai.answerQuestion(question.trim(), {
      faq: jparse(opp.faq, []),
      requiredDocuments: jparse<string[]>(opp.requiredDocuments, []),
    });
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}

/** Suggest a proposal outline for an application (uses notes as project context). */
export async function aiOutline(applicationId: string, context: string): Promise<AiResult> {
  const user = await requireUser();
  try {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
      include: { opportunity: { include: { provider: { select: { organization: true, verified: true } } } } },
    });
    if (!app) return { ok: false, error: "Application not found." };
    const dto = serializeOpportunity(app.opportunity);
    const description = context.trim() || app.notes || dto.description;
    const text = await ai.suggestOutline({ title: dto.title, description });
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}

/** Rewrite a draft (facts preserved). */
export async function aiRewrite(text: string): Promise<AiResult> {
  await requireUser();
  try {
    if (text.trim().length < 20) return { ok: false, error: "Paste at least a short paragraph to rewrite." };
    const rewritten = await ai.rewriteText(text);
    return { ok: true, text: rewritten };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}
