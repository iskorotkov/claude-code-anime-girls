import { loadState, saveState } from "./_helpers";
import { applyMoodEffects, type MoodTrigger } from "./_mood";
import { ART_HEIGHTS, type ArtHeight } from "./_types";

const ACTIONS: Record<string, MoodTrigger> = {
  "--pat": "pat",
  "--compliment": "compliment",
  "--feed": "feed",
};

const flag = process.argv[2];
const state = await loadState();
const trigger = ACTIONS[flag];

if (flag === "--resize") {
  const h = parseInt(process.argv[3] ?? "", 10);
  if (!ART_HEIGHTS.includes(h as ArtHeight)) {
    console.error(`Invalid height. Valid: ${ART_HEIGHTS.join(", ")}`);
    process.exit(1);
  }
  state.artHeight = h as ArtHeight;
  await saveState(state);
} else if (trigger) {
  Object.assign(state, applyMoodEffects(state, trigger));
  await saveState(state);
} else if (flag !== "--read") {
  console.error(`Unknown flag: ${flag}`);
  process.exit(1);
}

console.log(JSON.stringify(state, null, 2));
