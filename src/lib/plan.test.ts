import { describe, expect, it } from "vitest";
import { buildTaskPlan, estimateDays, estimateChance } from "@/lib/plan";
import type { OpportunityDto } from "@/lib/types";

function opp(partial: Partial<OpportunityDto> = {}): OpportunityDto {
  return {
    id: "o1",
    slug: "test-opp",
    title: "Test Opportunity",
    providerId: "p1",
    providerName: "Test Provider",
    providerVerified: true,
    category: "startup-funding",
    deadline: new Date("2026-12-31"),
    isRolling: false,
    countryScope: "Fiji",
    description: "A test opportunity.",
    officialUrl: "https://example.com",
    applicationUrl: "https://example.com/apply",
    fundingAmount: "FJD 10,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 10000,
    status: "published",
    verificationLevel: "official",
    estimatedHours: 10,
    difficulty: "medium",
    ageMin: 18,
    ageMax: 40,
    requiredDocuments: [],
    stages: [],
    faq: [],
    sourceUrl: null,
    lastVerifiedAt: null,
    ...partial,
  };
}

describe("buildTaskPlan", () => {
  it("creates stages in order", () => {
    const plan = buildTaskPlan(
      opp({
        stages: [
          { name: "B", description: "", order: 2 },
          { name: "A", description: "", order: 1 },
        ],
      }),
    );
    expect(plan[0].title).toContain("A");
    expect(plan[1].title).toContain("B");
  });

  it("creates a document task per required document", () => {
    const plan = buildTaskPlan(opp({ requiredDocuments: ["CV", "Passport"] }));
    const docTasks = plan.filter((t) => t.category === "document");
    expect(docTasks).toHaveLength(2);
    expect(docTasks[0].title).toContain("CV");
  });

  it("adds proposal + budget for funding categories", () => {
    const plan = buildTaskPlan(opp({ category: "startup-funding" }));
    expect(plan.some((t) => t.category === "proposal")).toBe(true);
    expect(plan.some((t) => t.category === "budget")).toBe(true);
  });

  it("skips proposal + budget for scholarships", () => {
    const plan = buildTaskPlan(opp({ category: "scholarship" }));
    expect(plan.some((t) => t.category === "proposal")).toBe(false);
    expect(plan.some((t) => t.category === "budget")).toBe(false);
  });

  it("always ends with a final review task", () => {
    const plan = buildTaskPlan(opp());
    expect(plan[plan.length - 1].title).toContain("Final review");
  });

  it("assigns sequential sortOrder", () => {
    const plan = buildTaskPlan(opp({ stages: [{ name: "S", description: "", order: 1 }] }));
    plan.forEach((t, i) => expect(t.sortOrder).toBe(i));
  });
});

describe("estimateDays", () => {
  it("estimates at least one day", () => {
    expect(estimateDays([])).toBe(1);
  });

  it("scales with task count", () => {
    const one = estimateDays([{ title: "t", description: "", category: "other", sortOrder: 0 }]);
    const ten = estimateDays(
      Array.from({ length: 10 }, (_, i) => ({ title: `t${i}`, description: "", category: "other", sortOrder: i })),
    );
    expect(ten).toBeGreaterThan(one);
  });
});

describe("estimateChance", () => {
  it("returns 0 for zero total", () => {
    expect(estimateChance(0, 0)).toBe(0);
  });

  it("returns ~95 when complete", () => {
    expect(estimateChance(100, 100)).toBe(95);
  });

  it("returns a floor of 5", () => {
    expect(estimateChance(0, 100)).toBe(5);
  });
});
