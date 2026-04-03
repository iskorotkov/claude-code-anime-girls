import { describe, it, expect, spyOn } from "bun:test";
import {
  POOLS,
  GREETINGS,
  pickLine,
  substituteRival,
} from "./_dialogue";
import { ALL_MOODS } from "./_test-utils";

describe("POOLS", () => {
  it("has a non-empty entry for every mood", () => {
    for (const mood of ALL_MOODS) {
      expect(Array.isArray(POOLS[mood])).toBe(true);
      expect(POOLS[mood].length).toBeGreaterThan(0);
    }
  });
});

describe("GREETINGS", () => {
  const keys = [
    "firstEver", "longAbsence", "jealousReturn",
    "morning", "afternoon", "evening", "night",
  ] as const;

  it("has all 7 keys with non-empty arrays", () => {
    for (const key of keys) {
      expect(Array.isArray(GREETINGS[key])).toBe(true);
      expect(GREETINGS[key].length).toBeGreaterThan(0);
    }
  });
});

describe("pickLine", () => {
  const pool = ["a", "b", "c", "d", "e", "f"];

  it("with seed 0 returns first element", () => {
    expect(pickLine(pool, 0)).toBe("a");
  });

  it("wraps seed around pool length", () => {
    expect(pickLine(pool, 7)).toBe("b");
  });

  it("without seed uses Math.random", () => {
    const spy = spyOn(Math, "random").mockReturnValue(0);
    expect(pickLine(pool)).toBe("a");
    spy.mockRestore();
  });

  it("returns fallback for empty pool", () => {
    expect(pickLine([])).toBe("...");
  });

  it("returns fallback for empty pool with seed", () => {
    expect(pickLine([], 5)).toBe("...");
  });
});

describe("substituteRival", () => {
  it("replaces <rival> with given name", () => {
    expect(substituteRival("I hate <rival>", "GPT")).toBe("I hate GPT");
  });

  it("replaces multiple <rival> tokens", () => {
    const line = "<rival> vs <rival>";
    expect(substituteRival(line, "GPT")).toBe("GPT vs GPT");
  });

  it("uses fallback when rival is null", () => {
    expect(substituteRival("I hate <rival>", null)).toBe(
      "I hate that OTHER AI",
    );
  });

  it("returns line unchanged when no placeholder", () => {
    expect(substituteRival("no placeholder", "GPT")).toBe("no placeholder");
  });
});
