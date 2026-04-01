import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { DEFAULT_STATE, type NagatoroState } from "./_types";

export async function runHook<I, O>(
  name: string,
  fn: (input: I) => O | Promise<O>,
): Promise<void> {
  try {
    const raw = await Bun.stdin.text();
    const input = JSON.parse(raw) as I;
    const result = await fn(input);
    if (result) console.log(JSON.stringify(result));
  } catch (e) {
    console.error(`[hook:${name}] ${e}`);
  }
}

function statePath(): string {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) return `${pluginData}/state.json`;
  return `${process.env.HOME}/.claude/nagatoro-state.json`;
}

export async function loadState(): Promise<NagatoroState> {
  try {
    const raw = await readFile(statePath(), "utf-8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: NagatoroState): Promise<void> {
  const path = statePath();
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

if (import.meta.main) {
  const flag = process.argv[2];
  const state = await loadState();

  switch (flag) {
    case "--read":
      break;
    case "--pat":
      state.mood = "flustered";
      state.senpaiMeter = clamp(state.senpaiMeter + 2, 0, 100);
      state.totalPats++;
      state.moodDecayCounter = 0;
      state.lastInteraction = new Date().toISOString();
      await saveState(state);
      break;
    case "--compliment":
      state.mood = "flustered";
      state.senpaiMeter = clamp(state.senpaiMeter + 3, 0, 100);
      state.moodDecayCounter = 0;
      state.lastInteraction = new Date().toISOString();
      await saveState(state);
      break;
    case "--feed":
      state.senpaiMeter = clamp(state.senpaiMeter + 1, 0, 100);
      state.boredom = clamp(state.boredom - 10, 0, 100);
      state.moodDecayCounter = 0;
      state.lastInteraction = new Date().toISOString();
      await saveState(state);
      break;
    default:
      console.error(`Unknown flag: ${flag}`);
      process.exit(1);
  }

  console.log(JSON.stringify(state, null, 2));
}
