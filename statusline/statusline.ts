import { readFileSync } from "node:fs";
import { basename } from "node:path";
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

interface StatusInput {
  version?: string;
  model?: { display_name?: string };
  context_window?: { used_percentage?: number };
  rate_limits?: {
    five_hour?: { used_percentage?: number };
    seven_day?: { used_percentage?: number };
  };
  workspace?: { project_dir?: string };
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

function gitChanges(dir: string): string {
  let totalFiles = 0, totalIns = 0, totalDel = 0;
  try {
    const diff = Bun.spawnSync(["git", "-C", dir, "diff", "--stat", "HEAD"]);
    const diffOut = diff.stdout.toString().trim();
    if (diffOut) {
      const summary = diffOut.split("\n").pop()!;
      const f = summary.match(/(\d+) files? changed/)?.[1];
      const i = summary.match(/(\d+) insertions?/)?.[1];
      const d = summary.match(/(\d+) deletions?/)?.[1];
      if (f) totalFiles += Number(f);
      if (i) totalIns += Number(i);
      if (d) totalDel += Number(d);
    }
    const untracked = Bun.spawnSync(["git", "-C", dir, "ls-files", "--others", "--exclude-standard"]);
    const untrackedOut = untracked.stdout.toString().trim();
    if (untrackedOut) {
      const files = untrackedOut.split("\n");
      totalFiles += files.length;
      for (const f of files) {
        try {
          const content = readFileSync(`${dir}/${f}`, "utf-8");
          totalIns += content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
        } catch {}
      }
    }
  } catch {}
  if (totalFiles === 0) return "clean";
  let s = styleText("yellow", `~${totalFiles}`);
  if (totalIns > 0) s += ` ${styleText("green", `+${totalIns}`)}`;
  if (totalDel > 0) s += ` ${styleText("red", `-${totalDel}`)}`;
  return s;
}

async function main() {
  let input: StatusInput;
  try { input = await Bun.stdin.json(); } catch { input = {}; }

  const state = readState();
  const cfg = MOOD_CONFIGS[state.mood] ?? MOOD_CONFIGS.teasing;
  const quote = `"${pick(QUOTES[state.mood] ?? QUOTES.teasing)}"`;
  const bar = meterBar(state, cfg);
  const line1 = `${cfg.emoji} ${cfg.face}  | ${cfg.label} | ${quote.padEnd(42)} | ${bar}`;

  const parts: string[] = [];
  if (input.version) parts.push(styleText("dim", `v${input.version}`));
  const model = input.model?.display_name
    ?.replace(/^Claude /, "").replace(/\s*\(.*?\)\s*$/, "")
    .toLowerCase().replace(/\s+/g, "");
  if (model) parts.push(styleText("dim", model));
  const cw = input.context_window;
  if (cw?.used_percentage != null) parts.push(styleText("italic", `ctx:${Math.round(cw.used_percentage)}%`));
  const rl = input.rate_limits;
  const limits: string[] = [];
  if (rl?.five_hour?.used_percentage != null) limits.push(styleText("italic", `d:${Math.round(rl.five_hour.used_percentage)}%`));
  if (rl?.seven_day?.used_percentage != null) limits.push(styleText("italic", `w:${Math.round(rl.seven_day.used_percentage)}%`));
  if (limits.length) parts.push(limits.join(" "));
  const dir = input.workspace?.project_dir;
  if (dir) parts.push(`-- ${styleText("bold", basename(dir))}`);
  if (dir) parts.push(gitChanges(dir));
  const line2 = parts.join(" ");

  console.log(line1 + "\n" + line2);
}

main().catch(() => {});
