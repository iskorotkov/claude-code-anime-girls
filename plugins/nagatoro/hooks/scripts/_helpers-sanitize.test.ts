import { describe, it, expect } from "bun:test";
import { sanitizeState } from "./_helpers";
import { DEFAULT_STATE } from "./_types";

describe("sanitizeState - corrupt values", () => {
  it("clamps out-of-range meter to 100", () => {
    const state = sanitizeState({ senpaiMeter: 999 });
    expect(state.senpaiMeter).toBe(100);
  });

  it("clamps negative meter to 0", () => {
    const state = sanitizeState({ senpaiMeter: -50 });
    expect(state.senpaiMeter).toBe(0);
  });

  it("falls back to default for non-numeric meter", () => {
    const state = sanitizeState({ senpaiMeter: "hello" });
    expect(state.senpaiMeter).toBe(50);
  });

  it("falls back to default for invalid mood", () => {
    const state = sanitizeState({ mood: "invalid" });
    expect(state.mood).toBe("teasing");
  });

  it("falls back to null for unparseable lastInteraction", () => {
    const state = sanitizeState({ lastInteraction: "not-a-date" });
    expect(state.lastInteraction).toBeNull();
  });

  it("falls back to null for unparseable lastResetDate", () => {
    const state = sanitizeState({ lastResetDate: "garbage" });
    expect(state.lastResetDate).toBeNull();
  });

  it("falls back to default for Infinity counter", () => {
    const state = sanitizeState({ totalPats: Infinity });
    expect(state.totalPats).toBe(DEFAULT_STATE.totalPats);
  });

  it("falls back to default for -Infinity counter", () => {
    const state = sanitizeState({ totalPats: -Infinity });
    expect(state.totalPats).toBe(DEFAULT_STATE.totalPats);
  });

  it("migrates totalInsults to totalSwears", () => {
    const state = sanitizeState({ totalInsults: 5 });
    expect(state.totalSwears).toBe(5);
  });
});

describe("sanitizeState - date validation", () => {
  it("passes through valid ISO date string", () => {
    const state = sanitizeState({ lastResetDate: "2026-04-03" });
    expect(state.lastResetDate).toBe("2026-04-03");
  });

  it("passes through ISO date with time", () => {
    const state = sanitizeState({ lastResetDate: "2026-04-03T10:00:00Z" });
    expect(state.lastResetDate).toBe("2026-04-03T10:00:00Z");
  });

  it("returns null for non-string lastResetDate", () => {
    const state = sanitizeState({ lastResetDate: 12345 });
    expect(state.lastResetDate).toBeNull();
  });

  it("rejects bare '0'", () => {
    const state = sanitizeState({ lastResetDate: "0" });
    expect(state.lastResetDate).toBeNull();
  });

  it("rejects bare '1'", () => {
    const state = sanitizeState({ lastResetDate: "1" });
    expect(state.lastResetDate).toBeNull();
  });

  it("rejects numeric string '12345'", () => {
    const state = sanitizeState({ lastResetDate: "12345" });
    expect(state.lastResetDate).toBeNull();
  });
});
