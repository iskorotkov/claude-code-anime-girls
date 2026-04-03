import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DEFAULT_STATE } from "./_types";

const CLI = join(import.meta.dir, "_cli.ts");

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "naga-cli-"));
});
afterAll(async () => {
  await rm(tmpDir, { recursive: true });
});

async function runCli(
  ...args: string[]
): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", CLI, ...args], {
    env: { ...process.env, CLAUDE_PLUGIN_DATA: tmpDir },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode };
}

describe("_cli", () => {
  beforeEach(async () => {
    const statePath = join(tmpDir, "state.json");
    await Bun.write(statePath, JSON.stringify(DEFAULT_STATE));
  });

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

  it("--pat increments senpaiMeter and totalPats", async () => {
    const { stdout } = await runCli("--pat");
    const state = JSON.parse(stdout);
    expect(state.senpaiMeter).toBe(52);
    expect(state.totalPats).toBe(1);
  });

  it("--feed increments senpaiMeter from default", async () => {
    const { stdout } = await runCli("--feed");
    const state = JSON.parse(stdout);
    expect(state.senpaiMeter).toBe(51);
    expect(state.boredom).toBe(0);
  });

  it("unknown flag exits with code 1", async () => {
    const { exitCode } = await runCli("--unknown");
    expect(exitCode).toBe(1);
  });

  it("--resize 8 updates artHeight", async () => {
    const { stdout, exitCode } = await runCli("--resize", "8");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.artHeight).toBe(8);
  });

  it("--resize 16 updates artHeight", async () => {
    const { stdout, exitCode } = await runCli("--resize", "16");
    expect(exitCode).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.artHeight).toBe(16);
  });

  it("--resize 7 exits with error (invalid)", async () => {
    const { exitCode } = await runCli("--resize", "7");
    expect(exitCode).toBe(1);
  });

  it("--resize without argument exits with error", async () => {
    const { exitCode } = await runCli("--resize");
    expect(exitCode).toBe(1);
  });

  it("--interact increments interactionCount", async () => {
    const { stdout } = await runCli("--interact");
    const out = JSON.parse(stdout);
    expect(out.interactionCount).toBe(1);
  });

  it("--interact transitions non-teasing mood to teasing", async () => {
    await runCli("--pat");
    const { stdout } = await runCli("--interact");
    const out = JSON.parse(stdout);
    expect(out.mood).toBe("teasing");
  });
});
