# claude-code-anime-girls

Nagatoro-themed tsundere companion plugin for Claude Code. She teases Senpai while they code.

## Prerequisites

### Claude Code

Install [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI:

```bash
brew install claude-code
```

Or follow the [official installation guide](https://docs.anthropic.com/en/docs/claude-code/getting-started).

### Bun

All hooks and statusline scripts run via [Bun](https://bun.sh/):

```bash
brew install oven-sh/bun/bun
```

Or install directly:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation and Setup

### 1. Add Marketplace and Install Plugin

```bash
claude plugins marketplace add iskorotkov/claude-code-anime-girls
claude plugins install nagatoro@anime-girls
```

### 2. Activate Output Style

The output style injects Nagatoro's tsundere personality into Claude's system context. She calls you "Senpai", teases your code, and wraps technical help in tsundere dialogue.

**Option A** -- run `/config` inside a Claude Code session and select "Output style", then pick `Nagatoro`.

**Option B** -- add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "outputStyle": "nagatoro:Nagatoro"
}
```

### 3. Activate Status Line

The status line displays Nagatoro's current mood as ANSI art alongside live stats.

**Option A** -- run `/statusline` inside a Claude Code session to configure it interactively.

**Option B** -- add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/.claude/plugins/marketplaces/anime-girls/plugins/nagatoro/statusline/statusline.ts",
    "padding": 0
  }
}
```

The script receives session data as JSON on stdin and outputs ANSI art to stdout.

## Features

### Status Line Stats

- Senpai meter (affection level)
- Respect meter (rises on task success, drops on tool failures)
- Boredom meter (rises when idle)
- Lifetime counters for pats, swears, and genuine moments
- Context window warnings at 60%, 80%, and 90% usage

### Mood System

Nagatoro reacts to your coding session in real time:

| Trigger                  | Mood                                  |
| ------------------------ | ------------------------------------- |
| Normal interaction       | Teasing                               |
| Tool failure             | Smug / Serious (after 2+ consecutive) |
| Mention a rival AI       | Jealous                               |
| Pat or compliment        | Flustered                             |
| Swearing                 | Laughing                              |
| Long idle                | Bored                                 |
| High respect + affection | Happy (rare)                          |

Rival AI names that trigger jealousy include ChatGPT, Copilot, Gemini, Cursor, Codex, and others.

### Slash Commands

| Command           | Effect                                     |
| ----------------- | ------------------------------------------ |
| `/pat`            | Pat Nagatoro on the head                   |
| `/compliment`     | Compliment her (watch her malfunction)     |
| `/feed`           | Feed her (she judges your taste)           |
| `/resize-pic`     | Change ASCII art size (8, 10, 12, 14, 16)  |
| `/mood`           | Check current mood and stats               |
| `/ask-advice`     | Get coding advice wrapped in teasing       |
| `/ask-joke`       | Hear a bad programming joke                |
| `/ask-wisdom`     | Surprisingly insightful programming wisdom |
| `/ask-compliment` | Fish for a compliment                      |

### Art Size

The status line art can be resized to 5 heights: 8, 10, 12, 14, or 16 lines.

| Method               | Example                                 |
| -------------------- | --------------------------------------- |
| Slash command        | `/resize-pic 8`                         |
| Environment variable | `NAGATORO_ART_HEIGHT=16`                |
| CLI                  | `bun hooks/scripts/_cli.ts --resize 12` |

The default height is 10 lines.

## Development

### State

Plugin state is persisted to:

1. `$CLAUDE_PLUGIN_DATA/state.json` (when managed by Claude Code)
2. `~/.claude/nagatoro-state.json` (fallback)

To reset Nagatoro's mood and stats, delete the state file.

### Project Structure

All hook scripts live in `plugins/nagatoro/hooks/scripts/` and share a common `runHook` boilerplate from `_helpers.ts`. Skills mutate state via `_cli.ts`. The statusline script is at `plugins/nagatoro/statusline/statusline.ts`.

### Running Tests

```bash
bun test
```

### Generating Art

Regenerate ANSI art assets from source images:

```bash
bun scripts/generate-all-art.ts ~/path/to/source-images
```

Convert a single image:

```bash
bun scripts/img2ascii.ts <input-image> <output.ans> [width] [height]
```

Requires `imagemagick` and `chafa` (`brew install imagemagick chafa`).
