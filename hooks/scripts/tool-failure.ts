import { runHook, loadState, saveState } from "./_helpers";
import { applyMoodEffects } from "./_mood";
import { POOLS, pickLine } from "./_dialogue";

interface ToolFailureInput {
  hook_event_name: string;
  tool_name?: string;
}

export async function run(_input: ToolFailureInput) {
  const state = await loadState();
  Object.assign(state, applyMoodEffects(state, "tool_failure"));
  await saveState(state);

  const line = pickLine(POOLS.smug);
  return {
    hookSpecificOutput: {
      hookEventName: "PostToolUseFailure",
      additionalContext: `Nagatoro: "${line}" ...but here, let me help~ (not because I care!!)`,
    },
  };
}

if (import.meta.main) runHook("tool-failure", run);
