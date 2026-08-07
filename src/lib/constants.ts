import type { OpportunityCategory } from "@/lib/types";

export const APP_NAME = "Koru";
export const APP_TAGLINE = "The Funding Copilot for Fiji";

export const FIJI_CITIES = [
  "Suva",
  "Lautoka",
  "Nadi",
  "Labasa",
  "Ba",
  "Sigatoka",
  "Nausori",
  "Levuka",
  "Savusavu",
  "Rakiraki",
  "Tavua",
  "Nabouwalu",
  "Vunidawa",
  "Nasinu",
  "Lami",
] as const;

export const EDUCATION_LEVELS = [
  "Secondary",
  "Certificate",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
] as const;

export const EMPLOYMENT_STATUSES = [
  "Student",
  "Employed",
  "Self-employed",
  "Unemployed",
  "Other",
] as const;

export const ORGANIZATION_TYPES = [
  "Individual",
  "Startup",
  "SME",
  "NGO",
  "Community group",
  "Government",
  "Academic",
  "Other",
] as const;

export const BUSINESS_STAGES = ["Idea", "Early stage", "Growth", "Established", "N/A"] as const;

export const SECTORS = [
  "Agriculture",
  "Fisheries",
  "Tourism",
  "ICT / Technology",
  "Manufacturing",
  "Construction",
  "Education",
  "Health",
  "Finance",
  "Climate & Environment",
  "Renewable Energy",
  "Waste Management",
  "Water & Sanitation",
  "Creative Industries",
  "Transport",
  "Retail & Trade",
  "Community Development",
  "Research",
] as const;

export const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "cv", label: "CV / Résumé" },
  { value: "passport", label: "Passport" },
  { value: "transcript", label: "Academic transcript" },
  { value: "certificate", label: "Certificate" },
  { value: "proposal", label: "Proposal" },
  { value: "budget", label: "Budget template" },
  { value: "business-registration", label: "Business registration" },
  { value: "tax-certificate", label: "Tax certificate (TIN)" },
  { value: "bank-statement", label: "Bank statement" },
  { value: "recommendation", label: "Recommendation letter" },
  { value: "id", label: "National ID" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d.label]),
);

/** Map opportunity category -> profile "funding interests" keywords used by smart matching. */
export const CATEGORY_INTEREST_KEYWORDS: Record<OpportunityCategory, string[]> = {
  "startup-funding": ["startup", "business", "entrepreneur", "venture", "sme"],
  "climate-grant": ["climate", "environment", "sustainability", "green", "renewable"],
  "research-grant": ["research", "study", "academic", "science"],
  "travel-grant": ["travel", "conference", "exchange", "study-abroad"],
  scholarship: ["scholarship", "study", "tuition", "education"],
  fellowship: ["fellowship", "leadership", "development"],
  competition: ["competition", "innovation", "pitch", "awards"],
  "business-support": ["business", "mentorship", "incubator", "accelerator", "training"],
  "community-grant": ["community", "ngo", "youth", "village", "social"],
  job: ["job", "career", "employment", "work"],
  "professional-development": ["training", "course", "skills", "capacity"],
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "ready-to-submit": "Ready to submit",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  document: "Document",
  proposal: "Proposal",
  budget: "Budget",
  logistics: "Logistics",
  other: "Other",
};

export const REMINDER_OFFSET_DAYS = [14, 7, 3, 1] as const;

export const SESSION_COOKIE = "koru_session";
export const SESSION_MAX_AGE_DAYS = 30;

export const SOURCE_TYPES: { value: string; label: string }[] = [
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
  { value: "university", label: "University" },
  { value: "international", label: "International organization" },
  { value: "regional", label: "Regional organization" },
  { value: "private", label: "Private foundation" },
];

export const SYNC_ADAPTERS: { value: string; label: string }[] = [
  { value: "sample", label: "Sample dataset (offline demo)" },
  { value: "url", label: "URL fetch + AI extraction" },
];
