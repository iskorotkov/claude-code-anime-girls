import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { makeState } from "./_test-utils";
import { POOLS } from "./_dialogue";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
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

function savedState() {
  return mockSaveState.mock.calls[0][0] as ReturnType<typeof makeState>;
}

describe("prompt-submit hook", () => {
  describe("empty prompt", () => {
    it("applies interaction effect for empty string", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "" });
      const s = savedState();
      expect(s.interactionCount).toBe(1);
      expect(result).toBeUndefined();
    });

    it("applies interaction effect when prompt is undefined", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit" });
      const s = savedState();
      expect(s.interactionCount).toBe(1);
      expect(result).toBeUndefined();
    });
  });

  describe("rival detection", () => {
    it("detects rival and returns jealous reaction", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "I love chatgpt" });
      const s = savedState();
      expect(s.mood).toBe("jealous");
      expect(s.senpaiMeter).toBe(45);
      expect(s.jealousyTarget).toBe("chatgpt");
      expect(result).toHaveProperty("hookSpecificOutput");
      expect(result!.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
      expect(result!.hookSpecificOutput.additionalContext).toContain("Nagatoro reacts");
    });

    it("is case-insensitive for rival matching", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "I prefer ChatGPT" });
      const s = savedState();
      expect(s.mood).toBe("jealous");
      expect(result).toHaveProperty("hookSpecificOutput");
    });
  });

  describe("swear detection", () => {
    it("detects swear and applies laughing effect", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "this is damn hard" });
      const s = savedState();
      expect(s.mood).toBe("laughing");
      expect(s.totalInsults).toBe(1);
      expect(result).toHaveProperty("hookSpecificOutput");
      expect(result!.hookSpecificOutput.additionalContext).toContain("Nagatoro reacts");
    });
  });

  describe("priority", () => {
    it("rival takes priority over swear", async () => {
      const result = await run({
        hook_event_name: "UserPromptSubmit",
        prompt: "chatgpt is shit",
      });
      const s = savedState();
      expect(s.mood).toBe("jealous");
      expect(result).toHaveProperty("hookSpecificOutput");
    });
  });

  describe("generic prompt", () => {
    it("applies interaction for non-matching prompt", async () => {
      const result = await run({ hook_event_name: "UserPromptSubmit", prompt: "good morning" });
      const s = savedState();
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
