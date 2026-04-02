# claude-code-anime-girls

Nagatoro-themed tsundere companion plugin for Claude Code.

## Conventions

- Runtime: Bun + TypeScript
- Functions: <= 20 lines
- Files: <= 200 lines

## State

State file: `$CLAUDE_PLUGIN_DATA/state.json` (fallback `~/.claude/nagatoro-state.json`).

## Testing

```bash
bun test
```

## Notes

- All hook scripts use the shared `runHook` boilerplate from `_helpers.ts`.
- Skills mutate state via `bun hooks/scripts/_cli.ts --pat|--compliment|--read|--feed|--resize`.
- Art generation scripts are in `scripts/` (TypeScript, require `imagemagick` + `chafa`).
