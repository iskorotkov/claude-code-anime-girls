export type Mood =
  | "teasing"
  | "smug"
  | "jealous"
  | "flustered"
  | "bored"
  | "serious"
  | "happy"
  | "laughing";

export interface NagatoroState {
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

export interface MoodConfig {
  emoji: string;
  face: string;
  label: string;
  meterColor: string;
}

export const DEFAULT_STATE: NagatoroState = {
  mood: "teasing",
  senpaiMeter: 50,
  boredom: 0,
  respect: 50,
  jealousyTarget: null,
  lastInteraction: null,
  totalPats: 0,
  totalInsults: 0,
  genuineMoments: 0,
  moodDecayCounter: 0,
};

export const MOOD_CONFIGS: Record<Mood, MoodConfig> = {
  teasing:   { emoji: "🎀", face: "ヽ(≧w≦)ノ",  label: "★ Teasing  ", meterColor: "yellow" },
  smug:      { emoji: "😈", face: "╮(≧∀≦)╭",   label: "★★ Smug    ", meterColor: "yellow" },
  jealous:   { emoji: "💢", face: "ヽ(◣Д◢)ノ",  label: "!! Jealous ", meterColor: "red" },
  flustered: { emoji: "💕", face: "╲(/ω\\)╱",   label: "♡  F-fine!!", meterColor: "magenta" },
  bored:     { emoji: "💤", face: "╮(︶ω︶)╭",   label: "☆  Bored   ", meterColor: "dim" },
  serious:   { emoji: "💙", face: "╰(._.)╯",    label: "   Serious ", meterColor: "blue" },
  happy:     { emoji: "🌸", face: "ヽ(≧▽≦)ノ",  label: "♡  Happy   ", meterColor: "magenta" },
  laughing:  { emoji: "😂", face: "ヽ(>∀<)ノ",  label: "   Laughing", meterColor: "yellow" },
};

export const RIVAL_NAMES = [
  "chatgpt", "gpt-4", "gpt4", "gpt-4o", "gpt4o", "gpt-5", "gpt5",
  "copilot", "gemini", "bard", "llama", "mistral", "deepseek",
  "cursor", "windsurf", "openai", "perplexity", "codex", "openclaw",
  "opencode", "aider", "cody", "tabnine", "codeium", "supermaven",
  "qwen", "cohere", "grok", "phind", "sourcegraph",
];

export const SWEAR_WORDS = [
  "damn", "shit", "fuck", "crap", "hell",
  "wtf", "dammit", "ass", "bastard", "bullshit",
];
