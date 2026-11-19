import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { GestureMap, type Model3Shape } from "./gestures";
import { ConfUpdate, ModelDictUpdate, type ModelDictEntry } from "./model-dict";

const SAMPLE: Model3Shape = {
  FileReferences: {
    Motions: { Idle: [{ File: "motions/mtn_01.motion3.json" }] },
    Expressions: [{ Name: "exp_01", File: "expressions/exp_01.exp3.json" }],
  },
  HitAreas: [{ Id: "HitAreaHead", Name: "" }],
};

describe("ModelDictUpdate", () => {
  it("upsert sem duplicar", () => {
    const a: ModelDictEntry = {
      name: "mao_pro",
      description: "",
      url: "/x",
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      kXOffset: 1150,
      idleMotionGroupName: "Idle",
      emotionMap: { neutral: 0 },
      tapMotions: {},
    };
    const b = { ...a, description: "Mao" };
    const out = ModelDictUpdate.upsert([a], b);
    expect(out.filter((e) => e.name === "mao_pro")).toHaveLength(1);
    expect(out[0]!.description).toBe("Mao");
  });

  it("entry hiyori", () => {
    const entry = Catalog.getById("hiyori")!;
    const gestures = GestureMap.fromModel3(SAMPLE);
    const md = ModelDictUpdate.buildEntry(
      entry,
      "/live2d-models/hiyori/runtime/hiyori.model3.json",
      SAMPLE,
      gestures,
    );
    expect(md.url.startsWith("/live2d-models/hiyori/")).toBe(true);
    expect(md.emotionMap.neutral).toBe(0);
  });

  it("ConfUpdate", () => {
    const conf = {
      character_config: { live2d_model_name: "mao_pro", conf_name: "junto" },
    };
    expect(
      ConfUpdate.withLive2dModelName(conf, "hiyori").character_config
        .live2d_model_name,
    ).toBe("hiyori");
    expect(() => ConfUpdate.withLive2dModelName(conf, "unknown_x")).toThrow();
    expect(
      ConfUpdate.activeOlvtName("mao", { mao: { olvtName: "mao_pro" } }),
    ).toBe("mao_pro");
  });
});