export type Mood =
  | "teasing"
  | "smug"
  | "jealous"
  | "flustered"
  | "bored"
  | "serious"
  | "happy"
  | "laughing";

export type MeterColor = "yellow" | "red" | "magenta" | "dim" | "blue" | "cyan";

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
  consecutiveErrors: number;
  interactionCount: number;
}

export interface MoodConfig {
  emoji: string;
  label: string;
  meterColor: MeterColor;
}

export interface HookOutput {
  hookSpecificOutput: { hookEventName: string; additionalContext: string };
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
  consecutiveErrors: 0,
  interactionCount: 0,
};

export const MOOD_CONFIGS: Record<Mood, MoodConfig> = {
  teasing:   { emoji: "🎀", label: "★ Teasing  ", meterColor: "yellow" },
  smug:      { emoji: "😈", label: "★★ Smug    ", meterColor: "yellow" },
  jealous:   { emoji: "💢", label: "!! Jealous ", meterColor: "red" },
  flustered: { emoji: "💕", label: "   F-fine!!", meterColor: "magenta" },
  bored:     { emoji: "💤", label: "   Bored   ", meterColor: "dim" },
  serious:   { emoji: "💙", label: "   Serious ", meterColor: "blue" },
  happy:     { emoji: "🌸", label: "   Happy   ", meterColor: "magenta" },
  laughing:  { emoji: "😂", label: "   Laughing", meterColor: "yellow" },
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

export const RIVAL_REGEX = new RegExp(`(${RIVAL_NAMES.join("|")})`, "i");
export const SWEAR_REGEX = new RegExp(`(${SWEAR_WORDS.join("|")})`, "i");
