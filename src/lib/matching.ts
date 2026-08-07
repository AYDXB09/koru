import type { OpportunityCategory, EligibilityResult } from "@/lib/types";
import { CATEGORY_INTEREST_KEYWORDS } from "@/lib/constants";

/**
 * Smart matching: turns eligibility + interest signals into a 0-100 fit score
 * and an estimated likelihood of eligibility. Deterministic and traceable.
 */

export interface FitAssessment {
  /** 0-100 how well this opportunity fits the user. */
  fitScore: number;
  /** 0-100 likelihood the user satisfies eligibility. */
  likelihood: number;
  eligibility: EligibilityResult;
  reasons: string[];
}

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

function interestMatch(category: OpportunityCategory, interests: string[]): boolean {
  const keywords = CATEGORY_INTEREST_KEYWORDS[category] ?? [];
  const normalizedInterests = interests.map(normalize);
  return keywords.some((kw) =>
    normalizedInterests.some((interest) => interest.includes(normalize(kw))),
  );
}

/**
 * @param category opportunity category
 * @param interests user's fundingInterests (may be empty)
 * @returns 1 if matched, 0 if not, 0.5 when the user has expressed no interests
 */
function interestScore(category: OpportunityCategory, interests: string[]): number {
  if (interests.length === 0) return 0.5;
  return interestMatch(category, interests) ? 1 : 0;
}

export function assessFit(
  category: OpportunityCategory,
  interests: string[],
  eligibility: EligibilityResult,
  difficulty: string,
): FitAssessment {
  const reasons: string[] = [];

  const eligibilityRatio =
    eligibility.requiredTotal > 0
      ? eligibility.requiredSatisfied / eligibility.requiredTotal
      : eligibility.satisfied / Math.max(1, eligibility.total);

  reasons.push(`You satisfy ${eligibility.requiredSatisfied} of ${eligibility.requiredTotal} required eligibility criteria.`);

  const intScore = interestScore(category, interests);
  if (interests.length === 0) {
    reasons.push("Add your funding interests to your profile for a sharper match.");
  } else if (intScore === 1) {
    reasons.push(`This matches an interest you selected (${category.replace(/-/g, " ")}).`);
  } else {
    reasons.push("This does not closely match your selected funding interests.");
  }

  const fitScore = Math.round(100 * (0.7 * eligibilityRatio + 0.3 * intScore));
  const likelihood = Math.round(100 * eligibilityRatio);

  const difficultyPenalty = difficulty === "hard" ? 0.05 : difficulty === "easy" ? 0 : 0.03;
  const adjustedFit = Math.max(0, Math.min(100, fitScore - difficultyPenalty * 100));

  return {
    fitScore: Math.round(adjustedFit),
    likelihood,
    eligibility,
    reasons,
  };
}
