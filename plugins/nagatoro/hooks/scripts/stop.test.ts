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
    await run({ hook_event_name: "Stop", stop_hook_active: false, stop_reason: "end_turn" });
    expect(mockLoadState).toHaveBeenCalledTimes(1);
    expect(mockSaveState).toHaveBeenCalledTimes(1);
    const saved = savedState(mockSaveState);
    expect(saved.respect).toBe(52);
    expect(saved.consecutiveErrors).toBe(0);
    expect(saved.mood).toBe("teasing");
  });

  it("applies task_success effects when stop_hook_active is undefined", async () => {
    await run({ hook_event_name: "Stop", stop_reason: "end_turn" });
    const saved = savedState(mockSaveState);
    expect(saved.respect).toBe(52);
  });

  it("skips effects when stop_reason is missing", async () => {
    await run({ hook_event_name: "Stop" });
    expect(mockLoadState).not.toHaveBeenCalled();
    expect(mockSaveState).not.toHaveBeenCalled();
  });

  it("skips effects when stop_reason is max_tokens", async () => {
    await run({ hook_event_name: "Stop", stop_reason: "max_tokens" });
    expect(mockLoadState).not.toHaveBeenCalled();
    expect(mockSaveState).not.toHaveBeenCalled();
  });

  it("skips effects when stop_reason is undefined", async () => {
    await run({ hook_event_name: "Stop", stop_reason: undefined });
    expect(mockLoadState).not.toHaveBeenCalled();
    expect(mockSaveState).not.toHaveBeenCalled();
  });

  it("transitions to happy mood when thresholds met", async () => {
    randomSpy.mockReturnValue(0.24);
    mockLoadState.mockImplementation(() =>
      Promise.resolve(makeState({ respect: 75, senpaiMeter: 80 })),
    );
    await run({ hook_event_name: "Stop", stop_reason: "end_turn" });
    const saved = savedState(mockSaveState);
    expect(saved.mood).toBe("happy");
    expect(saved.genuineMoments).toBe(1);
    expect(saved.moodLockedFor).toBe(1);
  });

  it("always returns undefined", async () => {
    const r1 = await run({ hook_event_name: "Stop", stop_hook_active: true });
    const r2 = await run({ hook_event_name: "Stop", stop_hook_active: false, stop_reason: "end_turn" });
    expect(r1).toBeUndefined();
    expect(r2).toBeUndefined();
  });
});
