import { runHook, loadState, saveState } from "./_helpers";
import { applyMoodEffects } from "./_mood";

interface ToolFailureInput {
  hook_event_name: string;
  tool_name?: string;
}

export async function run(_input: ToolFailureInput): Promise<undefined> {
  const state = await loadState();
  Object.assign(state, applyMoodEffects(state, "tool_failure"));
  await saveState(state);
  return undefined;
}

if (import.meta.main) runHook("tool-failure", run);
