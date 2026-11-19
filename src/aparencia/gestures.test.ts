import { describe, expect, it } from "vitest";
import { GestureMap, type Model3Shape } from "./gestures";

const MAO_LIKE: Model3Shape = {
  FileReferences: {
    Motions: {
      Idle: [{ File: "motions/mtn_01.motion3.json" }],
      Tap: [{ File: "motions/mtn_02.motion3.json" }],
    },
    Expressions: [{ Name: "exp_01", File: "expressions/exp_01.exp3.json" }],
  },
  Groups: [{ Name: "EyeBlink", Target: "Parameter" }],
};

describe("GestureMap", () => {
  it("mao-like: idle e expressões, aceno/sono ?", () => {
    const g = GestureMap.fromModel3(MAO_LIKE);
    expect(g.parada?.group).toBe("Idle");
    expect(g.chamando).toBeNull();
    expect(g.pausa).toBeNull();
    const chips = GestureMap.previewChips(MAO_LIKE, g);
    expect(chips.find((c) => c.label === "respira e pisca")?.ok).toBe(true);
    expect(chips.find((c) => c.label === "expressões")?.ok).toBe(true);
    expect(chips.find((c) => c.label === "aceno")?.ok).toBe(false);
    expect(chips.find((c) => c.label === "sono")?.ok).toBe(false);
  });

  it("FlickHead preenche ajuste", () => {
    const m: Model3Shape = {
      FileReferences: {
        Motions: {
          Idle: [{ File: "motion/04.motion3.json" }],
          FlickHead: [{ File: "motion/03.motion3.json" }],
        },
      },
    };
    const g = GestureMap.fromModel3(m);
    expect(g.ajuste?.group).toBe("FlickHead");
  });

  it("wave no arquivo preenche chamando", () => {
    const m: Model3Shape = {
      FileReferences: {
        Motions: {
          Idle: [{ File: "motions/id.motion3.json" }],
          Tap: [{ File: "motions/wave.motion3.json" }],
        },
      },
    };
    const g = GestureMap.fromModel3(m);
    expect(g.chamando?.file).toContain("wave");
  });

  it("motion único happy vai para acabou", () => {
    const m: Model3Shape = {
      FileReferences: {
        Motions: {
          Special: [{ File: "motions/happy.motion3.json" }],
        },
      },
    };
    const g = GestureMap.fromModel3(m);
    expect(g.acabou).not.toBeNull();
    expect(g.parada).toBeNull();
  });

  it("sem Motions devolve tudo null", () => {
    const g = GestureMap.fromModel3({});
    expect(Object.values(g).every((v) => v === null)).toBe(true);
  });
});