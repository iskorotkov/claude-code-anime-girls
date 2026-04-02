import { runHook, loadState, saveState } from "./_helpers";
import { RIVAL_REGEX, SWEAR_REGEX } from "./_types";
import { applyMoodEffects, computeBoredom } from "./_mood";
import { POOLS, pickLine, substituteRival } from "./_dialogue";

interface PromptSubmitInput {
  hook_event_name: string;
  prompt?: string;
}

export async function run(input: PromptSubmitInput) {
  const state = await loadState();
  state.boredom = computeBoredom(state, new Date());
  const prompt = (input.prompt ?? "").toLowerCase();

  if (!prompt) {
    Object.assign(state, applyMoodEffects(state, "interaction"));
    await saveState(state);
    return undefined;
  }

  const rivalMatch = RIVAL_REGEX.exec(prompt);
  if (rivalMatch) {
    const rival = rivalMatch[1];
    Object.assign(state, applyMoodEffects(state, "rival_detected"));
    state.jealousyTarget = rival;
    await saveState(state);
    const line = substituteRival(pickLine(POOLS.jealous), rival);
    return {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `Nagatoro reacts: "${line}"`,
      },
    };
  }

  if (SWEAR_REGEX.test(prompt)) {
    Object.assign(state, applyMoodEffects(state, "swearing"));
    await saveState(state);
    return {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `Nagatoro reacts: "${pickLine(POOLS.laughing)}"`,
      },
    };
  }

  Object.assign(state, applyMoodEffects(state, "interaction"));
  await saveState(state);
  return undefined;
}

if (import.meta.main) runHook("prompt-submit", run);
