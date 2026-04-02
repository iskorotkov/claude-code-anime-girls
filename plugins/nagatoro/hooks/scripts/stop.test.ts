import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { makeState } from "./_test-utils";

const mockLoadState = mock(() => Promise.resolve(makeState()));
const mockSaveState = mock(() => Promise.resolve());

mock.module("./_helpers", () => ({
  loadState: mockLoadState,
  saveState: mockSaveState,
  runHook: mock(),
}));

const { run } = await import("./stop");

const randomSpy = spyOn(Math, "random").mockReturnValue(1);

beforeEach(() => {
  mockLoadState.mockClear();
  mockSaveState.mockClear();
  mockLoadState.mockImplementation(() => Promise.resolve(makeState()));
});

afterEach(() => randomSpy.mockReturnValue(1));

describe("stop hook", () => {
  it("skips when stop_hook_active is true", async () => {
    const result = await run({ hook_event_name: "Stop", stop_hook_active: true });
    expect(result).toBeUndefined();
    expect(mockLoadState).not.toHaveBeenCalled();
    expect(mockSaveState).not.toHaveBeenCalled();
  });

  it("applies task_success effects when stop_hook_active is false", async () => {
    await run({ hook_event_name: "Stop", stop_hook_active: false });
    expect(mockLoadState).toHaveBeenCalledTimes(1);
    expect(mockSaveState).toHaveBeenCalledTimes(1);
    const saved = mockSaveState.mock.calls[0][0] as any;
    expect(saved.respect).toBe(52);
    expect(saved.consecutiveErrors).toBe(0);
    expect(saved.mood).toBe("teasing");
  });

  it("applies task_success effects when stop_hook_active is undefined", async () => {
    await run({ hook_event_name: "Stop" });
    const saved = mockSaveState.mock.calls[0][0] as any;
    expect(saved.respect).toBe(52);
  });

  it("always returns undefined", async () => {
    const r1 = await run({ hook_event_name: "Stop", stop_hook_active: true });
    const r2 = await run({ hook_event_name: "Stop", stop_hook_active: false });
    expect(r1).toBeUndefined();
    expect(r2).toBeUndefined();
  });
});
