import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { transitionMood, applyMoodEffects, computeBoredom } from "./_mood";
import { makeState } from "./_test-utils";

let randomSpy: ReturnType<typeof spyOn>;
afterEach(() => { randomSpy?.mockRestore(); });

describe("transitionMood", () => {
  it("rival_detected -> jealous", () => {
    expect(transitionMood(makeState(), "rival_detected")).toBe("jealous");
  });
  it("swearing -> laughing", () => {
    expect(transitionMood(makeState(), "swearing")).toBe("laughing");
  });
  it("tool_failure with consecutiveErrors=1 -> smug", () => {
    expect(transitionMood(makeState({ consecutiveErrors: 1 }), "tool_failure")).toBe("smug");
  });
  it("tool_failure with consecutiveErrors=2 -> serious", () => {
    expect(transitionMood(makeState({ consecutiveErrors: 2 }), "tool_failure")).toBe("serious");
  });
  it("pat -> flustered", () => {
    expect(transitionMood(makeState(), "pat")).toBe("flustered");
  });
  it("compliment -> flustered", () => {
    expect(transitionMood(makeState(), "compliment")).toBe("flustered");
  });
  it("task_success with high stats and random < 0.15 -> happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.14);
    expect(transitionMood(makeState({ respect: 90, senpaiMeter: 95 }), "task_success")).toBe("happy");
  });
  it("task_success with high stats and random >= 0.15 -> same mood", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.15);
    expect(transitionMood(makeState({ respect: 90, senpaiMeter: 95, mood: "smug" }), "task_success")).toBe("smug");
  });
  it("task_success with low stats -> same mood regardless of random", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0);
    expect(transitionMood(makeState({ respect: 50, senpaiMeter: 50, mood: "smug" }), "task_success")).toBe("smug");
  });
  it("interaction with moodDecayCounter=1, mood=smug -> teasing", () => {
    expect(transitionMood(makeState({ moodDecayCounter: 1, mood: "smug" }), "interaction")).toBe("teasing");
  });
  it("interaction with moodDecayCounter=1, mood=teasing -> stays teasing", () => {
    expect(transitionMood(makeState({ moodDecayCounter: 1, mood: "teasing" }), "interaction")).toBe("teasing");
  });
  it("interaction with moodDecayCounter=0 -> same mood", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    expect(transitionMood(makeState({ moodDecayCounter: 0, mood: "happy" }), "interaction")).toBe("happy");
  });
  it("interaction with interactionCount=21 and random < 0.1 -> bored", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.09);
    expect(transitionMood(makeState({ interactionCount: 21, moodDecayCounter: 0 }), "interaction")).toBe("bored");
  });
  it("interaction with interactionCount=21 and random >= 0.1 -> same mood", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.1);
    expect(transitionMood(makeState({ interactionCount: 21, moodDecayCounter: 0, mood: "smug" }), "interaction")).toBe("smug");
  });
  it("idle with boredom=80 -> bored", () => {
    expect(transitionMood(makeState({ boredom: 80 }), "idle")).toBe("bored");
  });
  it("idle with boredom=79 -> same mood", () => {
    expect(transitionMood(makeState({ boredom: 79, mood: "smug" }), "idle")).toBe("smug");
  });
});

describe("applyMoodEffects", () => {
  it("rival_detected: senpaiMeter -5, consecutiveErrors=0", () => {
    const r = applyMoodEffects(makeState({ senpaiMeter: 50, consecutiveErrors: 3 }), "rival_detected");
    expect(r.senpaiMeter).toBe(45);
    expect(r.consecutiveErrors).toBe(0);
  });
  it("swearing: totalInsults++, consecutiveErrors=0", () => {
    const r = applyMoodEffects(makeState({ totalInsults: 5, consecutiveErrors: 2 }), "swearing");
    expect(r.totalInsults).toBe(6);
    expect(r.consecutiveErrors).toBe(0);
  });
  it("tool_failure: respect -1, consecutiveErrors++", () => {
    const r = applyMoodEffects(makeState({ respect: 50, consecutiveErrors: 1 }), "tool_failure");
    expect(r.respect).toBe(49);
    expect(r.consecutiveErrors).toBe(2);
  });
  it("pat: senpaiMeter +2, totalPats++, consecutiveErrors=0", () => {
    const r = applyMoodEffects(makeState({ senpaiMeter: 50, totalPats: 3 }), "pat");
    expect(r.senpaiMeter).toBe(52);
    expect(r.totalPats).toBe(4);
    expect(r.consecutiveErrors).toBe(0);
  });
  it("compliment: senpaiMeter +3, consecutiveErrors=0", () => {
    const r = applyMoodEffects(makeState({ senpaiMeter: 50, consecutiveErrors: 1 }), "compliment");
    expect(r.senpaiMeter).toBe(53);
    expect(r.consecutiveErrors).toBe(0);
  });
  it("task_success: respect +2, genuineMoments++ when happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.14);
    const r = applyMoodEffects(makeState({ respect: 90, senpaiMeter: 95, genuineMoments: 1 }), "task_success");
    expect(r.respect).toBe(92);
    expect(r.consecutiveErrors).toBe(0);
    expect(r.genuineMoments).toBe(2);
  });
  it("task_success: genuineMoments unchanged when mood stays same", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    const r = applyMoodEffects(makeState({ respect: 50, genuineMoments: 1 }), "task_success");
    expect(r.genuineMoments).toBe(1);
  });
  it("interaction: interactionCount++, boredom -10, consecutiveErrors=0", () => {
    const r = applyMoodEffects(makeState({ interactionCount: 5, boredom: 30 }), "interaction");
    expect(r.interactionCount).toBe(6);
    expect(r.boredom).toBe(20);
    expect(r.consecutiveErrors).toBe(0);
  });
  it("idle: boredom +10", () => {
    const r = applyMoodEffects(makeState({ boredom: 40 }), "idle");
    expect(r.boredom).toBe(50);
  });
  it("clamps senpaiMeter at 0", () => {
    expect(applyMoodEffects(makeState({ senpaiMeter: 2 }), "rival_detected").senpaiMeter).toBe(0);
  });
  it("clamps respect at 0", () => {
    expect(applyMoodEffects(makeState({ respect: 0 }), "tool_failure").respect).toBe(0);
  });
  it("moodDecayCounter increments on interaction", () => {
    expect(applyMoodEffects(makeState({ moodDecayCounter: 2 }), "interaction").moodDecayCounter).toBe(3);
  });

  for (const t of ["rival_detected", "swearing", "tool_failure", "pat", "compliment"] as const) {
    it(`moodDecayCounter resets to 0 on ${t}`, () => {
      expect(applyMoodEffects(makeState({ moodDecayCounter: 5 }), t).moodDecayCounter).toBe(0);
    });
  }

  for (const t of ["idle", "task_success"] as const) {
    it(`moodDecayCounter preserved on ${t}`, () => {
      randomSpy = spyOn(Math, "random").mockReturnValue(1);
      expect(applyMoodEffects(makeState({ moodDecayCounter: 3 }), t).moodDecayCounter).toBe(3);
    });
  }

  it("lastInteraction updated on non-idle triggers", () => {
    expect(applyMoodEffects(makeState(), "pat").lastInteraction).toBeTypeOf("string");
  });
  it("lastInteraction NOT updated on idle", () => {
    expect(applyMoodEffects(makeState({ lastInteraction: "old" }), "idle").lastInteraction).toBe("old");
  });
  it("does not mutate the original state object", () => {
    const original = makeState({ senpaiMeter: 50, totalPats: 0 });
    const frozen = { ...original };
    applyMoodEffects(original, "pat");
    expect(original).toEqual(frozen);
  });
});

describe("computeBoredom", () => {
  const base = new Date("2025-06-01T12:00:00Z");
  it("returns 0 when lastInteraction is null", () => {
    expect(computeBoredom(makeState({ lastInteraction: null }), base)).toBe(0);
  });
  it("returns base boredom for 10 minutes idle (no gain)", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T11:50:00Z", boredom: 20 }), base)).toBe(20);
  });
  it("adds +10 for 15 minutes idle", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T11:45:00Z", boredom: 20 }), base)).toBe(30);
  });
  it("adds +20 for 30 minutes idle", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T11:30:00Z", boredom: 10 }), base)).toBe(30);
  });
  it("no gain for 14 minutes idle", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-06-01T11:46:00Z", boredom: 10 }), base)).toBe(10);
  });
  it("clamps at 100 for large idle with high boredom", () => {
    expect(computeBoredom(makeState({ lastInteraction: "2025-05-31T12:00:00Z", boredom: 90 }), base)).toBe(100);
  });
});
