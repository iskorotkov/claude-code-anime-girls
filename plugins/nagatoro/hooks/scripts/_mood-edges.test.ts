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
    expect(transitionMood(makeState({ interactionCount: 20, moodDecayCounter: 0, mood: "teasing" }), "interaction")).toBe("teasing");
  });
  it("consecutiveErrors=3 still gives serious", () => {
    expect(transitionMood(makeState({ consecutiveErrors: 3 }), "tool_failure")).toBe("serious");
  });
  it("task_success: respect=89 blocks happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ respect: 89, senpaiMeter: 95, mood: "smug" }), "task_success")).toBe("smug");
  });
  it("task_success: senpaiMeter=94 blocks happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ respect: 90, senpaiMeter: 94, mood: "smug" }), "task_success")).toBe("smug");
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

describe("moodDecayCounter integration", () => {
  it("first interaction transitions smug to teasing, second stays teasing", () => {
    const s0 = makeState({ mood: "smug", moodDecayCounter: 0 });
    const s1 = applyMoodEffects(s0, "interaction");
    expect(s1.mood).toBe("teasing");
    expect(s1.moodDecayCounter).toBe(1);
    const s2 = applyMoodEffects(s1, "interaction");
    expect(s2.mood).toBe("teasing");
    expect(s2.moodDecayCounter).toBe(2);
  });
});
