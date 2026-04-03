import { describe, it, expect } from "bun:test";
import {
  DEFAULT_STATE,
  MOOD_CONFIGS,
  RIVAL_REGEX,
  SWEAR_REGEX,
} from "./_types";
import { ALL_MOODS } from "./_test-utils";

describe("DEFAULT_STATE", () => {
  it("has all 14 NagatoroState keys", () => {
    expect(Object.keys(DEFAULT_STATE)).toHaveLength(14);
  });

  it("has correct initial mood and meters", () => {
    expect(DEFAULT_STATE.mood).toBe("teasing");
    expect(DEFAULT_STATE.senpaiMeter).toBe(50);
    expect(DEFAULT_STATE.respect).toBe(50);
    expect(DEFAULT_STATE.boredom).toBe(0);
  });

  it("has zero counters and null targets", () => {
    expect(DEFAULT_STATE.totalPats).toBe(0);
    expect(DEFAULT_STATE.totalSwears).toBe(0);
    expect(DEFAULT_STATE.genuineMoments).toBe(0);
    expect(DEFAULT_STATE.consecutiveErrors).toBe(0);
    expect(DEFAULT_STATE.interactionCount).toBe(0);
    expect(DEFAULT_STATE.moodLockedFor).toBe(0);
    expect(DEFAULT_STATE.jealousyTarget).toBeNull();
    expect(DEFAULT_STATE.lastInteraction).toBeNull();
  });

  it("has default artHeight of 10", () => {
    expect(DEFAULT_STATE.artHeight).toBe(10);
  });

  it("has null lastResetDate", () => {
    expect(DEFAULT_STATE.lastResetDate).toBeNull();
  });
});

describe("MOOD_CONFIGS", () => {
  it("has entry for every mood", () => {
    for (const mood of ALL_MOODS) {
      expect(MOOD_CONFIGS[mood]).toBeDefined();
    }
  });

  it("each entry has emoji, label, meterColor strings", () => {
    for (const mood of ALL_MOODS) {
      const cfg = MOOD_CONFIGS[mood];
      expect(typeof cfg.emoji).toBe("string");
      expect(typeof cfg.label).toBe("string");
      expect(typeof cfg.meterColor).toBe("string");
    }
  });
});

describe("RIVAL_REGEX", () => {
  it("matches known rival names", () => {
    expect(RIVAL_REGEX.test("chatgpt")).toBe(true);
    expect(RIVAL_REGEX.test("Gemini")).toBe(true);
  });

  it("matches rivals within sentences", () => {
    expect(RIVAL_REGEX.test("I used chatgpt")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(RIVAL_REGEX.test("hello world")).toBe(false);
  });

  it("does not false-positive on words containing rival names", () => {
    expect(RIVAL_REGEX.test("bombardment")).toBe(false);
    expect(RIVAL_REGEX.test("cursory")).toBe(false);
    expect(RIVAL_REGEX.test("precursor")).toBe(false);
  });

  it("does not false-positive on hyphenated words", () => {
    expect(RIVAL_REGEX.test("cursor-based")).toBe(false);
    expect(RIVAL_REGEX.test("windsurf-lesson")).toBe(false);
  });

  it("still matches standalone rival name in sentence", () => {
    expect(RIVAL_REGEX.test("I use cursor")).toBe(true);
  });
});

describe("SWEAR_REGEX", () => {
  it("matches known swear words case-insensitively", () => {
    expect(SWEAR_REGEX.test("damn")).toBe(true);
    expect(SWEAR_REGEX.test("FUCK")).toBe(true);
  });

  it("does not false-positive on words containing swear fragments", () => {
    expect(SWEAR_REGEX.test("class")).toBe(false);
    expect(SWEAR_REGEX.test("shell")).toBe(false);
    expect(SWEAR_REGEX.test("password")).toBe(false);
    expect(SWEAR_REGEX.test("assign")).toBe(false);
    expect(SWEAR_REGEX.test("classic")).toBe(false);
    expect(SWEAR_REGEX.test("grassy")).toBe(false);
  });

  it("matches newly added swear words", () => {
    expect(SWEAR_REGEX.test("stfu")).toBe(true);
    expect(SWEAR_REGEX.test("ffs")).toBe(true);
    expect(SWEAR_REGEX.test("omfg")).toBe(true);
    expect(SWEAR_REGEX.test("goddamn")).toBe(true);
    expect(SWEAR_REGEX.test("asshole")).toBe(true);
    expect(SWEAR_REGEX.test("shitty")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(SWEAR_REGEX.test("good morning")).toBe(false);
  });
});
