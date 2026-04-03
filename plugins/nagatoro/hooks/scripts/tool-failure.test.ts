import { describe, it, expect, mock, beforeEach } from "bun:test";
import { makeState, savedState } from "./_test-utils";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
  clamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)),
}));

const { run } = await import("./tool-failure");

beforeEach(() => {
  mockLoadState.mockClear();
  mockSaveState.mockClear();
  mockLoadState.mockImplementation(() => Promise.resolve(makeState()));
});

describe("tool-failure hook", () => {
  it("loads state, applies tool_failure effects, saves state", async () => {
    await run({ hook_event_name: "PostToolUseFailure" });
    expect(mockLoadState).toHaveBeenCalledTimes(1);
    expect(mockSaveState).toHaveBeenCalledTimes(1);
    const saved = savedState(mockSaveState);
    expect(saved.respect).toBe(49);
    expect(saved.consecutiveErrors).toBe(1);
    expect(saved.mood).toBe("smug");
  });

  it("returns undefined", async () => {
    const result = await run({ hook_event_name: "PostToolUseFailure" });
    expect(result).toBeUndefined();
  });

  it("transitions to serious when consecutiveErrors >= 2", async () => {
    mockLoadState.mockImplementation(() =>
      Promise.resolve(makeState({ consecutiveErrors: 2, respect: 50 }))
    );
    await run({ hook_event_name: "PostToolUseFailure" });
    const saved = savedState(mockSaveState);
    expect(saved.mood).toBe("serious");
    expect(saved.consecutiveErrors).toBe(3);
    expect(saved.respect).toBe(49);
  });

  it("decrements respect on each failure", async () => {
    mockLoadState.mockImplementation(() =>
      Promise.resolve(makeState({ respect: 100 }))
    );
    await run({ hook_event_name: "PostToolUseFailure" });
    const saved = savedState(mockSaveState);
    expect(saved.respect).toBe(99);
  });

  it("resets moodLockedFor on failure", async () => {
    mockLoadState.mockImplementation(() =>
      Promise.resolve(makeState({ moodLockedFor: 2 }))
    );
    await run({ hook_event_name: "PostToolUseFailure" });
    const saved = savedState(mockSaveState);
    expect(saved.moodLockedFor).toBe(0);
  });
});
