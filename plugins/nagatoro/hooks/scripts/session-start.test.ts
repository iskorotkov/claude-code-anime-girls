import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { makeState, savedState } from "./_test-utils";
import { DEFAULT_STATE } from "./_types";
import { GREETINGS } from "./_dialogue";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

const mockToLocalDateString = mock((date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
});

const realDailyReset = (state: any, today: string) => {
  if (state.lastResetDate === today) return state;
  return { ...DEFAULT_STATE, lastInteraction: state.lastInteraction, artHeight: state.artHeight, lastResetDate: today };
};
const mockApplyDailyReset = mock((state: any) => state);

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
  clamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)),
  toLocalDateString: mockToLocalDateString,
  applyDailyReset: mockApplyDailyReset,
}));

const { run } = await import("./session-start");

let randomSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  mockLoadState.mockClear();
  mockSaveState.mockClear();
  mockLoadState.mockImplementation(() => Promise.resolve(makeState()));
  randomSpy = spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
});

const allTimeOfDayGreetings = [
  ...GREETINGS.morning,
  ...GREETINGS.afternoon,
  ...GREETINGS.evening,
  ...GREETINGS.night,
];

describe("session-start hook", () => {
  describe("first session", () => {
    it("picks from firstEver when lastInteraction is null", async () => {
      const result = await run({ hook_event_name: "SessionStart" });
      const greeting = result.hookSpecificOutput.additionalContext;
      expect(GREETINGS.firstEver.some((g) => greeting.includes(g))).toBe(true);
      const s = savedState(mockSaveState);
      expect(s.boredom).toBe(0);
    });
  });

  describe("long absence", () => {
    it("picks from longAbsence when idle > 240 min", async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      mockLoadState.mockResolvedValueOnce(makeState({ lastInteraction: fiveHoursAgo }));
      const result = await run({ hook_event_name: "SessionStart" });
      const greeting = result.hookSpecificOutput.additionalContext;
      expect(GREETINGS.longAbsence.some((g) => greeting.includes(g))).toBe(true);
    });
  });

  describe("jealous return", () => {
    it("uses jealousReturn pool and substitutes rival", async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      mockLoadState.mockResolvedValueOnce(
        makeState({ mood: "jealous", jealousyTarget: "ChatGPT", lastInteraction: thirtyMinAgo }),
      );
      const result = await run({ hook_event_name: "SessionStart" });
      const greeting = result.hookSpecificOutput.additionalContext;
      expect(greeting).toContain("ChatGPT");
      expect(greeting).not.toContain("<rival>");
    });
  });

  describe("normal return", () => {
    it("produces a time-of-day greeting", async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      mockLoadState.mockResolvedValueOnce(makeState({ lastInteraction: thirtyMinAgo }));
      const result = await run({ hook_event_name: "SessionStart" });
      const greeting = result.hookSpecificOutput.additionalContext;
      expect(allTimeOfDayGreetings.some((g) => greeting.includes(g))).toBe(true);
    });
  });

  describe("output structure", () => {
    it("returns SessionStart hookEventName", async () => {
      const result = await run({ hook_event_name: "SessionStart" });
      expect(result.hookSpecificOutput.hookEventName).toBe("SessionStart");
    });

    it("includes personality text", async () => {
      const result = await run({ hook_event_name: "SessionStart" });
      expect(result.hookSpecificOutput.additionalContext).toContain("Nagatoro");
    });

    it("includes mood emoji and senpai meter", async () => {
      mockLoadState.mockResolvedValueOnce(makeState({ senpaiMeter: 75 }));
      const result = await run({ hook_event_name: "SessionStart" });
      const ctx = result.hookSpecificOutput.additionalContext;
      expect(ctx).toContain("Current mood: teasing");
      expect(ctx).toContain("Senpai meter: 75/100");
    });

    it("includes jealousyTarget line when present", async () => {
      mockLoadState.mockResolvedValueOnce(makeState({ jealousyTarget: "Gemini" }));
      const result = await run({ hook_event_name: "SessionStart" });
      expect(result.hookSpecificOutput.additionalContext).toContain("Jealousy target: Gemini");
    });

    it("excludes jealousyTarget line when null", async () => {
      mockLoadState.mockResolvedValueOnce(makeState({ jealousyTarget: null }));
      const result = await run({ hook_event_name: "SessionStart" });
      expect(result.hookSpecificOutput.additionalContext).not.toContain("Jealousy target");
    });
  });

  describe("state mutations", () => {
    it("sets boredom to 0 before saving", async () => {
      mockLoadState.mockResolvedValueOnce(makeState({ boredom: 42 }));
      await run({ hook_event_name: "SessionStart" });
      const s = savedState(mockSaveState);
      expect(s.boredom).toBe(0);
    });

    it("updates lastInteraction before saving", async () => {
      const before = Date.now();
      await run({ hook_event_name: "SessionStart" });
      const s = savedState(mockSaveState);
      const saved = new Date(s.lastInteraction!).getTime();
      expect(saved).toBeGreaterThanOrEqual(before);
      expect(saved).toBeLessThanOrEqual(Date.now());
    });

    it("always calls saveState", async () => {
      await run({ hook_event_name: "SessionStart" });
      expect(mockSaveState).toHaveBeenCalledTimes(1);
    });
  });

  describe("daily reset", () => {
    it("resets state on day change", async () => {
      mockApplyDailyReset.mockImplementationOnce(realDailyReset);
      mockLoadState.mockResolvedValueOnce(
        makeState({ lastResetDate: "2026-04-02", senpaiMeter: 80, lastInteraction: new Date().toISOString() }),
      );
      await run({ hook_event_name: "SessionStart" });
      const s = savedState(mockSaveState);
      expect(s.senpaiMeter).toBe(50);
      expect(s.lastResetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("skips reset on same day", async () => {
      mockApplyDailyReset.mockImplementationOnce(realDailyReset);
      const today = mockToLocalDateString(new Date());
      mockLoadState.mockResolvedValueOnce(
        makeState({ lastResetDate: today, senpaiMeter: 80, lastInteraction: new Date().toISOString() }),
      );
      await run({ hook_event_name: "SessionStart" });
      const s = savedState(mockSaveState);
      expect(s.senpaiMeter).toBe(80);
    });
  });
});
