// Usage: bun scripts/generate-all-art.ts <source-image-dir>

import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { convertImage } from "./img2ascii";
import { ART_HEIGHTS } from "../plugins/nagatoro/hooks/scripts/_types";

const MOOD_FILES: Record<string, string> = {
  teasing: "Nagatoro.webp",
  smug: "Volume_08.webp",
  jealous: "Volume_06.webp",
  flustered: "Volume_09_v2.webp",
  bored: "Volume_05.webp",
  serious: "Volume_05.webp",
  happy: "Volume_04.webp",
  laughing: "Volume_04.webp",
};

const ART_DIR = join(import.meta.dir, "../plugins/nagatoro/assets/art");

async function generate(sourceDir: string): Promise<void> {
  mkdirSync(ART_DIR, { recursive: true });

  let count = 0;
  for (const [mood, filename] of Object.entries(MOOD_FILES)) {
    const src = join(sourceDir, filename);
    for (const h of ART_HEIGHTS) {
      const w = Math.floor(h * 2.5);
      const out = join(ART_DIR, `${mood}-${h}.ans`);
      console.log(`Generating ${mood}-${h}.ans (${w}x${h})...`);
      await convertImage(src, out, w, h);
      count++;
    }
  }
  console.log(`Done. Generated ${count} files.`);
}

// CLI entry point
if (import.meta.main) {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error("Usage: bun scripts/generate-all-art.ts <source-image-dir>");
    process.exit(1);
  }
  await generate(sourceDir);
}
