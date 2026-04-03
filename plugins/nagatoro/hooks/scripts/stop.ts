import { runHook, loadState, saveState } from "./_helpers";
import { applyMoodEffects } from "./_mood";

interface StopInput {
  hook_event_name: string;
  stop_hook_active?: boolean;
  stop_reason?: string;
}

export async function run(input: StopInput): Promise<undefined> {
  if (input.stop_hook_active) return undefined;
  if (input.stop_reason !== "end_turn") return undefined;

  const state = await loadState();
  Object.assign(state, applyMoodEffects(state, "task_success"));
  await saveState(state);

  return undefined;
}

if (import.meta.main) runHook("stop", run);
