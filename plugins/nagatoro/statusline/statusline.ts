import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { styleText } from "node:util";

type Mood = "teasing" | "smug" | "jealous" | "flustered" | "bored" | "serious" | "happy" | "laughing";

interface NagatoroState {
  mood: Mood;
  senpaiMeter: number;
  boredom: number;
  respect: number;
  jealousyTarget: string | null;
  lastInteraction: string | null;
  totalPats: number;
  totalInsults: number;
  genuineMoments: number;
  moodDecayCounter: number;
}

interface MoodConfig {
  emoji: string;
  label: string;
  meterColor: string;
}

const DEFAULT_STATE: NagatoroState = {
  mood: "teasing", senpaiMeter: 50, boredom: 0, respect: 50,
  jealousyTarget: null, lastInteraction: null,
  totalPats: 0, totalInsults: 0, genuineMoments: 0, moodDecayCounter: 0,
};

const MOOD_CONFIGS: Record<Mood, MoodConfig> = {
  teasing:   { emoji: "🎀", label: "★ Teasing  ", meterColor: "yellow" },
  smug:      { emoji: "😈", label: "★★ Smug    ", meterColor: "yellow" },
  jealous:   { emoji: "💢", label: "!! Jealous ", meterColor: "red" },
  flustered: { emoji: "💕", label: "   F-fine!!", meterColor: "magenta" },
  bored:     { emoji: "💤", label: "   Bored   ", meterColor: "dim" },
  serious:   { emoji: "💙", label: "   Serious ", meterColor: "blue" },
  happy:     { emoji: "🌸", label: "   Happy   ", meterColor: "magenta" },
  laughing:  { emoji: "😂", label: "   Laughing", meterColor: "yellow" },
};

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

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function readState(): NagatoroState {
  const paths: string[] = [];
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) paths.push(`${pluginData}/state.json`);
  paths.push(`${process.env.HOME}/.claude/nagatoro-state.json`);
  for (const p of paths) {
    try { return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(p, "utf-8")) }; } catch {}
  }
  return DEFAULT_STATE;
}

function readArt(mood: Mood): string[] {
  const artDir = resolve(dirname(import.meta.dir), "assets", "art");
  const candidates = [`${mood}-10.ans`, "default-10.ans"];
  for (const f of candidates) {
    try { return readFileSync(resolve(artDir, f), "utf-8").split("\n"); } catch {}
  }
  return [];
}

function meterBar(value: number, color: string, jealous: boolean): string {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  const ch = jealous ? "!" : "\u2588";
  const f = color === "dim" ? styleText("dim", ch.repeat(filled)) : styleText(color as any, ch.repeat(filled));
  return `[${f}${styleText("dim", "\u2591".repeat(empty))}]`;
}

interface StatusInput {
  context_window?: { used_percentage?: number };
}

const CTX_WARNINGS: { min: number; cfg: MoodConfig; quotes: string[] }[] = [
  { min: 90, cfg: { emoji: "💙", label: "   Serious ", meterColor: "blue" }, quotes: [
    "...Senpai. Start a new session. Now.",
    "...this is bad. Save your work, Senpai.",
  ]},
  { min: 80, cfg: { emoji: "💕", label: "♡  F-fine!!", meterColor: "magenta" }, quotes: [
    "S-Senpai! Your memory! Save it!",
    "W-we're running out of space!!",
  ]},
  { min: 60, cfg: { emoji: "😈", label: "★★ Smug    ", meterColor: "yellow" }, quotes: [
    "Senpai's brain is getting full~",
    "Running out of room in there~?",
  ]},
];

function ctxOverride(pct: number): { cfg: MoodConfig; quote: string } | null {
  for (const w of CTX_WARNINGS) {
    if (pct >= w.min) return { cfg: w.cfg, quote: `${pick(w.quotes)} [ctx:${Math.round(pct)}%]` };
  }
  return null;
}

async function main() {
  let input: StatusInput = {};
  try { input = await Bun.stdin.json(); } catch {}

  const state = readState();
  const pct = input.context_window?.used_percentage ?? 0;
  const override = ctxOverride(pct);

  const cfg = override?.cfg ?? MOOD_CONFIGS[state.mood] ?? MOOD_CONFIGS.teasing;
  const quote = override?.quote ?? pick(QUOTES[state.mood] ?? QUOTES.teasing);
  const bar = meterBar(state.senpaiMeter, cfg.meterColor, state.mood === "jealous");

  const artLines = readArt(state.mood);
  const respectBar = meterBar(state.respect, "cyan", false);
  const boredomBar = meterBar(state.boredom, "dim", false);
  const info = [
    `${cfg.emoji} ${cfg.label}`,
    ``,
    `${quote}`,
    ``,
    `Senpai  ${bar} ${state.senpaiMeter}%`,
    `Respect ${respectBar} ${state.respect}%`,
    `Boredom ${boredomBar} ${state.boredom}%`,
    ``,
    `Pats: ${state.totalPats}  Swears: ${state.totalInsults}  Genuine: ${state.genuineMoments}`,
    state.jealousyTarget ? `Rival: ${state.jealousyTarget}` : ``,
  ];

  if (artLines.length === 0) {
    console.log(info.join("\n"));
    return;
  }

  const rows = Math.max(artLines.length, info.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    const art = artLines[i] ?? "";
    const text = info[i] ?? "";
    lines.push(`${art}  ${text}`);
  }
  console.log(lines.join("\n"));
}

main().catch(() => {});
