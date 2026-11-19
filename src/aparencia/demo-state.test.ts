import { describe, expect, it } from "vitest";
import { applyAparenciaDemoEstado, parseDemoEstado } from "./demo-state";

describe("parseDemoEstado", () => {
  it("lê query estado", () => {
    expect(parseDemoEstado("?estado=falha")).toBe("falha");
    expect(parseDemoEstado("?estado=xyz")).toBeNull();
  });
});

describe("applyAparenciaDemoEstado", () => {
  it("falha mantém phase falha", () => {
    const { machine, imagesLoaded } = applyAparenciaDemoEstado("falha");
    expect(machine.phase).toBe("falha");
    expect(machine.failName).toBe("Hiyori");
    expect(imagesLoaded).toBe(true);
  });

  it("carregando deixa skeleton", () => {
    const { machine, imagesLoaded } = applyAparenciaDemoEstado("carregando");
    expect(machine.phase).toBe("carregando");
    expect(imagesLoaded).toBe(false);
  });

  it("baixando com progresso", () => {
    const { machine } = applyAparenciaDemoEstado("baixando");
    expect(machine.phase).toBe("baixando");
    expect(machine.progressReceived).toBe(45);
  });
});