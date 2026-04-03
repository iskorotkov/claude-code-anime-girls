import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { transitionMood, applyMoodEffects, computeBoredom } from "./_mood";
import { makeState } from "./_test-utils";

let randomSpy: ReturnType<typeof spyOn>;
afterEach(() => { randomSpy?.mockRestore(); });

describe("upper-bound clamping", () => {
  it("senpaiMeter clamps at 100 from compliment", () => {
    expect(applyMoodEffects(makeState({ senpaiMeter: 99 }), "compliment").senpaiMeter).toBe(100);
  });
  it("senpaiMeter stays at 100 from pat", () => {
    expect(applyMoodEffects(makeState({ senpaiMeter: 100 }), "pat").senpaiMeter).toBe(100);
  });
  it("respect clamps at 100 from task_success", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    expect(applyMoodEffects(makeState({ respect: 99 }), "task_success").respect).toBe(100);
  });
  it("respect stays at 100 from task_success", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    expect(applyMoodEffects(makeState({ respect: 100 }), "task_success").respect).toBe(100);
  });
  it("boredom stays at 100 from idle", () => {
    expect(applyMoodEffects(makeState({ boredom: 100 }), "idle").boredom).toBe(100);
  });
  it("boredom clamps at 0 from interaction", () => {
    expect(applyMoodEffects(makeState({ boredom: 0 }), "interaction").boredom).toBe(0);
  });
  it("boredom clamps at 0 from feed", () => {
    expect(applyMoodEffects(makeState({ boredom: 0 }), "feed").boredom).toBe(0);
  });
});

describe("transition boundaries", () => {
  it("interactionCount=20 does not trigger bored", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ interactionCount: 20, mood: "teasing" }), "interaction")).toBe("teasing");
  });
  it("consecutiveErrors=3 still gives serious", () => {
    expect(transitionMood(makeState({ consecutiveErrors: 3 }), "tool_failure")).toBe("serious");
  });
  it("task_success: respect=74 blocks happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ respect: 74, senpaiMeter: 80, mood: "smug" }), "task_success")).toBe("smug");
  });
  it("task_success: senpaiMeter=79 blocks happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ respect: 75, senpaiMeter: 79, mood: "smug" }), "task_success")).toBe("smug");
  });
  it("interaction: moodLockedFor=1 preserves non-teasing mood", () => {
    expect(transitionMood(makeState({ mood: "flustered", moodLockedFor: 1 }), "interaction")).toBe("flustered");
  });
});

describe("computeBoredom edge cases", () => {
  const base = new Date("2025-06-01T12:00:00Z");

  it("future lastInteraction returns base boredom unchanged", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T12:16:00Z", boredom: 30 }), base)).toBe(30);
  });
  it("same timestamp returns base boredom unchanged", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T12:00:00Z", boredom: 20 }), base)).toBe(20);
  });
  it("boredom at 100 with large idle stays 100", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T08:00:00Z", boredom: 100 }), base)).toBe(100);
  });
});

