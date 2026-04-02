import { styleText } from "node:util";
import type { Mood, MoodConfig, MeterColor, NagatoroState, ArtHeight } from "../hooks/scripts/_types";
import { MOOD_CONFIGS, ART_HEIGHTS } from "../hooks/scripts/_types";
import { computeBoredom } from "../hooks/scripts/_mood";
import { POOLS, pickLine } from "../hooks/scripts/_dialogue";
import { loadState } from "../hooks/scripts/_helpers";

const ART_DIR = `${import.meta.dir}/../assets/art`;

export function resolveArtHeight(state: NagatoroState): ArtHeight {
  const envVal = parseInt(process.env.NAGATORO_ART_HEIGHT ?? "", 10);
  if (ART_HEIGHTS.includes(envVal as ArtHeight)) return envVal as ArtHeight;
  if (ART_HEIGHTS.includes(state.artHeight as ArtHeight)) return state.artHeight as ArtHeight;
  return 10;
}

async function readArt(mood: Mood, height: ArtHeight): Promise<string[]> {
  const candidates = [`${mood}-${height}.ans`, `${mood}-12.ans`];
  for (const f of candidates) {
    try { return (await Bun.file(`${ART_DIR}/${f}`).text()).split("\n"); } catch { /* art file optional */ }
  }
  return [];
}

export function meterBar(value: number, color: MeterColor, jealous: boolean): string {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  const ch = jealous ? "!" : "\u2588";
  const f = color === "dim" ? styleText("dim", ch.repeat(filled)) : styleText(color, ch.repeat(filled));
  return `[${f}${styleText("dim", "\u2591".repeat(empty))}]`;
}

interface StatusInput {
  context_window?: { used_percentage?: number };
}

const CTX_WARNINGS: { min: number; artMood: Mood; quotes: string[] }[] = [
  { min: 90, artMood: "serious", quotes: [
    "...Senpai. Start a new session. Now.",
    "...this is bad. Save your work, Senpai.",
  ]},
  { min: 80, artMood: "flustered", quotes: [
    "S-Senpai! Your memory! Save it!",
    "W-we're running out of space!!",
  ]},
  { min: 60, artMood: "smug", quotes: [
    "Senpai's brain is getting full~",
    "Running out of room in there~?",
  ]},
];

export function ctxOverride(pct: number): { artMood: Mood; cfg: MoodConfig; quote: string } | null {
  for (const w of CTX_WARNINGS) {
    if (pct >= w.min) return { artMood: w.artMood, cfg: MOOD_CONFIGS[w.artMood], quote: `${pickLine(w.quotes)} [ctx:${Math.round(pct)}%]` };
  }
  return null;
}

function buildInfoLines(
  state: NagatoroState, cfg: MoodConfig, quote: string, liveBoredom: number,
): string[] {
  const bar = meterBar(state.senpaiMeter, cfg.meterColor, state.mood === "jealous");
  const respectBar = meterBar(state.respect, "cyan", false);
  const boredomBar = meterBar(liveBoredom, "dim", false);
  return [
    `${cfg.emoji} ${cfg.label}`,
    "",
    quote,
    "",
    `Senpai  ${bar} ${state.senpaiMeter}%`,
    `Respect ${respectBar} ${state.respect}%`,
    `Boredom ${boredomBar} ${liveBoredom}%`,
    "",
    `Pats: ${state.totalPats}  Swears: ${state.totalInsults}  Genuine: ${state.genuineMoments}`,
    state.jealousyTarget ? `Rival: ${state.jealousyTarget}` : "",
  ];
}

function mergeColumns(artLines: string[], info: string[]): string {
  const rows = Math.max(artLines.length, info.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    lines.push(`${artLines[i] ?? ""}  ${info[i] ?? ""}`);
  }
  return lines.join("\n");
}

async function main() {
  let input: StatusInput = {};
  try { input = await Bun.stdin.json(); } catch { /* stdin unavailable */ }

  const state = await loadState();
  const pct = input.context_window?.used_percentage ?? 0;
  const override = ctxOverride(pct);

  const cfg = override?.cfg ?? MOOD_CONFIGS[state.mood] ?? MOOD_CONFIGS.teasing;
  const quote = override?.quote ?? pickLine(POOLS[state.mood] ?? POOLS.teasing);
  const liveBoredom = computeBoredom(state, new Date());
  const info = buildInfoLines(state, cfg, quote, liveBoredom);

  const height = resolveArtHeight(state);
  const artLines = await readArt(override?.artMood ?? state.mood, height);
  const output = artLines.length === 0 ? info.join("\n") : mergeColumns(artLines, info);
  await Bun.write(Bun.stdout, output + "\n");
}

main().catch((e) => console.error("[statusline]", e));
