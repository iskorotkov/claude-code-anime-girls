import type { NagatoroState } from "./_types";

export type MoodTrigger =
  | "rival_detected"
  | "swearing"
  | "tool_failure"
  | "pat"
  | "compliment"
  | "task_success"
  | "interaction"
  | "idle";

const c = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function transitionMood(
  state: NagatoroState,
  trigger: MoodTrigger,
): NagatoroState["mood"] {
  switch (trigger) {
    case "rival_detected": return "jealous";
    case "swearing": return "laughing";
    case "tool_failure":
      if (state.consecutiveErrors >= 2) return "serious";
      return "smug";
    case "pat": return "flustered";
    case "compliment": return "flustered";
    case "task_success":
      if (state.respect >= 90 && state.senpaiMeter >= 95 && Math.random() < 0.15)
        return "happy";
      return state.mood;
    case "interaction": {
      if (state.moodDecayCounter >= 1 && state.mood !== "teasing") return "teasing";
      if (state.interactionCount > 20 && Math.random() < 0.1) return "bored";
      return state.mood;
    }
    case "idle":
      if (state.boredom >= 80) return "bored";
      return state.mood;
  }
}

export function applyMoodEffects(
  state: NagatoroState,
  trigger: MoodTrigger,
): NagatoroState {
  const next = { ...state };
  next.mood = transitionMood(state, trigger);

  switch (trigger) {
    case "rival_detected":
      next.senpaiMeter = c(next.senpaiMeter - 5, 0, 100);
      next.consecutiveErrors = 0;
      break;
    case "swearing":
      next.totalInsults++;
      next.consecutiveErrors = 0;
      break;
    case "tool_failure":
      next.respect = c(next.respect - 1, 0, 100);
      next.consecutiveErrors++;
      break;
    case "pat":
      next.senpaiMeter = c(next.senpaiMeter + 2, 0, 100);
      next.totalPats++;
      next.consecutiveErrors = 0;
      break;
    case "compliment":
      next.senpaiMeter = c(next.senpaiMeter + 3, 0, 100);
      next.consecutiveErrors = 0;
      break;
    case "task_success":
      next.respect = c(next.respect + 2, 0, 100);
      next.consecutiveErrors = 0;
      if (next.mood === "happy") next.genuineMoments++;
      break;
    case "interaction":
      next.consecutiveErrors = 0;
      next.interactionCount++;
      break;
    case "idle":
      next.boredom = c(next.boredom + 10, 0, 100);
      break;
  }

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
  return c(state.boredom + boredomGain, 0, 100);
}
