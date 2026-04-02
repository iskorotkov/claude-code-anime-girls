import { describe, it, expect, mock, beforeEach } from "bun:test";
import { makeState } from "./_test-utils";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
}));

const { run } = await import("./tool-failure");

beforeEach(() => {
  mockLoadState.mockClear();
  mockSaveState.mockClear();
  mockLoadState.mockImplementation(() => Promise.resolve(makeState()));
});

function savedState() {
  return mockSaveState.mock.calls[0][0] as ReturnType<typeof makeState>;
}

describe("tool-failure hook", () => {
  it("loads state, applies tool_failure effects, saves state", async () => {
    await run({ hook_event_name: "ToolFailure" });
    expect(mockLoadState).toHaveBeenCalledTimes(1);
    expect(mockSaveState).toHaveBeenCalledTimes(1);
    const saved = savedState();
    expect(saved.respect).toBe(49);
    expect(saved.consecutiveErrors).toBe(1);
    expect(saved.mood).toBe("smug");
  });

  it("returns undefined", async () => {
    const result = await run({ hook_event_name: "ToolFailure" });
    expect(result).toBeUndefined();
  });
});
