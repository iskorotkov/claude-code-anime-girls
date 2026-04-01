#!/bin/bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input-image> <output-ascii> [width] [height]" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
WIDTH="${3:-30}"
HEIGHT="${4:-12}"

if ! command -v magick &>/dev/null; then
  echo "Error: imagemagick not found. Install with: brew install imagemagick" >&2
  exit 1
fi

if ! command -v chafa &>/dev/null; then
  echo "Error: chafa not found. Install with: brew install chafa" >&2
  exit 1
fi

TMPFILE="$(mktemp).png"
trap 'rm -f "$TMPFILE"' EXIT

magick "$INPUT" -contrast-stretch 5%x5% -sharpen 0x2 -modulate 100,130 "$TMPFILE"
chafa --work=9 --format=symbols --symbols=all --size="${WIDTH}x${HEIGHT}" "$TMPFILE" > "$OUTPUT"

echo "Converted $INPUT -> $OUTPUT (${WIDTH}x${HEIGHT})"
