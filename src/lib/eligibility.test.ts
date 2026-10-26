import { describe, expect, it } from "vitest";
import { evaluateEligibility, evaluateRule } from "@/lib/eligibility";
import type { EligibilityRuleDto, ProfileLike } from "@/lib/types";

function rule(partial: Partial<EligibilityRuleDto>): EligibilityRuleDto {
  return {
    id: "r1",
    field: "age",
    operator: "gte",
    value: 18,
    required: true,
    ...partial,
  };
}

const profile: ProfileLike = {
  age: 25,
  citizenship: "Fijian",
  city: "Suva",
  education: "Bachelor's",
  employmentStatus: "Self-employed",
  sector: "Agriculture",
  organizationType: "Startup",
  businessStage: "Early stage",
  yearsExperience: 3,
  fundingInterests: ["startup", "climate"],
  documentsAvailable: ["cv", "passport"],
};

describe("evaluateRule — numeric comparisons", () => {
  it("satisfies gte when above threshold", () => {
    const r = evaluateRule(profile, rule({ field: "age", operator: "gte", value: 18 }));
    expect(r.satisfied).toBe(true);
  });

  it("fails gte when below threshold", () => {
    const r = evaluateRule(profile, rule({ field: "age", operator: "gte", value: 30 }));
    expect(r.satisfied).toBe(false);
  });

  it("satisfies lte", () => {
    const r = evaluateRule(profile, rule({ field: "age", operator: "lte", value: 40 }));
    expect(r.satisfied).toBe(true);
  });

  it("reports missing numeric field", () => {
    const r = evaluateRule({}, rule({ field: "age", operator: "gte", value: 18 }));
    expect(r.satisfied).toBe(false);
    expect(r.detail).toContain("not set");
  });
});

describe("evaluateRule — education ordinal", () => {
  it("satisfies Bachelor's or higher", () => {
    const r = evaluateRule(profile, rule({ field: "education", operator: "gte", value: "Bachelor's" }));
    expect(r.satisfied).toBe(true);
  });

  it("satisfies higher education than required", () => {
    const r = evaluateRule(profile, rule({ field: "education", operator: "gte", value: "Diploma" }));
    expect(r.satisfied).toBe(true);
  });

  it("fails when education is below requirement", () => {
    const r = evaluateRule(profile, rule({ field: "education", operator: "gte", value: "Master's" }));
    expect(r.satisfied).toBe(false);
  });
});

describe("evaluateRule — string + list operators", () => {
  it("satisfies eq", () => {
    const r = evaluateRule(profile, rule({ field: "citizenship", operator: "eq", value: "Fijian" }));
    expect(r.satisfied).toBe(true);
  });

  it("satisfies in", () => {
    const r = evaluateRule(profile, rule({ field: "city", operator: "in", value: ["Nadi", "Suva"] }));
    expect(r.satisfied).toBe(true);
  });

  it("fails not", () => {
    const r = evaluateRule(profile, rule({ field: "city", operator: "not", value: ["Suva"] }));
    expect(r.satisfied).toBe(false);
  });

  it("satisfies has for array field", () => {
    const r = evaluateRule(profile, rule({ field: "fundingInterests", operator: "has", value: "startup" }));
    expect(r.satisfied).toBe(true);
  });

  it("satisfies hasAll when all present", () => {
    const r = evaluateRule(profile, rule({ field: "documentsAvailable", operator: "hasAll", value: ["cv", "passport"] }));
    expect(r.satisfied).toBe(true);
  });

  it("fails hasAll when missing an item", () => {
    const r = evaluateRule(profile, rule({ field: "documentsAvailable", operator: "hasAll", value: ["cv", "transcript"] }));
    expect(r.satisfied).toBe(false);
  });

  it("satisfies has for a scalar string field", () => {
    const r = evaluateRule(profile, rule({ field: "sector", operator: "has", value: ["Agriculture", "Tourism"] }));
    expect(r.satisfied).toBe(true);
  });

  it("fails has for a scalar string field with no match", () => {
    const r = evaluateRule(profile, rule({ field: "sector", operator: "has", value: ["Tourism"] }));
    expect(r.satisfied).toBe(false);
  });

  it("satisfies hasAll for a scalar string field", () => {
    const r = evaluateRule(profile, rule({ field: "organizationType", operator: "hasAll", value: "Startup" }));
    expect(r.satisfied).toBe(true);
  });

  it("satisfies in for employmentStatus", () => {
    const r = evaluateRule(profile, rule({ field: "employmentStatus", operator: "in", value: ["Student", "Employed", "Self-employed"] }));
    expect(r.satisfied).toBe(true);
  });

  it("reports employmentStatus missing when unset", () => {
    const r = evaluateRule({}, rule({ field: "employmentStatus", operator: "in", value: ["Student"] }));
    expect(r.satisfied).toBe(false);
  });
});

describe("evaluateEligibility", () => {
  it("aggregates required criteria", () => {
    const result = evaluateEligibility(profile, [
      rule({ id: "a", field: "age", operator: "gte", value: 18, required: true }),
      rule({ id: "b", field: "citizenship", operator: "eq", value: "Fijian", required: true }),
      rule({ id: "c", field: "sector", operator: "eq", value: "Tourism", required: false }),
    ]);
    expect(result.requiredSatisfied).toBe(2);
    expect(result.requiredTotal).toBe(2);
    expect(result.eligible).toBe(true);
    expect(result.satisfied).toBe(2);
    expect(result.total).toBe(3);
  });

  it("reports ineligible when a required rule fails", () => {
    const result = evaluateEligibility(profile, [
      rule({ id: "a", field: "age", operator: "gte", value: 40, required: true }),
    ]);
    expect(result.eligible).toBe(false);
  });

  it("handles empty rules as eligible with zero totals", () => {
    const result = evaluateEligibility(profile, []);
    expect(result.eligible).toBe(true);
    expect(result.total).toBe(0);
  });
});

// Citizenship, city and similar fields are typed by the user, so rules must
// not depend on their capitalisation or stray spaces (a phone keyboard often
// appends a trailing space). Regression tests for a bug where "fijian" and
// "Fijian " failed the "Fijian citizen" rule on every opportunity that uses it.
describe("evaluateRule — free-text normalisation", () => {
  const citizen = rule({ field: "citizenship", operator: "eq", value: "Fijian" });

  it.each(["Fijian", "fijian", "FIJIAN", "Fijian ", "  Fijian", "fijian "])(
    "eq accepts %j",
    (citizenship) => {
      expect(evaluateRule({ ...profile, citizenship }, citizen).satisfied).toBe(true);
    },
  );

  it.each(["Samoan", "Fiji", "Fijian citizen", "Fijiann"])("eq still rejects %j", (citizenship) => {
    expect(evaluateRule({ ...profile, citizenship }, citizen).satisfied).toBe(false);
  });

  it("neq is normalised the same way", () => {
    const notFijian = rule({ field: "citizenship", operator: "neq", value: "Fijian" });
    expect(evaluateRule({ ...profile, citizenship: " fijian" }, notFijian).satisfied).toBe(false);
    expect(evaluateRule({ ...profile, citizenship: "Samoan" }, notFijian).satisfied).toBe(true);
  });

  it("in and not ignore case and surrounding whitespace", () => {
    const inRule = rule({ field: "employmentStatus", operator: "in", value: ["Student"] });
    expect(evaluateRule({ ...profile, employmentStatus: "student " }, inRule).satisfied).toBe(true);
    const notRule = rule({ field: "employmentStatus", operator: "not", value: ["Student"] });
    expect(evaluateRule({ ...profile, employmentStatus: " STUDENT" }, notRule).satisfied).toBe(false);
  });

  it("has matches a keyword inside a longer interest, ignoring case", () => {
    const climate = rule({ field: "fundingInterests", operator: "has", value: ["environment"] });
    const result = evaluateRule({ ...profile, fundingInterests: ["Environmental research"] }, climate);
    expect(result.satisfied).toBe(true);
  });

  it("has ignores an empty keyword instead of matching everything", () => {
    const blank = rule({ field: "fundingInterests", operator: "has", value: ["", "  "] });
    expect(evaluateRule(profile, blank).satisfied).toBe(false);
  });

  it("hasAll ignores case and whitespace in documents", () => {
    const docs = rule({ field: "documentsAvailable", operator: "hasAll", value: ["CV", "Passport"] });
    expect(evaluateRule({ ...profile, documentsAvailable: [" cv", "PASSPORT "] }, docs).satisfied).toBe(true);
  });

  it("treats a whitespace-only value as not set", () => {
    const result = evaluateRule({ ...profile, citizenship: "   " }, citizen);
    expect(result.satisfied).toBe(false);
    expect(result.detail).toMatch(/not set/i);
  });
});
