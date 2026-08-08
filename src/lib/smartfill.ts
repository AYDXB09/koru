/**
 * Pure helpers for the "fill out and finish" application form.
 *
 * Kept free of IO and framework imports so they can be unit tested directly.
 */

export interface ProfileFacts {
  name?: string | null;
  age?: number | null;
  city?: string | null;
  education?: string | null;
  employmentStatus?: string | null;
  sector?: string | null;
  languages?: string[] | null;
  bio?: string | null;
  fundingInterests?: string[] | null;
}

/** The editable answer fields the form tracks. */
export const FORM_FIELDS = ["personalStatement", "proposal"] as const;

const EMPLOYMENT_SENTENCES: Record<string, string> = {
  Student: "I am a student.",
  Employed: "I am employed.",
  "Self-employed": "I am self-employed.",
  Unemployed: "I am currently unemployed.",
};

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Builds a short personal statement from profile facts only. Every sentence
 * is grounded in a field on the profile; nothing is ever invented.
 * Returns an empty string when no facts are available.
 */
export function buildPersonalStatement(facts: ProfileFacts): string {
  const sentences: string[] = [];

  if (facts.name?.trim()) sentences.push(`My name is ${facts.name.trim()}.`);
  if (facts.age != null) sentences.push(`I am ${facts.age} years old.`);
  if (facts.city?.trim()) sentences.push(`I live in ${facts.city.trim()}.`);
  if (facts.education?.trim()) sentences.push(`My highest level of education is ${facts.education.trim()}.`);
  if (facts.employmentStatus?.trim()) {
    const employment = EMPLOYMENT_SENTENCES[facts.employmentStatus.trim()];
    if (employment) sentences.push(employment);
  }
  if (facts.sector?.trim()) sentences.push(`I work in the ${facts.sector.trim()} sector.`);

  const languages = (facts.languages ?? []).map((l) => l.trim()).filter(Boolean);
  if (languages.length > 0) sentences.push(`I speak ${joinList(languages)}.`);

  const interests = (facts.fundingInterests ?? []).map((i) => i.trim()).filter(Boolean);
  if (interests.length > 0) sentences.push(`I am interested in funding for ${joinList(interests)}.`);

  if (facts.bio?.trim()) sentences.push(facts.bio.trim());

  return sentences.join(" ");
}

/**
 * Fraction of non-empty form fields, as a 0-100 percentage.
 * Whitespace-only values do not count as filled.
 */
export function formProgress(
  answers: Record<string, string>,
  fields: readonly string[] = FORM_FIELDS,
): number {
  if (fields.length === 0) return 100;
  const filled = fields.filter((field) => (answers[field] ?? "").trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Assembles the filled answers into a plain-text block ready to copy into an
 * official portal. Empty fields are skipped.
 */
export function buildCopyText(answers: Record<string, string>): string {
  const sections: string[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value && value.trim()) sections.push(`${label}\n${value.trim()}`);
  };
  add("PERSONAL STATEMENT", answers.personalStatement);
  add("PROPOSAL", answers.proposal);
  return sections.join("\n\n");
}
