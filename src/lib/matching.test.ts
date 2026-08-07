import { describe, expect, it } from "vitest";
import { assessFit } from "@/lib/matching";
import type { EligibilityResult, OpportunityCategory } from "@/lib/types";

const eligible: EligibilityResult = {
  satisfied: 3,
  total: 3,
  requiredSatisfied: 2,
  requiredTotal: 2,
  eligible: true,
  results: [],
};

const partial: EligibilityResult = {
  satisfied: 1,
  total: 2,
  requiredSatisfied: 1,
  requiredTotal: 2,
  eligible: false,
  results: [],
};

describe("assessFit", () => {
  it("scores a full-eligibility + interest match high", () => {
    const fit = assessFit("startup-funding" as OpportunityCategory, ["startup"], eligible, "medium");
    expect(fit.fitScore).toBeGreaterThanOrEqual(90);
    expect(fit.likelihood).toBe(100);
  });

  it("applies a difficulty penalty for hard programs", () => {
    const easy = assessFit("scholarship" as OpportunityCategory, ["study"], eligible, "easy");
    const hard = assessFit("scholarship" as OpportunityCategory, ["study"], eligible, "hard");
    expect(easy.fitScore).toBeGreaterThan(hard.fitScore);
  });

  it("neutral interest score when no interests expressed", () => {
    const fit = assessFit("scholarship" as OpportunityCategory, [], eligible, "easy");
    expect(fit.fitScore).toBeGreaterThanOrEqual(50);
    expect(fit.reasons.some((r) => r.includes("interests"))).toBe(true);
  });

  it("scores a mismatch with no interest low but non-negative", () => {
    const fit = assessFit("climate-grant" as OpportunityCategory, ["job"], partial, "hard");
    expect(fit.fitScore).toBeGreaterThanOrEqual(0);
    expect(fit.fitScore).toBeLessThan(50);
  });

  it("reports reasons", () => {
    const fit = assessFit("research-grant" as OpportunityCategory, ["research"], partial, "medium");
    expect(fit.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
