import { runHook, loadState, saveState } from "./_helpers";
import { applyMoodEffects } from "./_mood";
import { FAREWELLS, pickLine } from "./_dialogue";

interface StopInput {
  hook_event_name: string;
  stop_hook_active?: boolean;
}

export async function run(input: StopInput) {
  if (input.stop_hook_active) return undefined;

  const state = await loadState();
  Object.assign(state, applyMoodEffects(state, "task_success"));
  await saveState(state);

  const pool = FAREWELLS[state.mood] ?? FAREWELLS.default;
  const line = pickLine(pool);
  return {
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: `Nagatoro: "${line}"`,
    },
  };
}

if (import.meta.main) runHook("stop", run);
