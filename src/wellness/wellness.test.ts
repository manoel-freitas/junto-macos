import { describe, expect, it } from "vitest";
import { cueBeforeStart, cuesAfterBlock } from "./scheduler";
import { DEFAULT_WELLNESS } from "./toggles";

describe("wellness scheduler", () => {
  it("breath only when enabled", () => {
    expect(cueBeforeStart({ ...DEFAULT_WELLNESS, breath: false })).toBeNull();
    expect(cueBeforeStart({ ...DEFAULT_WELLNESS, breath: true })?.kind).toBe(
      "breath",
    );
  });

  it("stretch every 2 blocks", () => {
    const t = { ...DEFAULT_WELLNESS, water: false, longBreak: false };
    expect(cuesAfterBlock(1, t)).toEqual([]);
    expect(cuesAfterBlock(2, t).some((c) => c.kind === "stretch")).toBe(true);
  });

  it("long break every 4 blocks", () => {
    const t = { ...DEFAULT_WELLNESS, water: false, stretch: false };
    const c4 = cuesAfterBlock(4, t);
    expect(c4.some((c) => c.kind === "long_break")).toBe(true);
  });
});