import { describe, expect, it } from "vitest";
import type { JuGestureMap } from "./gestures";
import { ResolveGesture } from "./resolve-gesture";

const base: JuGestureMap = {
  parada: { group: "Idle", index: 0, file: "a" },
  chamando: null,
  pausa: null,
  acabou: null,
  ajuste: null,
};

describe("ResolveGesture", () => {
  it("usa motion quando mapeado", () => {
    const g = {
      ...base,
      chamando: { group: "Tap", index: 1, file: "b" },
    };
    expect(ResolveGesture.forJuState("calling", g, "Idle")).toEqual({
      kind: "motion",
      group: "Tap",
      index: 1,
    });
  });

  it("cai no idle sem gesto", () => {
    expect(ResolveGesture.forJuState("calling", base, "Idle")).toEqual({
      kind: "idle",
      group: "Idle",
    });
  });

  it("idle usa parada ou fallback", () => {
    const empty: JuGestureMap = {
      parada: null,
      chamando: null,
      pausa: null,
      acabou: null,
      ajuste: null,
    };
    expect(ResolveGesture.forJuState("idle", empty, "Loop")).toEqual({
      kind: "idle",
      group: "Loop",
    });
  });
});