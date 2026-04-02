import { describe, it, expect, spyOn, afterEach, beforeEach } from "bun:test";
import { meterBar, ctxOverride, resolveArtHeight } from "./statusline";
import { MOOD_CONFIGS } from "../hooks/scripts/_types";
import { makeState } from "../hooks/scripts/_test-utils";

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const FILLED = "\u2588";
const EMPTY = "\u2591";

let randomSpy: ReturnType<typeof spyOn>;
afterEach(() => { randomSpy?.mockRestore(); });

// ---------------------------------------------------------------------------
// meterBar
// ---------------------------------------------------------------------------
describe("meterBar", () => {
  it("50% cyan has 5 filled and 5 empty blocks", () => {
    const raw = stripAnsi(meterBar(50, "cyan", false));
    expect(raw).toBe(`[${FILLED.repeat(5)}${EMPTY.repeat(5)}]`);
  });

  it("0% has all 10 empty blocks", () => {
    const raw = stripAnsi(meterBar(0, "cyan", false));
    expect(raw).toBe(`[${EMPTY.repeat(10)}]`);
  });

  it("100% has all 10 filled blocks", () => {
    const raw = stripAnsi(meterBar(100, "cyan", false));
    expect(raw).toBe(`[${FILLED.repeat(10)}]`);
  });

  it("jealous mode uses '!' instead of filled block", () => {
    const raw = stripAnsi(meterBar(50, "cyan", true));
    expect(raw).toBe(`[${"!".repeat(5)}${EMPTY.repeat(5)}]`);
  });

  it("dim color applies styleText('dim', ...)", () => {
    const out = meterBar(50, "dim", false);
    expect(out).toContain("\x1b[");
    const raw = stripAnsi(out);
    expect(raw).toBe(`[${FILLED.repeat(5)}${EMPTY.repeat(5)}]`);
  });

  it("starts with '[' and ends with ']'", () => {
    const out = meterBar(70, "cyan", false);
    expect(out.startsWith("[")).toBe(true);
    expect(out.endsWith("]")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ctxOverride
// ---------------------------------------------------------------------------
describe("ctxOverride", () => {
  beforeEach(() => { randomSpy = spyOn(Math, "random").mockReturnValue(0); });

  it("95% returns serious mood", () => {
    const r = ctxOverride(95);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("serious");
    expect(r!.cfg).toEqual(MOOD_CONFIGS.serious);
    expect(r!.quote).toContain("[ctx:95%]");
  });

  it("85% returns flustered mood", () => {
    const r = ctxOverride(85);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("flustered");
    expect(r!.quote).toContain("[ctx:85%]");
  });

  it("65% returns smug mood", () => {
    const r = ctxOverride(65);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("smug");
    expect(r!.quote).toContain("[ctx:65%]");
  });

  it("50% returns null (no warning)", () => {
    expect(ctxOverride(50)).toBeNull();
  });

  it("boundary 90% returns serious", () => {
    const r = ctxOverride(90);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("serious");
  });

  it("boundary 80% returns flustered", () => {
    const r = ctxOverride(80);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("flustered");
  });

  it("boundary 60% returns smug", () => {
    const r = ctxOverride(60);
    expect(r).not.toBeNull();
    expect(r!.artMood).toBe("smug");
  });
});

// ---------------------------------------------------------------------------
// resolveArtHeight
// ---------------------------------------------------------------------------
describe("resolveArtHeight", () => {
  const originalEnv = process.env.NAGATORO_ART_HEIGHT;
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NAGATORO_ART_HEIGHT;
    else process.env.NAGATORO_ART_HEIGHT = originalEnv;
  });

  it("returns 10 when no env and no state field", () => {
    delete process.env.NAGATORO_ART_HEIGHT;
    const s = makeState();
    expect(resolveArtHeight(s)).toBe(10);
  });

  it("returns state artHeight when valid", () => {
    delete process.env.NAGATORO_ART_HEIGHT;
    const s = makeState({ artHeight: 8 });
    expect(resolveArtHeight(s)).toBe(8);
  });

  it("env var overrides state", () => {
    process.env.NAGATORO_ART_HEIGHT = "16";
    const s = makeState({ artHeight: 8 });
    expect(resolveArtHeight(s)).toBe(16);
  });

  it("falls back to 10 for invalid env var", () => {
    process.env.NAGATORO_ART_HEIGHT = "7";
    const s = makeState();
    expect(resolveArtHeight(s)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// integration: subprocess
// ---------------------------------------------------------------------------
const STATUSLINE_PATH = `${import.meta.dir}/statusline.ts`;

describe("statusline subprocess", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = `${Bun.env.TMPDIR ?? "/tmp"}/nagatoro-test-${Date.now()}`;
    const fs = require("node:fs");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(`${tmpDir}/state.json`, JSON.stringify({
      mood: "teasing",
      senpaiMeter: 50,
      respect: 50,
      boredom: 0,
    }));
  });

  it("produces output with context_window input", async () => {
    const proc = Bun.spawn(["bun", "run", STATUSLINE_PATH], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, CLAUDE_PLUGIN_DATA: tmpDir },
    });
    const payload = JSON.stringify({ context_window: { used_percentage: 50 } });
    proc.stdin.write(payload);
    proc.stdin.end();
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Senpai");
  });

  it("produces output with empty stdin (defaults)", async () => {
    const proc = Bun.spawn(["bun", "run", STATUSLINE_PATH], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, CLAUDE_PLUGIN_DATA: tmpDir },
    });
    proc.stdin.end();
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Senpai");
  });
});
