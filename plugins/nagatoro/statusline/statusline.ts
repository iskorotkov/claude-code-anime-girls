import { readFileSync } from "node:fs";
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
  face: string;
  label: string;
  meterColor: string;
}

const DEFAULT_STATE: NagatoroState = {
  mood: "teasing", senpaiMeter: 50, boredom: 0, respect: 50,
  jealousyTarget: null, lastInteraction: null,
  totalPats: 0, totalInsults: 0, genuineMoments: 0, moodDecayCounter: 0,
};

const MOOD_CONFIGS: Record<Mood, MoodConfig> = {
  teasing:   { emoji: "\u{1F380}", face: "\u30FD(\u2267w\u2266)\uFF89",  label: "\u2605 Teasing  ", meterColor: "yellow" },
  smug:      { emoji: "\u{1F608}", face: "\u256E(\u2267\u2200\u2266)\u256D",   label: "\u2605\u2605 Smug    ", meterColor: "yellow" },
  jealous:   { emoji: "\u{1F4A2}", face: "\u30FD(\u25E3\u0414\u25E2)\uFF89",  label: "!! Jealous ", meterColor: "red" },
  flustered: { emoji: "\u{1F495}", face: "\u2572(/\u03C9\\)\u2571",   label: "\u2661  F-fine!!", meterColor: "magenta" },
  bored:     { emoji: "\u{1F4A4}", face: "\u256E(\uFE36\u03C9\uFE36)\u256D",   label: "\u2606  Bored   ", meterColor: "dim" },
  serious:   { emoji: "\u{1F499}", face: "\u2570(._.) \u256F",    label: "   Serious ", meterColor: "blue" },
  happy:     { emoji: "\u{1F338}", face: "\u30FD(\u2267\u25BD\u2266)\uFF89",  label: "\u2661  Happy   ", meterColor: "magenta" },
  laughing:  { emoji: "\u{1F602}", face: "\u30FD(>\u2200<)\uFF89",  label: "   Laughing", meterColor: "yellow" },
};

const QUOTES: Record<Mood, string[]> = {
  teasing:   ["Sen~pai~ Your code is gross~", "Eww, what is this variable name?", "Are you even trying, Senpai?", "Gross~ but I'll let it slide~"],
  smug:      ["Hmph, I already knew that~", "Too easy for me~", "You need me, admit it~", "Senpai can't do anything alone~"],
  jealous:   ["WHO is that other AI?!", "You don't need anyone else!", "I saw you talking to THEM.", "Am I not good enough?!"],
  flustered: ["I-It's not like I care!", "D-Don't look at me!", "I'm only helping because I'm bored!", "W-Whatever, Senpai..."],
  bored:     ["...", "This is so dull.", "Wake me when it's interesting.", "Zzz..."],
  serious:   ["I believe in you, Senpai.", "Let's get this done.", "Focus up, Senpai.", "You've got this."],
  happy:     ["Yay~ Senpai noticed me!", "This is actually fun!", "Keep going, Senpai~!", "Hehe~ nice one!"],
  laughing:  ["AHAHA Senpai you're hopeless!", "I can't stop laughing!", "Pfft-- seriously?!", "LOL Senpai what was THAT?!"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function readState(): NagatoroState {
  const paths: string[] = [];
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) paths.push(`${pluginData}/state.json`);
  paths.push(`${process.env.HOME}/.claude/nagatoro-state.json`);
  for (const p of paths) {
    try { return JSON.parse(readFileSync(p, "utf-8")); } catch {}
  }
  return DEFAULT_STATE;
}

function meterBar(state: NagatoroState, cfg: MoodConfig): string {
  const filled = Math.round(state.senpaiMeter / 10);
  const empty = 10 - filled;
  const fillChar = state.mood === "jealous" ? "!" : "\u2588";
  const filledStr = fillChar.repeat(filled);
  const emptyStr = "\u2591".repeat(empty);
  const coloredFill = cfg.meterColor === "dim"
    ? styleText("dim", filledStr)
    : styleText(cfg.meterColor as any, filledStr);
  const coloredEmpty = styleText("dim", emptyStr);
  return `\u2661 [${coloredFill}${coloredEmpty}]`;
}

interface StatusInput {
  context_window?: { used_percentage?: number };
}

const CTX_WARNINGS: { min: number; cfg: MoodConfig; quotes: string[] }[] = [
  {
    min: 90,
    cfg: { emoji: "💙", face: "╰(._.)╯", label: "   Serious ", meterColor: "blue" },
    quotes: [
      "...Senpai. Start a new session. Now.",
      "...this is bad. Save your work, Senpai.",
      "...please. New session. I'm begging you.",
    ],
  },
  {
    min: 80,
    cfg: { emoji: "💕", face: "╲(/ω\\)╱", label: "♡  F-fine!!", meterColor: "magenta" },
    quotes: [
      "S-Senpai! Your memory! Save it!",
      "W-we're running out of space!!",
      "Senpai, compress or start fresh!!",
    ],
  },
  {
    min: 60,
    cfg: { emoji: "😈", face: "╮(≧∀≦)╭", label: "★★ Smug    ", meterColor: "yellow" },
    quotes: [
      "Senpai's brain is getting full~",
      "Running out of room in there, Senpai~?",
      "Maybe finish up soon, Senpai~",
    ],
  },
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
  const bar = meterBar(state, cfg);
  const line1 = `${cfg.emoji} ${cfg.face}  | ${cfg.label} | ${quote.padEnd(40)} | ${bar}`;

  console.log(line1);
}

main().catch(() => {});
