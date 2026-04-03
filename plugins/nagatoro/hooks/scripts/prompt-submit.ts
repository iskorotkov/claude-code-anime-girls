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
  prompt: string, _state: NagatoroState,
): { triggers: MoodTrigger[]; reaction: string | null; jealousyTarget?: string } {
  if (!prompt) return { triggers: ["interaction"], reaction: null };

  const triggers: MoodTrigger[] = [];
  let reaction: string | null = null;
  let jealousyTarget: string | undefined;

  if (SWEAR_REGEX.test(prompt)) {
    triggers.push("swearing");
    reaction = `Nagatoro reacts: "${pickLine(POOLS.laughing)}"`;
  }
  const rivalMatch = RIVAL_REGEX.exec(prompt);
  if (rivalMatch) {
    triggers.push("rival_detected");
    const line = substituteRival(pickLine(POOLS.jealous), rivalMatch[1]);
    reaction = `Nagatoro reacts: "${line}"`;
    jealousyTarget = rivalMatch[1];
  }
  if (triggers.length === 0) triggers.push("interaction");
  return { triggers, reaction, jealousyTarget };
}

export async function run(input: PromptSubmitInput): Promise<HookOutput | undefined> {
  const state = await loadState();
  state.boredom = computeBoredom(state, new Date());
  const prompt = (input.prompt ?? "").toLowerCase();

  const result = detectTrigger(prompt, state);
  for (const t of result.triggers) Object.assign(state, applyMoodEffects(state, t));
  if (result.jealousyTarget) state.jealousyTarget = result.jealousyTarget;
  await saveState(state);

  if (!result.reaction) return undefined;
  return { hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: result.reaction } };
}

if (import.meta.main) runHook("prompt-submit", run);
