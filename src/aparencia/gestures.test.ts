import { describe, expect, it } from "vitest";
import { GestureMap, type JuGestureMap, type Model3Shape } from "./gestures";

function expectAllFive(g: JuGestureMap, label: string): void {
  const keys = ["parada", "chamando", "pausa", "acabou", "ajuste"] as const;
  for (const k of keys) {
    expect(g[k], `${label}.${k}`).not.toBeNull();
  }
  const formatted = GestureMap.formatMap(g);
  const groups = keys.map((k) => g[k]!.group);
  expect(new Set(groups.map((gr, i) => `${gr}:${g[keys[i]!]!.index}`)).size).toBe(
    keys.length,
  );
  expect(formatted, label).toMatchObject({
    parada: expect.not.stringMatching(/^\?$/),
    chamando: expect.not.stringMatching(/^\?$/),
    pausa: expect.not.stringMatching(/^\?$/),
    acabou: expect.not.stringMatching(/^\?$/),
    ajuste: expect.not.stringMatching(/^\?$/),
  });
}

/** Estrutura real Hiyori pro (sem Expressions). */
const HIYORI: Model3Shape = {
  FileReferences: {
    Motions: {
      Idle: [
        { File: "motions/hiyori_idle01.motion3.json" },
        { File: "motions/hiyori_idle02.motion3.json" },
        { File: "motions/hiyori_idle03.motion3.json" },
      ],
      Flick: [{ File: "motions/hiyori_flick.motion3.json" }],
      FlickDown: [{ File: "motions/hiyori_flick_down.motion3.json" }],
      FlickUp: [{ File: "motions/hiyori_flick_up.motion3.json" }],
      Tap: [
        { File: "motions/hiyori_tap01.motion3.json" },
        { File: "motions/hiyori_tap02.motion3.json" },
      ],
      "Tap@Body": [{ File: "motions/hiyori_tap_body.motion3.json" }],
      "Flick@Body": [{ File: "motions/hiyori_flick_body.motion3.json" }],
    },
  },
};

/** Mao padrão: Idle + grupo sem nome com mtn/special + expressões. */
const MAO: Model3Shape = {
  FileReferences: {
    Motions: {
      Idle: [{ File: "motions/mtn_01.motion3.json" }],
      "": [
        { File: "motions/mtn_02.motion3.json" },
        { File: "motions/mtn_03.motion3.json" },
        { File: "motions/mtn_04.motion3.json" },
        { File: "motions/special_01.motion3.json" },
        { File: "motions/special_02.motion3.json" },
        { File: "motions/special_03.motion3.json" },
      ],
    },
    Expressions: [
      { Name: "exp_01", File: "expressions/exp_01.exp3.json" },
      { Name: "exp_02", File: "expressions/exp_02.exp3.json" },
      { Name: "exp_03", File: "expressions/exp_03.exp3.json" },
      { Name: "exp_04", File: "expressions/exp_04.exp3.json" },
      { Name: "exp_05", File: "expressions/exp_05.exp3.json" },
      { Name: "exp_06", File: "expressions/exp_06.exp3.json" },
      { Name: "exp_07", File: "expressions/exp_07.exp3.json" },
      { Name: "exp_08", File: "expressions/exp_08.exp3.json" },
    ],
  },
  Groups: [{ Name: "EyeBlink", Target: "Parameter" }],
};

const NATORI: Model3Shape = {
  FileReferences: {
    Motions: {
      Idle: [
        { File: "motions/natori_idle01.motion3.json" },
        { File: "motions/natori_idle02.motion3.json" },
        { File: "motions/natori_idle03.motion3.json" },
      ],
      Tap: [{ File: "motions/natori_tap.motion3.json" }],
      "FlickUp@Head": [{ File: "motions/natori_flick_up_head.motion3.json" }],
      "Flick@Body": [{ File: "motions/natori_flick_body.motion3.json" }],
      "FlickDown@Body": [{ File: "motions/natori_flick_down_body.motion3.json" }],
      "Tap@Head": [{ File: "motions/natori_tap_head.motion3.json" }],
    },
    Expressions: [
      { Name: "Angry", File: "expressions/angry.exp3.json" },
      { Name: "Smile", File: "expressions/smile.exp3.json" },
      { Name: "Sad", File: "expressions/sad.exp3.json" },
    ],
  },
};

const WANKO: Model3Shape = {
  FileReferences: {
    Motions: {
      Idle: [
        { File: "motions/wanko_idle01.motion3.json" },
        { File: "motions/wanko_idle02.motion3.json" },
        { File: "motions/wanko_idle03.motion3.json" },
      ],
      Flick3: [{ File: "motions/wanko_flick3.motion3.json" }],
      Shake: [{ File: "motions/wanko_shake.motion3.json" }],
      FlickUp: [{ File: "motions/wanko_flick_up.motion3.json" }],
      Tap: [
        { File: "motions/wanko_tap01.motion3.json" },
        { File: "motions/wanko_tap02.motion3.json" },
      ],
      Flick: [
        { File: "motions/wanko_flick01.motion3.json" },
        { File: "motions/wanko_flick02.motion3.json" },
      ],
      FlickLeft: [{ File: "motions/wanko_flick_left.motion3.json" }],
    },
  },
};

describe("GestureMap fixtures (Live2D reais)", () => {
  it("Hiyori pro: cinco gestos distintos", () => {
    const g = GestureMap.fromModel3(HIYORI);
    expectAllFive(g, "Hiyori");
    expect(g.parada?.group).toBe("Idle");
    expect(g.chamando?.group).toBe("Tap@Body");
    expect(g.pausa?.group).toBe("FlickDown");
    expect(g.ajuste?.group).toBe("FlickUp");
  });

  it("Mao padrão: cinco gestos (grupo vazio + specials)", () => {
    const g = GestureMap.fromModel3(MAO);
    expectAllFive(g, "Mao");
    expect(g.parada?.group).toBe("Idle");
    expect(g.chamando?.file).toContain("mtn_02");
    expect(g.pausa?.file).toContain("mtn_03");
    expect(g.ajuste?.file).toContain("mtn_04");
    expect(g.acabou?.file).toContain("special");
    const chips = GestureMap.previewChips(MAO, g);
    expect(chips.find((c) => c.label === "aceno")?.ok).toBe(true);
    expect(chips.find((c) => c.label === "sono")?.ok).toBe(true);
  });

  it("Natori: cinco gestos", () => {
    const g = GestureMap.fromModel3(NATORI);
    expectAllFive(g, "Natori");
    expect(g.ajuste?.group).toMatch(/Head|FlickUp/);
    expect(g.chamando?.group).toMatch(/Tap/);
  });

  it("Wanko: cinco gestos", () => {
    const g = GestureMap.fromModel3(WANKO);
    expectAllFive(g, "Wanko");
    expect(g.ajuste?.group).toMatch(/Shake|FlickUp/);
  });
});

describe("GestureMap heurísticas gerais", () => {
  it("FlickHead preenche ajuste", () => {
    const m: Model3Shape = {
      FileReferences: {
        Motions: {
          Idle: [{ File: "motion/04.motion3.json" }],
          FlickHead: [{ File: "motion/03.motion3.json" }],
          Tap: [{ File: "motion/tap.motion3.json" }],
        },
      },
    };
    const g = GestureMap.fromModel3(m);
    expect(g.ajuste?.group).toBe("FlickHead");
    expect(g.chamando?.group).toBe("Tap");
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
  });

  it("sem Motions devolve tudo null", () => {
    const g = GestureMap.fromModel3({});
    expect(Object.values(g).every((v) => v === null)).toBe(true);
  });

  it("só Idle: parada preenchida, demais null", () => {
    const m: Model3Shape = {
      FileReferences: {
        Motions: {
          Idle: [{ File: "motions/idle.motion3.json" }],
        },
      },
    };
    const g = GestureMap.fromModel3(m);
    expect(g.parada).not.toBeNull();
    expect(g.chamando).toBeNull();
    expect(g.pausa).toBeNull();
  });
});