import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { makeState } from "./_test-utils";
import { GREETINGS } from "./_dialogue";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
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

function savedState() {
  return mockSaveState.mock.calls[0][0] as ReturnType<typeof makeState>;
}

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
      const s = savedState();
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
      const s = savedState();
      expect(s.boredom).toBe(0);
    });

    it("updates lastInteraction before saving", async () => {
      const before = Date.now();
      await run({ hook_event_name: "SessionStart" });
      const s = savedState();
      const saved = new Date(s.lastInteraction!).getTime();
      expect(saved).toBeGreaterThanOrEqual(before);
      expect(saved).toBeLessThanOrEqual(Date.now());
    });

    it("always calls saveState", async () => {
      await run({ hook_event_name: "SessionStart" });
      expect(mockSaveState).toHaveBeenCalledTimes(1);
    });
  });
});
