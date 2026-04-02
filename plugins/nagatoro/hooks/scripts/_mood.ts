import type { NagatoroState } from "./_types";
import { clamp } from "./_helpers";

export type MoodTrigger =
  | "rival_detected"
  | "swearing"
  | "tool_failure"
  | "pat"
  | "compliment"
  | "task_success"
  | "interaction"
  | "idle"
  | "feed";

const TRANSITIONS: Record<MoodTrigger, (s: NagatoroState) => NagatoroState["mood"]> = {
  rival_detected: () => "jealous",
  swearing: () => "laughing",
  tool_failure: (s) => s.consecutiveErrors >= 2 ? "serious" : "smug",
  pat: () => "flustered",
  compliment: () => "flustered",
  task_success: (s) =>
    s.respect >= 90 && s.senpaiMeter >= 95 && Math.random() < 0.15 ? "happy" : s.mood,
  interaction: (s) => {
    if (s.moodDecayCounter >= 1 && s.mood !== "teasing") return "teasing";
    if (s.interactionCount > 20 && Math.random() < 0.1) return "bored";
    return s.mood;
  },
  idle: (s) => s.boredom >= 80 ? "bored" : s.mood,
  feed: (s) => s.mood,
};

export function transitionMood(state: NagatoroState, trigger: MoodTrigger): NagatoroState["mood"] {
  return TRANSITIONS[trigger](state);
}

const EFFECTS: Record<MoodTrigger, (s: NagatoroState) => void> = {
  rival_detected: (s) => { s.senpaiMeter = clamp(s.senpaiMeter - 5, 0, 100); s.consecutiveErrors = 0; },
  swearing: (s) => { s.totalInsults++; s.consecutiveErrors = 0; },
  tool_failure: (s) => { s.respect = clamp(s.respect - 1, 0, 100); s.consecutiveErrors++; },
  pat: (s) => { s.senpaiMeter = clamp(s.senpaiMeter + 2, 0, 100); s.totalPats++; s.consecutiveErrors = 0; },
  compliment: (s) => { s.senpaiMeter = clamp(s.senpaiMeter + 3, 0, 100); s.consecutiveErrors = 0; },
  task_success: (s) => { s.respect = clamp(s.respect + 2, 0, 100); s.consecutiveErrors = 0; if (s.mood === "happy") s.genuineMoments++; },
  interaction: (s) => { s.consecutiveErrors = 0; s.interactionCount++; s.boredom = clamp(s.boredom - 10, 0, 100); },
  idle: (s) => { s.boredom = clamp(s.boredom + 10, 0, 100); },
  feed: (s) => { s.senpaiMeter = clamp(s.senpaiMeter + 1, 0, 100); s.boredom = clamp(s.boredom - 10, 0, 100); s.consecutiveErrors = 0; },
};

export function applyMoodEffects(state: NagatoroState, trigger: MoodTrigger): NagatoroState {
  const next = { ...state };
  next.mood = transitionMood(state, trigger);
  EFFECTS[trigger](next);

  if (trigger === "interaction") {
    next.moodDecayCounter++;
  } else if (trigger !== "idle" && trigger !== "task_success") {
    next.moodDecayCounter = 0;
  }

  if (trigger !== "idle") {
    next.lastInteraction = new Date().toISOString();
  }

  return next;
}

export function computeBoredom(state: NagatoroState, now: Date): number {
  if (!state.lastInteraction) return 0;
  const last = new Date(state.lastInteraction).getTime();
  const minutesIdle = (now.getTime() - last) / 60000;
  const boredomGain = Math.floor(minutesIdle / 15) * 10;
  return clamp(state.boredom + boredomGain, 0, 100);
}
