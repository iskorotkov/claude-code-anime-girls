import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { DEFAULT_STATE } from "./_types";
import { makeState } from "./_test-utils";

const testDir = await mkdtemp(join(tmpdir(), "nagatoro-test-"));
process.env.CLAUDE_PLUGIN_DATA = testDir;

const { clamp, loadState, saveState, toLocalDateString, applyDailyReset } = await import("./_helpers");
const statePath = join(testDir, "state.json");

beforeEach(async () => {
  try { await unlink(statePath); } catch {}
});

afterAll(async () => {
  await rm(testDir, { recursive: true });
});

describe("clamp", () => {
  it("returns value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("returns NaN for NaN input", () => {
    expect(clamp(NaN, 0, 100)).toBeNaN();
  });
});

describe("loadState", () => {
  it("returns DEFAULT_STATE when file is missing", async () => {
    const state = await loadState();
    expect(state).toEqual(DEFAULT_STATE);
  });

  it("returns full state from valid JSON file", async () => {
    const custom = makeState({
      mood: "happy",
      senpaiMeter: 80,
      respect: 90,
      totalPats: 42,
    });
    await Bun.write(statePath, JSON.stringify(custom));
    const state = await loadState();
    expect(state).toEqual(custom);
  });

  it("fills missing fields from DEFAULT_STATE for partial JSON", async () => {
    await Bun.write(statePath, JSON.stringify({ mood: "happy" }));
    const state = await loadState();
    expect(state.mood).toBe("happy");
    expect(state.senpaiMeter).toBe(DEFAULT_STATE.senpaiMeter);
    expect(state.respect).toBe(DEFAULT_STATE.respect);
    expect(state.boredom).toBe(DEFAULT_STATE.boredom);
  });

  it("returns DEFAULT_STATE for corrupt JSON", async () => {
    await Bun.write(statePath, "not json");
    const state = await loadState();
    expect(state).toEqual(DEFAULT_STATE);
  });
});

describe("loadState - corrupt values", () => {
  it("clamps out-of-range meter to 100", async () => {
    await Bun.write(statePath, JSON.stringify({ senpaiMeter: 999 }));
    const state = await loadState();
    expect(state.senpaiMeter).toBe(100);
  });

  it("clamps negative meter to 0", async () => {
    await Bun.write(statePath, JSON.stringify({ senpaiMeter: -50 }));
    const state = await loadState();
    expect(state.senpaiMeter).toBe(0);
  });

  it("falls back to default for non-numeric meter", async () => {
    await Bun.write(statePath, JSON.stringify({ senpaiMeter: "hello" }));
    const state = await loadState();
    expect(state.senpaiMeter).toBe(50);
  });

  it("falls back to default for invalid mood", async () => {
    await Bun.write(statePath, JSON.stringify({ mood: "invalid" }));
    const state = await loadState();
    expect(state.mood).toBe("teasing");
  });

  it("falls back to null for unparseable lastInteraction", async () => {
    await saveState({ ...DEFAULT_STATE, lastInteraction: "not-a-date" } as any);
    const s = await loadState();
    expect(s.lastInteraction).toBeNull();
  });

  it("falls back to null for unparseable lastResetDate", async () => {
    await saveState({ ...DEFAULT_STATE, lastResetDate: "garbage" } as any);
    const s = await loadState();
    expect(s.lastResetDate).toBeNull();
  });
});

describe("saveState", () => {
  it("round-trips: save then load returns same state", async () => {
    const custom = makeState({
      mood: "jealous",
      senpaiMeter: 10,
      totalInsults: 7,
      boredom: 60,
    });
    await saveState(custom);
    const loaded = await loadState();
    expect(loaded).toEqual(custom);
  });

  it("creates directory when missing", async () => {
    await rm(testDir, { recursive: true });
    const custom = makeState({ mood: "serious", respect: 99 });
    await saveState(custom);
    const loaded = await loadState();
    expect(loaded).toEqual(custom);
  });

  it("overwrites existing state", async () => {
    const first = makeState({ mood: "smug", respect: 10 });
    const second = makeState({ mood: "happy", respect: 99 });
    await saveState(first);
    await saveState(second);
    const loaded = await loadState();
    expect(loaded).toEqual(second);
  });
});

describe("toLocalDateString", () => {
  it("formats a known date", () => {
    expect(toLocalDateString(new Date(2026, 3, 3))).toBe("2026-04-03");
  });

  it("pads single-digit month and day", () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("handles Dec 31", () => {
    expect(toLocalDateString(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("applyDailyReset", () => {
  it("no reset when same day", () => {
    const state = makeState({ lastResetDate: "2026-04-03" });
    const result = applyDailyReset(state, "2026-04-03");
    expect(result).toBe(state);
  });

  it("resets on new day", () => {
    const state = makeState({
      lastResetDate: "2026-04-02",
      senpaiMeter: 80,
      respect: 90,
      totalPats: 42,
      mood: "jealous",
      jealousyTarget: "GPT",
      artHeight: 16,
      lastInteraction: "2026-04-02T23:00:00Z",
    });
    const result = applyDailyReset(state, "2026-04-03");
    expect(result.mood).toBe("teasing");
    expect(result.senpaiMeter).toBe(50);
    expect(result.respect).toBe(50);
    expect(result.totalPats).toBe(42);
    expect(result.jealousyTarget).toBeNull();
    expect(result.artHeight).toBe(16);
    expect(result.lastInteraction).toBe("2026-04-02T23:00:00Z");
    expect(result.lastResetDate).toBe("2026-04-03");
  });

  it("null lastResetDate triggers reset", () => {
    const state = makeState({ lastResetDate: null });
    const result = applyDailyReset(state, "2026-04-03");
    expect(result).not.toBe(state);
    expect(result.lastResetDate).toBe("2026-04-03");
  });

  it("preserves artHeight", () => {
    const state = makeState({ lastResetDate: "2026-04-01", artHeight: 8 });
    const result = applyDailyReset(state, "2026-04-03");
    expect(result.artHeight).toBe(8);
  });

  it("preserves lastInteraction", () => {
    const state = makeState({ lastResetDate: "2026-04-01", lastInteraction: "2026-04-02T10:00:00Z" });
    const result = applyDailyReset(state, "2026-04-03");
    expect(result.lastInteraction).toBe("2026-04-02T10:00:00Z");
  });

  it("preserves lifetime counters across daily reset", () => {
    const state = { ...DEFAULT_STATE, lastResetDate: "2025-01-01", totalPats: 42, totalInsults: 7, genuineMoments: 3 };
    const result = applyDailyReset(state, "2025-01-02");
    expect(result.totalPats).toBe(42);
    expect(result.totalInsults).toBe(7);
    expect(result.genuineMoments).toBe(3);
  });
});

describe("loadState - sanitize lastResetDate", () => {
  it("passes through string lastResetDate", async () => {
    await Bun.write(statePath, JSON.stringify({ lastResetDate: "2026-04-03" }));
    const state = await loadState();
    expect(state.lastResetDate).toBe("2026-04-03");
  });

  it("returns null for non-string lastResetDate", async () => {
    await Bun.write(statePath, JSON.stringify({ lastResetDate: 12345 }));
    const state = await loadState();
    expect(state.lastResetDate).toBeNull();
  });
});
