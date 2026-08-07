/**
 * Shared domain types for Koru.
 * These mirror the persisted Prisma records but with JSON columns parsed.
 */

export type OpportunityCategory =
  | "startup-funding"
  | "climate-grant"
  | "research-grant"
  | "travel-grant"
  | "scholarship"
  | "fellowship"
  | "competition"
  | "business-support"
  | "community-grant"
  | "job"
  | "professional-development";

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  "startup-funding",
  "climate-grant",
  "research-grant",
  "travel-grant",
  "scholarship",
  "fellowship",
  "competition",
  "business-support",
  "community-grant",
  "job",
  "professional-development",
];

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  "startup-funding": "Startup Funding",
  "climate-grant": "Climate Grant",
  "research-grant": "Research Grant",
  "travel-grant": "Travel Grant",
  scholarship: "Scholarship",
  fellowship: "Fellowship",
  competition: "Competition",
  "business-support": "Business Support",
  "community-grant": "Community Grant",
  job: "Job",
  "professional-development": "Professional Development",
};

export interface OpportunityStage {
  name: string;
  description: string;
  order: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface OpportunityDto {
  id: string;
  slug: string;
  title: string;
  providerId: string;
  providerName: string;
  providerVerified: boolean;
  category: OpportunityCategory;
  deadline: Date | null;
  isRolling: boolean;
  countryScope: string;
  description: string;
  officialUrl: string | null;
  applicationUrl: string | null;
  fundingAmount: string | null;
  currency: string;
  amountLow: number | null;
  amountHigh: number | null;
  status: string;
  verificationLevel: string;
  estimatedHours: number;
  difficulty: string;
  ageMin: number | null;
  ageMax: number | null;
  requiredDocuments: string[];
  stages: OpportunityStage[];
  faq: FaqItem[];
  sourceUrl: string | null;
  lastVerifiedAt: Date | null;
}

export interface EligibilityRuleDto {
  id: string;
  field: EligibilityField;
  operator: RuleOperator;
  value: RuleValue;
  required: boolean;
  label?: string | null;
}

export type EligibilityField =
  | "age"
  | "citizenship"
  | "city"
  | "education"
  | "employmentStatus"
  | "sector"
  | "organizationType"
  | "businessStage"
  | "yearsExperience"
  | "fundingInterests"
  | "documentsAvailable";

export type RuleOperator = "gte" | "lte" | "eq" | "neq" | "in" | "not" | "has" | "hasAll";
export type RuleValue = number | string | string[];

/** The slice of the profile the eligibility + matching engines read. */
export interface ProfileLike {
  age?: number | null;
  citizenship?: string | null;
  city?: string | null;
  education?: string | null;
  employmentStatus?: string | null;
  sector?: string | null;
  organizationType?: string | null;
  businessStage?: string | null;
  yearsExperience?: number | null;
  fundingInterests?: string[];
  languages?: string[];
  documentsAvailable?: string[];
}

export interface RuleResult {
  ruleId: string;
  field: EligibilityField;
  operator: RuleOperator;
  value: RuleValue;
  required: boolean;
  label?: string | null;
  satisfied: boolean;
  detail: string;
}

export interface EligibilityResult {
  satisfied: number;
  total: number;
  requiredSatisfied: number;
  requiredTotal: number;
  eligible: boolean;
  results: RuleResult[];
}

export interface ApplicationDto {
  id: string;
  status: string;
  completion: number;
  notes: string | null;
  startedAt: Date;
  submittedAt: Date | null;
  updatedAt: Date;
  opportunity: OpportunityDto;
  taskCounts: { total: number; done: number };
  documentCount: number;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: boolean;
  completedAt: Date | null;
  dueDate: Date | null;
  priority: string;
  sortOrder: number;
}

export interface DocumentDto {
  id: string;
  name: string;
  type: string;
  url: string | null;
  fileType: string | null;
  fileSize: number | null;
  verified: boolean;
  isReusable: boolean;
  applicationId: string | null;
  createdAt: Date;
}
