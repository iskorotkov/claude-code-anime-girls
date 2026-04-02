import { runHook, loadState, saveState } from "./_helpers";
import { RIVAL_REGEX, SWEAR_REGEX, type HookOutput, type NagatoroState } from "./_types";
import { applyMoodEffects, computeBoredom } from "./_mood";
import type { MoodTrigger } from "./_mood";
import { POOLS, pickLine, substituteRival } from "./_dialogue";

interface PromptSubmitInput {
  hook_event_name: string;
  prompt?: string;
}

function detectTrigger(
  prompt: string, state: NagatoroState,
): { trigger: MoodTrigger; reaction: string | null; jealousyTarget?: string } {
  if (!prompt) return { trigger: "interaction", reaction: null };

  const rivalMatch = RIVAL_REGEX.exec(prompt);
  if (rivalMatch) {
    const rival = rivalMatch[1];
    const line = substituteRival(pickLine(POOLS.jealous), rival);
    return { trigger: "rival_detected", reaction: `Nagatoro reacts: "${line}"`, jealousyTarget: rival };
  }

  if (SWEAR_REGEX.test(prompt)) {
    return { trigger: "swearing", reaction: `Nagatoro reacts: "${pickLine(POOLS.laughing)}"` };
  }

  return { trigger: "interaction", reaction: null };
}

export async function run(input: PromptSubmitInput): Promise<HookOutput | undefined> {
  const state = await loadState();
  state.boredom = computeBoredom(state, new Date());
  const prompt = (input.prompt ?? "").toLowerCase();

  const { trigger, reaction, jealousyTarget } = detectTrigger(prompt, state);
  Object.assign(state, applyMoodEffects(state, trigger));
  if (jealousyTarget) state.jealousyTarget = jealousyTarget;
  await saveState(state);

  if (!reaction) return undefined;
  return { hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: reaction } };
}

if (import.meta.main) runHook("prompt-submit", run);
