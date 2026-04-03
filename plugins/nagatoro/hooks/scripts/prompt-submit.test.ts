import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { makeState, savedState } from "./_test-utils";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
  clamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)),
}));

const { run } = await import("./prompt-submit");

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

describe("prompt-submit hook", () => {
  describe("empty prompt", () => {
    it("applies interaction effect for empty string", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "" });
      const s = savedState(mockSaveState);
      expect(s.interactionCount).toBe(1);
      expect(result).toBeUndefined();
    });

    it("applies interaction effect when prompt is undefined", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit" });
      const s = savedState(mockSaveState);
      expect(s.interactionCount).toBe(1);
      expect(result).toBeUndefined();
    });
  });

  describe("rival detection", () => {
    it("detects rival and returns jealous reaction", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "I love chatgpt" });
      const s = savedState(mockSaveState);
      expect(s.mood).toBe("jealous");
      expect(s.senpaiMeter).toBe(45);
      expect(s.jealousyTarget).toBe("chatgpt");
      expect(s.interactionCount).toBe(1);
      expect(result).toHaveProperty("hookSpecificOutput");
      expect(result!.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
      expect(result!.hookSpecificOutput.additionalContext).toContain("Nagatoro reacts");
    });

    it("is case-insensitive and preserves original case", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "I prefer ChatGPT" });
      const s = savedState(mockSaveState);
      expect(s.mood).toBe("jealous");
      expect(s.jealousyTarget).toBe("ChatGPT");
      expect(s.interactionCount).toBe(1);
      expect(result).toHaveProperty("hookSpecificOutput");
    });
  });

  describe("swear detection", () => {
    it("detects swear and applies laughing effect", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "this is damn hard" });
      const s = savedState(mockSaveState);
      expect(s.mood).toBe("laughing");
      expect(s.totalSwears).toBe(1);
      expect(s.interactionCount).toBe(1);
      expect(result).toHaveProperty("hookSpecificOutput");
      expect(result!.hookSpecificOutput.additionalContext).toContain("Nagatoro reacts");
    });
  });

  describe("dual detection", () => {
    it("detects both swear and rival in same message", async () => {
      const result = await run({
        hook_event_name: "UserPromptSubmit",
        prompt: "chatgpt is shit",
      });
      const s = savedState(mockSaveState);
      expect(s.totalSwears).toBe(1);
      expect(s.interactionCount).toBe(1);
      expect(s.mood).toBe("jealous");
      expect(s.senpaiMeter).toBeLessThan(50);
      expect(result).toHaveProperty("hookSpecificOutput");
      const ctx = result!.hookSpecificOutput.additionalContext;
      expect((ctx.match(/Nagatoro reacts:/g) ?? []).length).toBe(2);
    });
  });

  describe("false-positive guards", () => {
    it("does not trigger swear on 'add a class'", async () => {
      const result = await run({
        hook_event_name: "UserPromptSubmit",
        prompt: "add a class",
      });
      const s = savedState(mockSaveState);
      expect(s.mood).toBe("teasing");
      expect(s.totalSwears).toBe(0);
      expect(result).toBeUndefined();
    });

    it("does not trigger rival on 'bombardment of requests'", async () => {
      const result = await run({
        hook_event_name: "UserPromptSubmit",
        prompt: "bombardment of requests",
      });
      const s = savedState(mockSaveState);
      expect(s.mood).toBe("teasing");
      expect(result).toBeUndefined();
    });
  });

  describe("generic prompt", () => {
    it("applies interaction for non-matching prompt", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "good morning" });
      const s = savedState(mockSaveState);
      expect(s.interactionCount).toBe(1);
      expect(result).toBeUndefined();
    });
  });

  describe("common behavior", () => {
    it("always calls saveState", async () => {
      await run({ hook_event_name: "UserPromptSubmit", prompt: "good morning" });
      expect(mockSaveState).toHaveBeenCalledTimes(1);

      mockSaveState.mockClear();
      await run({ hook_event_name: "UserPromptSubmit", prompt: "I love chatgpt" });
      expect(mockSaveState).toHaveBeenCalledTimes(1);

      mockSaveState.mockClear();
      await run({ hook_event_name: "UserPromptSubmit", prompt: "damn" });
      expect(mockSaveState).toHaveBeenCalledTimes(1);
    });
  });
});
