import { loadState, saveState } from "./_helpers";
import { applyMoodEffects, type MoodTrigger } from "./_mood";

const ACTIONS: Record<string, MoodTrigger> = {
  "--pat": "pat",
  "--compliment": "compliment",
  "--feed": "feed",
};

const flag = process.argv[2];
const state = await loadState();

const trigger = ACTIONS[flag];
if (trigger) {
  Object.assign(state, applyMoodEffects(state, trigger));
  await saveState(state);
} else if (flag !== "--read") {
  console.error(`Unknown flag: ${flag}`);
  process.exit(1);
}

console.log(JSON.stringify(state, null, 2));
