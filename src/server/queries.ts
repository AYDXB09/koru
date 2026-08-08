import { prisma } from "@/lib/db";
import { serializeOpportunity, serializeRule, serializeTask, serializeDocument, profileLike } from "@/server/serializers";
import { jparse } from "@/lib/json";
import { classifyUrgency, daysUntil } from "@/lib/deadlines";
import { evaluateEligibility } from "@/lib/eligibility";
import { assessFit } from "@/lib/matching";
import type { EligibilityRuleDto, OpportunityDto } from "@/lib/types";

export async function listPublishedOpportunities() {
  const rows = await prisma.opportunity.findMany({
    where: { status: "published" },
    include: { provider: { select: { organization: true, verified: true } } },
    orderBy: [{ isRolling: "asc" }, { deadline: "asc" }],
  });
  return rows.map(serializeOpportunity);
}

/** Live catalogue stats for the landing page (no fabricated numbers). */
export async function getLandingStats() {
  const [total, providers, rolling, closingSoon, byCategory] = await Promise.all([
    prisma.opportunity.count({ where: { status: "published" } }),
    prisma.provider.count(),
    prisma.opportunity.count({ where: { status: "published", isRolling: true } }),
    prisma.opportunity.count({
      where: {
        status: "published",
        isRolling: false,
        deadline: { not: null, gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { _all: true },
    }),
  ]);
  return { total, providers, rolling, closingSoon, byCategory };
}

/**
 * The next real dated deadlines across the index, for the landing ledger.
 * Rolling opportunities ride along at the tail so the panel reads like a
 * mixed market board rather than a countdown list.
 */
export async function getLandingLedger(limit = 4) {
  const dated = await prisma.opportunity.findMany({
    where: { status: "published", isRolling: false, deadline: { not: null, gte: new Date() } },
    include: { provider: { select: { organization: true, verified: true } } },
    orderBy: { deadline: "asc" },
    take: limit,
  });
  const rolling = await prisma.opportunity.findMany({
    where: { status: "published", isRolling: true },
    include: { provider: { select: { organization: true, verified: true } } },
    orderBy: { updatedAt: "desc" },
    take: 2,
  });
  const rows = [...dated, ...rolling];
  return rows.map((o) => {
    const opp = serializeOpportunity(o);
    return {
      ...opp,
      daysLeft: opp.deadline ? daysUntil(opp.deadline) : null,
      providerName: o.provider.organization,
    };
  });
}

/** Closing-soon strip for the dashboard: upcoming deadlines not yet on the user's plan. */
export async function getClosingSoon(userId: string, limit = 5) {
  const taken = await prisma.application.findMany({
    where: { userId },
    select: { opportunityId: true },
  });
  const rows = await prisma.opportunity.findMany({
    where: {
      status: "published",
      isRolling: false,
      deadline: { not: null, gte: new Date() },
      id: { notIn: taken.map((t) => t.opportunityId) },
    },
    include: { provider: { select: { organization: true, verified: true } } },
    orderBy: { deadline: "asc" },
    take: limit,
  });
  return rows.map((o) => {
    const opp = serializeOpportunity(o);
    return {
      ...opp,
      daysLeft: opp.deadline ? daysUntil(opp.deadline) : null,
      providerName: o.provider.organization,
    };
  });
}

export async function getOpportunityBySlug(slug: string) {
  const row = await prisma.opportunity.findUnique({
    where: { slug },
    include: { provider: { select: { organization: true, verified: true } } },
  });
  return row ? serializeOpportunity(row) : null;
}

export async function getOpportunityRules(opportunityId: string): Promise<EligibilityRuleDto[]> {
  const rules = await prisma.eligibilityRule.findMany({
    where: { opportunityId },
    orderBy: { required: "desc" },
  });
  return rules.map(serializeRule);
}

export function getUserProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function getDashboardData(userId: string) {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      opportunity: { include: { provider: { select: { organization: true, verified: true } } } },
      tasks: true,
      _count: { select: { documents: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const apps = applications.map((app) => {
    const opportunity = serializeOpportunity(app.opportunity);
    const total = app.tasks.length;
    const done = app.tasks.filter((t) => t.completed).length;
    return {
      id: app.id,
      status: app.status,
      completion: app.completion,
      notes: app.notes,
      startedAt: app.startedAt,
      submittedAt: app.submittedAt,
      updatedAt: app.updatedAt,
      opportunity,
      deadline: opportunity.deadline,
      deadlineUrgency: classifyUrgency(opportunity.deadline),
      daysLeft: opportunity.deadline ? daysUntil(opportunity.deadline) : null,
      taskCounts: { total, done },
      documentCount: app._count.documents,
    };
  });

  const activeApps = apps.filter((a) => !["submitted", "accepted", "rejected", "withdrawn"].includes(a.status));
  const upcomingDeadlines = apps
    .filter((a) => a.deadline && daysUntil(a.deadline) >= 0)
    .sort((a, b) => (a.deadline!.getTime() - b.deadline!.getTime()))
    .slice(0, 5);

  const todayTasks = await prisma.task.findMany({
    where: { application: { userId }, completed: false },
    include: { application: { include: { opportunity: true } } },
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
    take: 10,
  });

  return { apps, activeApps, upcomingDeadlines, todayTasks };
}

export async function getApplicationDetail(applicationId: string, userId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      opportunity: {
        include: { provider: { select: { organization: true, verified: true } }, eligibilityRules: true },
      },
      tasks: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!app) return null;

  return {
    ...app,
    opportunity: serializeOpportunity(app.opportunity),
    rules: app.opportunity.eligibilityRules.map(serializeRule),
    tasks: app.tasks.map(serializeTask),
    documents: app.documents.map(serializeDocument),
  };
}

export async function getUserDocuments(userId: string) {
  const docs = await prisma.document.findMany({
    where: { userId, applicationId: null },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(serializeDocument);
}

export async function getApplicationDocuments(applicationId: string, userId: string) {
  const docs = await prisma.document.findMany({
    where: { applicationId, userId },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(serializeDocument);
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export function profileForEngine(userId: string) {
  return prisma.profile.findUnique({ where: { userId } }).then((p) => (p ? profileLike(p) : null));
}

export async function getAdminOverview() {
  const [opportunities, providers, sources, logs, users, applications] = await Promise.all([
    prisma.opportunity.findMany({ include: { provider: { select: { organization: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.provider.findMany({ orderBy: { organization: "asc" } }),
    prisma.ingestionSource.findMany({ include: { logs: { orderBy: { startedAt: "desc" }, take: 3 } } }),
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.user.count(),
    prisma.application.count(),
  ]);
  return { opportunities, providers, sources, logs, users, applications };
}

export async function getOpportunityForAdmin(id: string) {
  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: { provider: { select: { organization: true } }, eligibilityRules: true },
  });
  if (!opp) return null;
  return { ...opp, rules: opp.eligibilityRules.map(serializeRule) };
}

export function allFundingInterests() {
  return [
    "startup",
    "business",
    "climate",
    "environment",
    "research",
    "travel",
    "scholarship",
    "study",
    "leadership",
    "community",
    "training",
    "job",
    "innovation",
  ];
}

export type FittedOpportunity = OpportunityDto & {
  fitScore: number;
  likelihood: number;
  eligible: boolean;
};

/** Published opportunities ranked by fit against the user's profile. */
export async function getOpportunityFits(userId: string): Promise<FittedOpportunity[]> {
  const profile = await profileForEngine(userId);
  const opportunities = await listPublishedOpportunities();

  const rulesByOpp = new Map<string, EligibilityRuleDto[]>();
  if (profile) {
    const allRules = await prisma.eligibilityRule.findMany({
      where: { opportunityId: { in: opportunities.map((o) => o.id) } },
    });
    for (const r of allRules) {
      const list = rulesByOpp.get(r.opportunityId) ?? [];
      list.push(serializeRule(r));
      rulesByOpp.set(r.opportunityId, list);
    }
  }

  return opportunities
    .map((opp) => {
      const rules = rulesByOpp.get(opp.id) ?? [];
      const eligibility = profile
        ? evaluateEligibility(profile, rules)
        : { satisfied: 0, total: rules.length, requiredSatisfied: 0, requiredTotal: rules.filter((r) => r.required).length, eligible: false, results: [] };
      const fit = assessFit(
        opp.category,
        profile?.fundingInterests ?? [],
        eligibility,
        opp.difficulty,
      );
      return {
        ...opp,
        fitScore: fit.fitScore,
        likelihood: fit.likelihood,
        eligible: eligibility.eligible,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

export { jparse };