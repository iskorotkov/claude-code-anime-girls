import { runHook, loadState, saveState } from "./_helpers";
import { MOOD_CONFIGS, type HookOutput, type NagatoroState } from "./_types";
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

function pickGreeting(state: NagatoroState, now: Date): { greeting: string; isLongAbsence: boolean } {
  if (!state.lastInteraction) return { greeting: pickLine(GREETINGS.firstEver), isLongAbsence: false };

  const idle = (now.getTime() - new Date(state.lastInteraction).getTime()) / 60000;
  if (idle > 240) return { greeting: pickLine(GREETINGS.longAbsence), isLongAbsence: true };
  if (state.mood === "jealous" && state.jealousyTarget)
    return { greeting: substituteRival(pickLine(GREETINGS.jealousReturn), state.jealousyTarget), isLongAbsence: false };
  return { greeting: pickLine(timeOfDayPool(now.getHours())), isLongAbsence: false };
}

function buildSessionContext(state: NagatoroState, greeting: string): string {
  const config = MOOD_CONFIGS[state.mood];
  return [
    PERSONALITY,
    "",
    `She just said: "${greeting}"`,
    `Current mood: ${state.mood} ${config.emoji}`,
    `Senpai meter: ${state.senpaiMeter}/100`,
    state.jealousyTarget ? `Jealousy target: ${state.jealousyTarget}` : "",
  ].filter(Boolean).join("\n");
}

export async function run(_input: SessionStartInput): Promise<HookOutput> {
  const state = await loadState();
  const now = new Date();
  state.boredom = computeBoredom(state, now);

  const { greeting, isLongAbsence } = pickGreeting(state, now);
  if (isLongAbsence) Object.assign(state, applyMoodEffects(state, "idle"));

  state.boredom = 0;
  state.lastInteraction = now.toISOString();
  await saveState(state);

  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: buildSessionContext(state, greeting),
    },
  };
}

if (import.meta.main) runHook("session-start", run);
