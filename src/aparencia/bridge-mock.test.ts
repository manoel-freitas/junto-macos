import { describe, expect, it } from "vitest";
import { GestureMap } from "./gestures";
import { MAO_PRO_MODEL3_FIXTURE } from "./mao-model3-fixture";

describe("mock Mao model3", () => {
  it("preenche os quatro chips de gesto na prévia", () => {
    const g = GestureMap.fromModel3(MAO_PRO_MODEL3_FIXTURE);
    const chips = GestureMap.previewChips(MAO_PRO_MODEL3_FIXTURE, g);
    expect(chips.find((c) => c.label === "aceno")?.ok).toBe(true);
    expect(chips.find((c) => c.label === "sono")?.ok).toBe(true);
  });
});