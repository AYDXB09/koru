import type {
  OpportunityDto,
  OpportunityStage,
  FaqItem,
  EligibilityRuleDto,
  TaskDto,
  DocumentDto,
} from "@/lib/types";
import { jparse } from "@/lib/json";
import type { ProfileFacts } from "@/lib/smartfill";
import type { Opportunity, EligibilityRule, Task, Document, Profile } from "@/generated/prisma/client";

export function serializeOpportunity(opp: Opportunity & { provider: { organization: string; verified: boolean } }): OpportunityDto {
  return {
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    providerId: opp.providerId,
    providerName: opp.provider.organization,
    providerVerified: opp.provider.verified,
    category: opp.category as OpportunityDto["category"],
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
    stages: jparse<OpportunityStage[]>(opp.stages, []),
    faq: jparse<FaqItem[]>(opp.faq, []),
    sourceUrl: opp.sourceUrl,
    lastVerifiedAt: opp.lastVerifiedAt,
  };
}

export function serializeRule(rule: EligibilityRule): EligibilityRuleDto {
  return {
    id: rule.id,
    field: rule.field as EligibilityRuleDto["field"],
    operator: rule.operator as EligibilityRuleDto["operator"],
    value: jparse(rule.value, ""),
    required: rule.required,
    label: rule.label,
  };
}

export function serializeTask(task: Task): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    completed: task.completed,
    completedAt: task.completedAt,
    dueDate: task.dueDate,
    priority: task.priority,
    sortOrder: task.sortOrder,
  };
}

export function serializeDocument(doc: Document): DocumentDto {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.type,
    url: doc.url,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    verified: doc.verified,
    isReusable: doc.isReusable,
    applicationId: doc.applicationId,
    createdAt: doc.createdAt,
  };
}

/** Full profile → ProfileFacts shape for the application form. */
export function profileFacts(name: string, profile: Profile): ProfileFacts {
  return {
    name,
    age: profile.age,
    city: profile.city,
    education: profile.education,
    employmentStatus: profile.employmentStatus,
    sector: profile.sector,
    languages: jparse<string[]>(profile.languages, []),
    fundingInterests: jparse<string[]>(profile.fundingInterests, []),
    bio: profile.bio,
  };
}

/** Full profile → ProfileLike shape for the eligibility engine. */
export function profileLike(profile: {
  age: number | null;
  citizenship: string | null;
  city: string | null;
  education: string | null;
  sector: string | null;
  organizationType: string | null;
  businessStage: string | null;
  yearsExperience: number | null;
  fundingInterests: string;
  languages: string;
  documentsAvailable: string;
}) {
  return {
    age: profile.age,
    citizenship: profile.citizenship,
    city: profile.city,
    education: profile.education,
    sector: profile.sector,
    organizationType: profile.organizationType,
    businessStage: profile.businessStage,
    yearsExperience: profile.yearsExperience,
    fundingInterests: jparse<string[]>(profile.fundingInterests, []),
    languages: jparse<string[]>(profile.languages, []),
    documentsAvailable: jparse<string[]>(profile.documentsAvailable, []),
  };
}
