import { mkdir } from "node:fs/promises";
import { ART_HEIGHTS, DEFAULT_STATE, MOOD_CONFIGS, type ArtHeight, type Mood, type NagatoroState } from "./_types";

function getStatePath(): string {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) return `${pluginData}/state.json`;
  return `${process.env.HOME}/.claude/nagatoro-state.json`;
}

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
    const raw = await Bun.file(getStatePath()).text();
    return sanitizeState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: NagatoroState): Promise<void> {
  try {
    await Bun.write(getStatePath(), JSON.stringify(state));
  } catch {
    const dir = getStatePath().substring(0, getStatePath().lastIndexOf("/"));
    await mkdir(dir, { recursive: true });
    await Bun.write(getStatePath(), JSON.stringify(state));
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const VALID_MOODS: Set<string> = new Set(Object.keys(MOOD_CONFIGS));

function sanitizeNumber(v: unknown, fallback: number, min: number, max: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return clamp(v, min, max);
}

function sanitizeCounter(v: unknown, fallback: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.max(0, Math.floor(v));
}

export function sanitizeState(raw: Record<string, unknown>): NagatoroState {
  return {
    mood: VALID_MOODS.has(raw.mood as string) ? raw.mood as Mood : DEFAULT_STATE.mood,
    senpaiMeter: sanitizeNumber(raw.senpaiMeter, DEFAULT_STATE.senpaiMeter, 0, 100),
    boredom: sanitizeNumber(raw.boredom, DEFAULT_STATE.boredom, 0, 100),
    respect: sanitizeNumber(raw.respect, DEFAULT_STATE.respect, 0, 100),
    jealousyTarget: typeof raw.jealousyTarget === "string" ? raw.jealousyTarget : null,
    lastInteraction: typeof raw.lastInteraction === "string" && !isNaN(new Date(raw.lastInteraction).getTime()) ? raw.lastInteraction : null,
    lastResetDate: typeof raw.lastResetDate === "string" && !isNaN(new Date(raw.lastResetDate).getTime()) ? raw.lastResetDate : null,
    totalPats: sanitizeCounter(raw.totalPats, DEFAULT_STATE.totalPats),
    totalInsults: sanitizeCounter(raw.totalInsults, DEFAULT_STATE.totalInsults),
    genuineMoments: sanitizeCounter(raw.genuineMoments, DEFAULT_STATE.genuineMoments),
    consecutiveErrors: sanitizeCounter(raw.consecutiveErrors, DEFAULT_STATE.consecutiveErrors),
    interactionCount: sanitizeCounter(raw.interactionCount, DEFAULT_STATE.interactionCount),
    moodLockedFor: sanitizeCounter(raw.moodLockedFor, DEFAULT_STATE.moodLockedFor),
    artHeight: ART_HEIGHTS.includes(raw.artHeight as any) ? raw.artHeight as ArtHeight : DEFAULT_STATE.artHeight,
  };
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function applyDailyReset(state: NagatoroState, today: string): NagatoroState {
  if (state.lastResetDate === today) return state;
  return {
    ...DEFAULT_STATE,
    lastInteraction: state.lastInteraction,
    artHeight: state.artHeight,
    lastResetDate: today,
    totalPats: state.totalPats,
    totalInsults: state.totalInsults,
    genuineMoments: state.genuineMoments,
  };
}
