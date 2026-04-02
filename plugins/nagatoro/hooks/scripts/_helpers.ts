import { mkdir } from "node:fs/promises";
import { DEFAULT_STATE, type NagatoroState } from "./_types";

const STATE_PATH = (() => {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) return `${pluginData}/state.json`;
  return `${process.env.HOME}/.claude/nagatoro-state.json`;
})();

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

export async function loadState(): Promise<NagatoroState> {
  try {
    const raw = await Bun.file(STATE_PATH).text();
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: NagatoroState): Promise<void> {
  try {
    await Bun.write(STATE_PATH, JSON.stringify(state));
  } catch {
    const dir = STATE_PATH.substring(0, STATE_PATH.lastIndexOf("/"));
    await mkdir(dir, { recursive: true });
    await Bun.write(STATE_PATH, JSON.stringify(state));
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

