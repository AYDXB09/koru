import { describe, expect, it } from "vitest";
import { jparse, jstring } from "@/lib/json";

describe("jstring", () => {
  it("serializes objects", () => {
    expect(jstring({ a: 1 })).toBe('{"a":1}');
  });

  it("serializes arrays", () => {
    expect(jstring(["a", "b"])).toBe('["a","b"]');
  });
});

describe("jparse", () => {
  it("parses valid JSON", () => {
    expect(jparse<string[]>('["a","b"]', [])).toEqual(["a", "b"]);
  });

  it("returns fallback for null", () => {
    expect(jparse(null, [])).toEqual([]);
  });

  it("returns fallback for undefined", () => {
    expect(jparse(undefined, "x")).toBe("x");
  });

  it("returns fallback for invalid JSON", () => {
    expect(jparse("not json", 42)).toBe(42);
  });

  it("returns fallback for empty string", () => {
    expect(jparse("", "fb")).toBe("fb");
  });

  it("round-trips", () => {
    const value = [{ name: "Stage 1", order: 1 }];
    expect(jparse(jstring(value), [])).toEqual(value);
  });
});
