# claude-code-anime-girls

Nagatoro-themed tsundere companion plugin for Claude Code. She teases Senpai while they code.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- [Bun](https://bun.sh/) runtime (all hooks and statusline scripts run via `bun`)

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

Add the marketplace and install the plugin:

```bash
claude plugins add --from https://github.com/iskorotkov/claude-code-anime-girls
claude plugins install nagatoro
```

## Features

### Status Line

A persistent status line displays Nagatoro's current mood as ANSI art alongside live stats:

- Senpai meter (affection level)
- Respect meter (rises on task success, drops on tool failures)
- Boredom meter (rises when idle)
- Lifetime counters for pats, swears, and genuine moments
- Context window warnings at 60%, 80%, and 90% usage

### Mood System

Nagatoro reacts to your coding session in real time:

| Trigger | Mood |
|---|---|
| Normal interaction | Teasing |
| Tool failure | Smug / Serious (after 2+ consecutive) |
| Mention a rival AI | Jealous |
| Pat or compliment | Flustered |
| Swearing | Laughing |
| Long idle | Bored |
| High respect + affection | Happy (rare) |

Rival AI names that trigger jealousy include ChatGPT, Copilot, Gemini, Cursor, Codex, and others.

### Output Style

Nagatoro's personality is injected into Claude's system context. She calls you "Senpai", teases your code, and wraps technical help in tsundere dialogue.

### Slash Commands

| Command | Effect |
|---|---|
| `/pat` | Pat Nagatoro on the head |
| `/compliment` | Compliment her (watch her malfunction) |
| `/feed` | Feed her (she judges your taste) |
| `/mood` | Check current mood and stats |
| `/ask-advice` | Get coding advice wrapped in teasing |
| `/ask-joke` | Hear a bad programming joke |
| `/ask-wisdom` | Surprisingly insightful programming wisdom |
| `/ask-compliment` | Fish for a compliment |

## Configuration

After installing the plugin, configure Claude Code to use Nagatoro's status line and output style.

### Activate Output Style

The output style injects Nagatoro's tsundere personality into Claude's system context.

**Option A** -- run `/config` inside a Claude Code session and select "Output style", then pick `Nagatoro`.

**Option B** -- add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "outputStyle": "nagatoro:Nagatoro"
}
```

The format is `<plugin-name>:<style-name>`. The style file lives at `plugins/nagatoro/output-styles/nagatoro.md`.

### Activate Status Line

The status line shows Nagatoro's mood as ANSI art with live stats.

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

## State

Plugin state is persisted to:

1. `$CLAUDE_PLUGIN_DATA/state.json` (when managed by Claude Code)
2. `~/.claude/nagatoro-state.json` (fallback)

To reset Nagatoro's mood and stats, delete the state file.

## Development

```bash
bun test
```

All hook scripts live in `plugins/nagatoro/hooks/scripts/` and share a common `runHook` boilerplate from `_helpers.ts`. The statusline script is at `plugins/nagatoro/statusline/statusline.ts`.
