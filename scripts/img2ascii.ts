// Usage: bun scripts/img2ascii.ts <input-image> <output-ascii> [width] [height]

import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlinkSync } from "node:fs";

function checkBinary(name: string, installHint: string): void {
  if (!Bun.which(name)) {
    console.error(`Error: ${name} not found. Install with: ${installHint}`);
    process.exit(1);
  }
}

async function runCmd(cmd: string[]): Promise<void> {
  const proc = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`Command failed (exit ${code}): ${cmd.join(" ")}`);
  }
}

export async function convertImage(
  input: string,
  output: string,
  width = 30,
  height = 12,
): Promise<void> {
  checkBinary("magick", "brew install imagemagick");
  checkBinary("chafa", "brew install chafa");

  const tmpFile = join(tmpdir(), `img2ascii-${Date.now()}.png`);
  try {
    await runCmd([
      "magick", input,
      "-contrast-stretch", "5%x5%",
      "-sharpen", "0x2",
      "-modulate", "100,130",
      tmpFile,
    ]);

    const proc = Bun.spawn(
      ["chafa", "--work=9", "--format=symbols", "--symbols=all",
       `--size=${width}x${height}`, tmpFile],
      { stdout: "pipe", stderr: "inherit" },
    );
    const outBytes = await new Response(proc.stdout).arrayBuffer();
    const code = await proc.exited;
    if (code !== 0) throw new Error(`chafa failed (exit ${code})`);

    await Bun.write(output, outBytes);
    console.log(`Converted ${input} -> ${output} (${width}x${height})`);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* already gone */ }
  }
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: bun scripts/img2ascii.ts <input-image> <output-ascii> [width] [height]",
    );
    process.exit(1);
  }

  const [input, output] = args;
  const width = args[2] ? parseInt(args[2], 10) : 30;
  const height = args[3] ? parseInt(args[3], 10) : 12;

  await convertImage(input, output, width, height);
}
