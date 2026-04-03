---
name: resize-pic
description: "Change Nagatoro's art size. Heights: 8, 10, 12, 14, 16."
argument-hint: "[height: 8|10|12|14|16]"
allowed-tools: Bash(CLAUDE_PLUGIN_DATA=${CLAUDE_PLUGIN_DATA} bun ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/_cli.ts *)
---

# /resize-pic

Change Nagatoro's art display size.

## Steps

1. Parse $ARGUMENTS for a height value (8, 10, 12, 14, or 16).
2. If no argument or invalid, respond in-character telling Senpai the valid sizes and stop.
3. Run `CLAUDE_PLUGIN_DATA=${CLAUDE_PLUGIN_DATA} bun ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/_cli.ts --resize <height>` to update state.
4. Respond in-character:
   - Small (8): tease about wanting her smaller
   - Default (10-12): comment on being boring/normal
   - Large (14-16): tease about wanting to see more of her
5. Keep to 2-3 lines.
