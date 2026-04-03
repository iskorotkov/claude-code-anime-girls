import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { applyMoodEffects, computeBoredom, type MoodTrigger } from "./_mood";
import { makeState } from "./_test-utils";

let randomSpy: ReturnType<typeof spyOn>;
afterEach(() => { randomSpy?.mockRestore(); });

describe("senpaiMeter lifecycle", () => {
  it("accumulates across pat, compliment, feed", () => {
    let s = makeState({ senpaiMeter: 50 });
    s = applyMoodEffects(s, "pat");       // +2 = 52
    s = applyMoodEffects(s, "compliment"); // +3 = 55
    s = applyMoodEffects(s, "feed");      // +1 = 56
    expect(s.senpaiMeter).toBe(56);
  });

  it("decreases via repeated rival_detected", () => {
    let s = makeState({ senpaiMeter: 50 });
    s = applyMoodEffects(s, "rival_detected"); // -5 = 45
    s = applyMoodEffects(s, "rival_detected"); // -5 = 40
    expect(s.senpaiMeter).toBe(40);
  });

  it("net change from mixed triggers", () => {
    let s = makeState({ senpaiMeter: 50 });
    s = applyMoodEffects(s, "pat");            // +2 = 52
    s = applyMoodEffects(s, "rival_detected"); // -5 = 47
    s = applyMoodEffects(s, "compliment");     // +3 = 50
    expect(s.senpaiMeter).toBe(50);
  });
});

describe("respect lifecycle", () => {
  it("accumulates across task_success", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    let s = makeState({ respect: 50 });
    s = applyMoodEffects(s, "task_success"); // +2 = 52
    s = applyMoodEffects(s, "task_success"); // +2 = 54
    expect(s.respect).toBe(54);
  });

  it("decreases via repeated tool_failure", () => {
    let s = makeState({ respect: 50 });
    s = applyMoodEffects(s, "tool_failure"); // -1 = 49
    s = applyMoodEffects(s, "tool_failure"); // -1 = 48
    s = applyMoodEffects(s, "tool_failure"); // -1 = 47
    expect(s.respect).toBe(47);
  });
});

describe("boredom lifecycle", () => {
  it("round-trips through idle and interaction", () => {
    let s = makeState({ boredom: 30 });
    s = applyMoodEffects(s, "idle");        // +10 = 40
    s = applyMoodEffects(s, "idle");        // +10 = 50
    s = applyMoodEffects(s, "interaction"); // -10 = 40
    s = applyMoodEffects(s, "feed");        // -10 = 30
    expect(s.boredom).toBe(30);
  });

  it("idle triggers bored mood only after boredom reaches 80", () => {
    let s = makeState({ boredom: 70, mood: "teasing" });
    s = applyMoodEffects(s, "idle"); // old boredom 70 < 80: mood stays teasing, boredom -> 80
    expect(s.mood).toBe("teasing");
    expect(s.boredom).toBe(80);
    s = applyMoodEffects(s, "idle"); // old boredom 80 >= 80: mood -> bored, boredom -> 90
    expect(s.mood).toBe("bored");
    expect(s.boredom).toBe(90);
  });

  it("computeBoredom adds time-based gain then interaction reduces it", () => {
    const base = new Date("2025-06-01T12:00:00Z");
    const s = makeState({ lastInteraction: "2025-06-01T11:30:00Z", boredom: 20 });
    const computed = computeBoredom(s, base); // 30min = 2*15min intervals = +20 -> 40
    expect(computed).toBe(40);
    const s2 = applyMoodEffects({ ...s, boredom: computed }, "interaction"); // -10 = 30
    expect(s2.boredom).toBe(30);
  });
});

describe("counter monotonicity", () => {
  it("counters never decrease through any trigger", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(1);
    const triggers: MoodTrigger[] = [
      "rival_detected", "swearing", "tool_failure", "pat",
      "compliment", "task_success", "interaction", "idle", "feed",
    ];
    let s = makeState({ totalPats: 5, totalInsults: 3, genuineMoments: 2 });
    for (const trigger of triggers) {
      const next = applyMoodEffects(s, trigger);
      expect(next.totalPats).toBeGreaterThanOrEqual(s.totalPats);
      expect(next.totalInsults).toBeGreaterThanOrEqual(s.totalInsults);
      expect(next.genuineMoments).toBeGreaterThanOrEqual(s.genuineMoments);
      s = next;
    }
  });
});

describe("counter isolation", () => {
  it("pat increments totalPats only", () => {
    const s = makeState({ totalPats: 0, totalInsults: 5, genuineMoments: 3 });
    const next = applyMoodEffects(s, "pat");
    expect(next.totalPats).toBe(1);
    expect(next.totalInsults).toBe(5);
    expect(next.genuineMoments).toBe(3);
  });

  it("swearing increments totalInsults only", () => {
    const s = makeState({ totalPats: 5, totalInsults: 0, genuineMoments: 3 });
    const next = applyMoodEffects(s, "swearing");
    expect(next.totalPats).toBe(5);
    expect(next.totalInsults).toBe(1);
    expect(next.genuineMoments).toBe(3);
  });

  it("task_success when happy increments genuineMoments only", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.24);
    const s = makeState({
      totalPats: 5, totalInsults: 3, genuineMoments: 0,
      respect: 75, senpaiMeter: 80,
    });
    const next = applyMoodEffects(s, "task_success");
    expect(next.totalPats).toBe(5);
    expect(next.totalInsults).toBe(3);
    expect(next.genuineMoments).toBe(1);
  });
});

describe("genuineMoments pipeline", () => {
  it("increments when task_success transitions to happy", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.24);
    const s = makeState({ respect: 75, senpaiMeter: 80, genuineMoments: 0 });
    const next = applyMoodEffects(s, "task_success");
    expect(next.mood).toBe("happy");
    expect(next.genuineMoments).toBe(1);
    expect(next.respect).toBe(77);
  });

  it("does not increment when random blocks happy transition", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.25);
    const s = makeState({ respect: 75, senpaiMeter: 80, genuineMoments: 0, mood: "teasing" });
    const next = applyMoodEffects(s, "task_success");
    expect(next.mood).toBe("teasing");
    expect(next.genuineMoments).toBe(0);
    expect(next.respect).toBe(77); // respect still increases regardless
  });
});

describe("happy persistence lifecycle", () => {
  it("happy mood persists one interaction then decays", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.24);
    let s = applyMoodEffects(makeState({ respect: 75, senpaiMeter: 80 }), "task_success");
    expect(s.mood).toBe("happy");
    expect(s.moodLockedFor).toBe(1);
    randomSpy.mockRestore();
    s = applyMoodEffects(s, "interaction"); // locked: stays happy, lock decrements
    expect(s.mood).toBe("happy");
    expect(s.moodLockedFor).toBe(0);
    s = applyMoodEffects(s, "interaction"); // unlocked: decays to teasing
    expect(s.mood).toBe("teasing");
  });

  it("rival_detected breaks lock and transitions to jealous", () => {
    randomSpy = spyOn(Math, "random").mockReturnValue(0.24);
    let s = applyMoodEffects(makeState({ respect: 75, senpaiMeter: 80 }), "task_success");
    expect(s.mood).toBe("happy");
    expect(s.moodLockedFor).toBe(1);
    randomSpy.mockRestore();
    s = applyMoodEffects(s, "rival_detected");
    expect(s.mood).toBe("jealous");
    expect(s.moodLockedFor).toBe(0);
  });
});
