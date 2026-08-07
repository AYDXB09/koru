import type {
  EligibilityField,
  EligibilityResult,
  EligibilityRuleDto,
  ProfileLike,
  RuleResult,
} from "@/lib/types";

/**
 * Pure eligibility engine.
 *
 * Evaluates an opportunity's eligibility rules against a user profile and
 * reports exactly which criteria are satisfied and which are missing. No AI is
 * involved — every outcome is deterministic and traceable to a rule.
 */

const EDUCATION_ORDINAL: Record<string, number> = {
  Secondary: 1,
  Certificate: 2,
  Diploma: 3,
  "Bachelor's": 4,
  "Master's": 5,
  PhD: 6,
  Other: 0,
};

function readField(profile: ProfileLike, field: EligibilityField): unknown {
  switch (field) {
    case "age":
      return profile.age ?? null;
    case "citizenship":
      return profile.citizenship ?? null;
    case "city":
      return profile.city ?? null;
    case "education":
      return profile.education ?? null;
    case "employmentStatus":
      return profile.employmentStatus ?? null;
    case "sector":
      return profile.sector ?? null;
    case "organizationType":
      return profile.organizationType ?? null;
    case "businessStage":
      return profile.businessStage ?? null;
    case "yearsExperience":
      return profile.yearsExperience ?? null;
    case "fundingInterests":
      return profile.fundingInterests ?? [];
    case "documentsAvailable":
      return profile.documentsAvailable ?? [];
    default:
      return null;
  }
}

/** Normalizes a scalar or array value into a list (for has/hasAll rules). */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "none";
    return value.join(", ");
  }
  if (value === null || value === undefined) return "not set";
  return String(value);
}

function fieldLabel(field: EligibilityField): string {
  switch (field) {
    case "age":
      return "Age";
    case "citizenship":
      return "Citizenship";
    case "city":
      return "Location (city)";
    case "education":
      return "Education";
    case "employmentStatus":
      return "Employment status";
    case "sector":
      return "Sector";
    case "organizationType":
      return "Organization type";
    case "businessStage":
      return "Business stage";
    case "yearsExperience":
      return "Years of experience";
    case "fundingInterests":
      return "Funding interests";
    case "documentsAvailable":
      return "Documents available";
    default:
      return field;
  }
}

function ruleDisplay(rule: EligibilityRuleDto): string {
  return rule.label ?? `${fieldLabel(rule.field)} ${rule.operator} ${displayValue(rule.value)}`;
}

/** Education-aware comparison: "Bachelor's or higher" via operator "gte". */
function compareEducation(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const a = EDUCATION_ORDINAL[actual] ?? 0;
  const b = EDUCATION_ORDINAL[expected] ?? 0;
  return a >= b;
}

export function evaluateRule(
  profile: ProfileLike,
  rule: EligibilityRuleDto,
): RuleResult {
  const actual = readField(profile, rule.field);
  const expected = rule.value;
  const base: Omit<RuleResult, "satisfied" | "detail"> = {
    ruleId: rule.id,
    field: rule.field,
    operator: rule.operator,
    value: rule.value,
    required: rule.required,
    label: rule.label,
  };

  const missing = actual === null || actual === undefined || actual === "";

  const describe = (satisfied: boolean, detail: string): RuleResult => ({
    ...base,
    satisfied,
    detail,
  });

  switch (rule.operator) {
    case "gte": {
      const expectedNum = typeof expected === "number" ? expected : NaN;
      const actualNum = typeof actual === "number" ? actual : NaN;
      if (rule.field === "education" && typeof expected === "string") {
        if (missing) return describe(false, "Your education level is not set on your profile.");
        const ok = compareEducation(String(actual), expected);
        return describe(ok, `${actual} (requires ${expected} or higher)`);
      }
      if (Number.isNaN(actualNum)) {
        return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      }
      const okGte = actualNum >= expectedNum;
      return describe(
        okGte,
        `${actualNum} (requires at least ${expectedNum})`,
      );
    }
    case "lte": {
      const expectedNum = typeof expected === "number" ? expected : NaN;
      const actualNum = typeof actual === "number" ? actual : NaN;
      if (Number.isNaN(actualNum)) {
        return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      }
      const okLte = actualNum <= expectedNum;
      return describe(okLte, `${actualNum} (requires at most ${expectedNum})`);
    }
    case "eq": {
      if (missing) return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      const ok = String(actual) === String(expected);
      return describe(ok, `${displayValue(actual)} (required: ${displayValue(expected)})`);
    }
    case "neq": {
      if (missing) return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      const ok = String(actual) !== String(expected);
      return describe(ok, `${displayValue(actual)} (must not be ${displayValue(expected)})`);
    }
    case "in": {
      const options = Array.isArray(expected) ? expected : [expected];
      if (missing) return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      const ok = options.some((opt) => String(actual).toLowerCase() === String(opt).toLowerCase());
      return describe(ok, `${displayValue(actual)} (required one of: ${displayValue(options)})`);
    }
    case "not": {
      const options = Array.isArray(expected) ? expected : [expected];
      if (missing) return describe(false, `${fieldLabel(rule.field)} is not set on your profile.`);
      const ok = !options.some((opt) => String(actual).toLowerCase() === String(opt).toLowerCase());
      return describe(ok, `${displayValue(actual)} (must not be one of: ${displayValue(options)})`);
    }
    case "has": {
      const list = toList(actual);
      const required = (Array.isArray(expected) ? expected : [expected]).map(String);
      const matched = list.filter((item) =>
        required.some((req) => String(item).toLowerCase().includes(req.toLowerCase())),
      );
      if (list.length === 0) {
        return describe(false, `Your ${fieldLabel(rule.field).toLowerCase()} is not set on your profile.`);
      }
      const ok = matched.length > 0;
      return describe(
        ok,
        ok
          ? `Matches: ${matched.join(", ")}`
          : `${displayValue(list)} — none match: ${required.join(", ")}`,
      );
    }
    case "hasAll": {
      const list = toList(actual);
      const required = (Array.isArray(expected) ? expected : [expected]).map(String);
      const missingItems = required.filter(
        (req) => !list.some((item) => String(item).toLowerCase() === String(req).toLowerCase()),
      );
      if (missingItems.length === 0) {
        return describe(true, `All required items available: ${required.join(", ")}`);
      }
      return describe(
        false,
        `Missing: ${missingItems.join(", ")}`,
      );
    }
    default:
      return describe(false, `Unsupported operator: ${rule.operator}`);
  }
}

export function evaluateEligibility(
  profile: ProfileLike,
  rules: EligibilityRuleDto[],
): EligibilityResult {
  const results = rules.map((rule) => evaluateRule(profile, rule));
  const required = results.filter((r) => r.required);
  const requiredSatisfied = required.filter((r) => r.satisfied).length;
  const satisfied = results.filter((r) => r.satisfied).length;

  return {
    satisfied,
    total: results.length,
    requiredSatisfied,
    requiredTotal: required.length,
    eligible: required.length > 0 ? requiredSatisfied === required.length : results.every((r) => r.satisfied),
    results,
  };
}

/** Human-readable list of the things the user is still missing. */
export function missingCriteria(result: EligibilityResult): RuleResult[] {
  return result.results.filter((r) => !r.satisfied);
}

export { ruleDisplay };
