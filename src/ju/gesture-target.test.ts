import { describe, expect, it } from "vitest";
import { GestureTarget } from "./gesture-target";

describe("GestureTarget", () => {
  it("mapeia estados da Ju", () => {
    expect(GestureTarget.keyForJuState("idle")).toBe("parada");
    expect(GestureTarget.keyForJuState("working")).toBe("parada");
    expect(GestureTarget.keyForJuState("calling")).toBe("chamando");
    expect(GestureTarget.keyForJuState("pause")).toBe("pausa");
    expect(GestureTarget.keyForJuState("done")).toBe("acabou");
    expect(GestureTarget.keyForJuState("needs-adjustment")).toBe("ajuste");
  });
});