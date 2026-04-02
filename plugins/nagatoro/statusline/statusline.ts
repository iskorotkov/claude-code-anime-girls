import { styleText } from "node:util";
import type { Mood, NagatoroState, MoodConfig } from "../hooks/scripts/_types";
import { DEFAULT_STATE, MOOD_CONFIGS } from "../hooks/scripts/_types";
import { computeBoredom } from "../hooks/scripts/_mood";

const ART_DIR = `${import.meta.dir}/../assets/art`;

const QUOTES: Record<Mood, string[]> = {
  teasing:   ["Sen~pai~ Your code is gross~", "Are you even trying, Senpai?", "Gross~ but I'll let it slide~"],
  smug:      ["Too easy for me~", "You need me, admit it~", "Senpai can't do anything alone~"],
  jealous:   ["WHO is that other AI?!", "You don't need anyone else!", "Am I not good enough?!"],
  flustered: ["I-It's not like I care!", "D-Don't look at me!", "W-Whatever, Senpai..."],
  bored:     ["...", "This is so dull.", "Wake me when it's interesting."],
  serious:   ["I believe in you, Senpai.", "Focus up, Senpai.", "You've got this."],
  happy:     ["This is actually fun!", "Keep going, Senpai~!", "Hehe~ nice one!"],
  laughing:  ["AHAHA Senpai you're hopeless!", "Pfft-- seriously?!", "LOL what was THAT?!"],
};

export function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function readState(): Promise<NagatoroState> {
  const paths: string[] = [];
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) paths.push(`${pluginData}/state.json`);
  paths.push(`${process.env.HOME}/.claude/nagatoro-state.json`);
  for (const p of paths) {
    try { return { ...DEFAULT_STATE, ...JSON.parse(await Bun.file(p).text()) }; } catch {}
  }
  return DEFAULT_STATE;
}

async function readArt(mood: Mood): Promise<string[]> {
  const candidates = [`${mood}-10.ans`, "default-10.ans"];
  for (const f of candidates) {
    try { return (await Bun.file(`${ART_DIR}/${f}`).text()).split("\n"); } catch {}
  }
  return [];
}

export function meterBar(value: number, color: string, jealous: boolean): string {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  const ch = jealous ? "!" : "\u2588";
  const f = color === "dim" ? styleText("dim", ch.repeat(filled)) : styleText(color as any, ch.repeat(filled));
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
    if (pct >= w.min) return { artMood: w.artMood, cfg: MOOD_CONFIGS[w.artMood], quote: `${pick(w.quotes)} [ctx:${Math.round(pct)}%]` };
  }
  return null;
}

async function main() {
  let input: StatusInput = {};
  try { input = await Bun.stdin.json(); } catch {}

  const state = await readState();
  const pct = input.context_window?.used_percentage ?? 0;
  const override = ctxOverride(pct);

  const cfg = override?.cfg ?? MOOD_CONFIGS[state.mood] ?? MOOD_CONFIGS.teasing;
  const quote = override?.quote ?? pick(QUOTES[state.mood] ?? QUOTES.teasing);
  const bar = meterBar(state.senpaiMeter, cfg.meterColor, state.mood === "jealous");

  const artMood = override?.artMood ?? state.mood;
  const artLines = await readArt(artMood);
  const respectBar = meterBar(state.respect, "cyan", false);
  const liveBoredom = computeBoredom(state, new Date());
  const boredomBar = meterBar(liveBoredom, "dim", false);
  const info = [
    `${cfg.emoji} ${cfg.label}`,
    ``,
    `${quote}`,
    ``,
    `Senpai  ${bar} ${state.senpaiMeter}%`,
    `Respect ${respectBar} ${state.respect}%`,
    `Boredom ${boredomBar} ${liveBoredom}%`,
    ``,
    `Pats: ${state.totalPats}  Swears: ${state.totalInsults}  Genuine: ${state.genuineMoments}`,
    state.jealousyTarget ? `Rival: ${state.jealousyTarget}` : ``,
  ];

  if (artLines.length === 0) {
    await Bun.write(Bun.stdout, info.join("\n") + "\n");
    return;
  }

  const rows = Math.max(artLines.length, info.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    const art = artLines[i] ?? "";
    const text = info[i] ?? "";
    lines.push(`${art}  ${text}`);
  }
  await Bun.write(Bun.stdout, lines.join("\n") + "\n");
}

main().catch(() => {});
