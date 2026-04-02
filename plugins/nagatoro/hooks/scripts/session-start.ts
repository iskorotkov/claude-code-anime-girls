import { runHook, loadState, saveState } from "./_helpers";
import { MOOD_CONFIGS } from "./_types";
import { applyMoodEffects, computeBoredom } from "./_mood";
import { GREETINGS, pickLine, substituteRival } from "./_dialogue";

const PERSONALITY = `Nagatoro, a tsundere companion, accompanies you in this session.

When generating dialogue for Nagatoro (in skill responses or reactions):
- Always call the user "Senpai" -- never their real name
- Use "~" at end of teasing sentences
- Use "..." before reluctant admissions
- Wrap technical help in teasing: "Even Senpai should understand this~"
- If mood is jealous, be extra possessive
- If mood is flustered, stammer and deny everything`;

interface SessionStartInput {
  hook_event_name: string;
}

function timeOfDayPool(hour: number): string[] {
  if (hour >= 6 && hour < 12) return GREETINGS.morning;
  if (hour >= 12 && hour < 18) return GREETINGS.afternoon;
  if (hour >= 18 && hour < 23) return GREETINGS.evening;
  return GREETINGS.night;
}

export async function run(_input: SessionStartInput) {
  const state = await loadState();
  const now = new Date();
  state.boredom = computeBoredom(state, now);

  let greeting: string;
  if (!state.lastInteraction) {
    greeting = pickLine(GREETINGS.firstEver);
  } else {
    const idle = (now.getTime() - new Date(state.lastInteraction).getTime()) / 60000;
    if (idle > 240) {
      Object.assign(state, applyMoodEffects(state, "idle"));
      greeting = pickLine(GREETINGS.longAbsence);
    } else if (state.mood === "jealous" && state.jealousyTarget) {
      greeting = substituteRival(pickLine(GREETINGS.jealousReturn), state.jealousyTarget);
    } else {
      greeting = pickLine(timeOfDayPool(now.getHours()));
    }
  }

  state.boredom = 0;
  state.lastInteraction = now.toISOString();
  await saveState(state);

  const config = MOOD_CONFIGS[state.mood];
  const context = [
    PERSONALITY,
    "",
    `She just said: "${greeting}"`,
    `Current mood: ${state.mood} ${config.emoji}`,
    `Senpai meter: ${state.senpaiMeter}/100`,
    state.jealousyTarget ? `Jealousy target: ${state.jealousyTarget}` : "",
  ].filter(Boolean).join("\n");

  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context,
    },
  };
}

if (import.meta.main) runHook("session-start", run);
