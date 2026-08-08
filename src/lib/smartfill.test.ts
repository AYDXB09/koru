import { describe, expect, it } from "vitest";
import {
  buildPersonalStatement,
  buildCopyText,
  formProgress,
  FORM_FIELDS,
} from "@/lib/smartfill";
import type { ProfileFacts } from "@/lib/smartfill";

const fullFacts: ProfileFacts = {
  name: "Ana Naivalu",
  age: 24,
  city: "Suva",
  education: "Bachelor's",
  employmentStatus: "Student",
  sector: "Climate & Environment",
  languages: ["English", "iTaukei"],
  fundingInterests: ["climate", "scholarship"],
  bio: "I volunteer with a coastal clean-up group.",
};

describe("buildPersonalStatement", () => {
  it("is grounded in every supplied fact", () => {
    const text = buildPersonalStatement(fullFacts);
    expect(text).toContain("My name is Ana Naivalu.");
    expect(text).toContain("I am 24 years old.");
    expect(text).toContain("I live in Suva.");
    expect(text).toContain("My highest level of education is Bachelor's.");
    expect(text).toContain("I am a student.");
    expect(text).toContain("I work in the Climate & Environment sector.");
    expect(text).toContain("I speak English and iTaukei.");
    expect(text).toContain("I am interested in funding for climate and scholarship.");
    expect(text).toContain("I volunteer with a coastal clean-up group.");
  });

  it("never invents facts that are not on the profile", () => {
    const text = buildPersonalStatement({
      name: "Ana Naivalu",
      city: "Suva",
      employmentStatus: "Employed",
    });
    expect(text).toBe("My name is Ana Naivalu. I live in Suva. I am employed.");
    expect(text).not.toContain("years old");
    expect(text).not.toContain("Bachelor's");
    expect(text).not.toContain("GPA");
    expect(text).not.toContain("salary");
  });

  it("returns an empty string when there are no facts", () => {
    expect(buildPersonalStatement({})).toBe("");
    expect(buildPersonalStatement({ name: "  " })).toBe("");
  });

  it("handles arrays of one", () => {
    const text = buildPersonalStatement({ languages: ["English"], fundingInterests: ["study"] });
    expect(text).toContain("I speak English.");
    expect(text).toContain("I am interested in funding for study.");
  });
});

describe("formProgress", () => {
  it("returns 0 when nothing is filled", () => {
    expect(formProgress({})).toBe(0);
  });

  it("counts whitespace-only values as empty", () => {
    expect(formProgress({ personalStatement: "   ", proposal: "  " })).toBe(0);
  });

  it("reports the fraction of filled fields", () => {
    expect(formProgress({ proposal: "My plan" })).toBe(50);
    expect(formProgress({ personalStatement: "One line", proposal: "My plan" })).toBe(100);
  });

  it("supports a custom field list", () => {
    expect(formProgress({ a: "x" }, ["a", "b", "c"])).toBe(33);
  });

  it("returns 100 when there are no tracked fields", () => {
    expect(formProgress({ a: "x" }, [])).toBe(100);
  });

  it("knows the tracked form fields", () => {
    expect(FORM_FIELDS).toEqual(["personalStatement", "proposal"]);
  });
});

describe("buildCopyText", () => {
  it("assembles only filled answers with labels", () => {
    const text = buildCopyText({ personalStatement: "Hi there", proposal: "My plan" });
    expect(text).toContain("PERSONAL STATEMENT\nHi there");
    expect(text).toContain("PROPOSAL\nMy plan");
  });

  it("skips empty fields", () => {
    const text = buildCopyText({ personalStatement: "", proposal: "  " });
    expect(text).toBe("");
  });
});
