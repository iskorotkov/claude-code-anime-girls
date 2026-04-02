import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(import.meta.dir, "_cli.ts");

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "naga-cli-"));
});
afterAll(async () => {
  await rm(tmpDir, { recursive: true });
});

async function runCli(
  flag: string,
): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", CLI, flag], {
    env: { ...process.env, CLAUDE_PLUGIN_DATA: tmpDir },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode };
}

describe("_cli", () => {
  it("--read returns valid JSON state", async () => {
    const { stdout, exitCode } = await runCli("--read");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state).toHaveProperty("mood");
    expect(state).toHaveProperty("senpaiMeter");
  });

  it("--pat updates state", async () => {
    const { stdout, exitCode } = await runCli("--pat");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.mood).toBe("flustered");
  });

  it("--compliment updates state", async () => {
    const { stdout, exitCode } = await runCli("--compliment");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.mood).toBe("flustered");
  });

  it("--feed updates state", async () => {
    const { stdout, exitCode } = await runCli("--feed");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state).toHaveProperty("senpaiMeter");
  });

  it("unknown flag exits with code 1", async () => {
    const { exitCode } = await runCli("--unknown");
    expect(exitCode).toBe(1);
  });
});
