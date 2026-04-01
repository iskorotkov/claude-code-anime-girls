import { runHook, loadState, saveState } from "./_helpers";
import { RIVAL_NAMES, SWEAR_WORDS } from "./_types";
import { applyMoodEffects } from "./_mood";
import { POOLS, pickLine, substituteRival } from "./_dialogue";

interface PromptSubmitInput {
  hook_event_name: string;
  prompt?: string;
}

export async function run(input: PromptSubmitInput) {
  const state = await loadState();
  const prompt = (input.prompt ?? "").toLowerCase();

  const rival = RIVAL_NAMES.find((name) => prompt.includes(name));
  if (rival) {
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

  const swore = SWEAR_WORDS.some((w) => prompt.includes(w));
  if (swore) {
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
