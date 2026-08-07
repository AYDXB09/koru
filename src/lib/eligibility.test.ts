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
