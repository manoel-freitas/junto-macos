import { describe, expect, it } from "vitest";
import { AparenciaMachine } from "./machine";

describe("AparenciaMachine", () => {
  it("fluxo carregando → pronta → baixando", () => {
    let s = AparenciaMachine.initial("mao");
    expect(s.phase).toBe("carregando");
    s = AparenciaMachine.imagesReady(s);
    expect(s.phase).toBe("pronta");
    s = AparenciaMachine.beginDownload(s, "hiyori");
    expect(s.phase).toBe("baixando");
    expect(s.downloadId).toBe("hiyori");
    s = AparenciaMachine.progress(s, 5, 10);
    expect(s.progressReceived).toBe(5);
    expect(s.progressTotal).toBe(10);
  });

  it("cancel mantém activeId", () => {
    let s = AparenciaMachine.initial("mao");
    s = AparenciaMachine.imagesReady(s);
    s = { ...s, activeId: "mao" };
    s = AparenciaMachine.beginDownload(s, "hiyori");
    s = AparenciaMachine.cancel(s);
    expect(s.phase).toBe("pronta");
    expect(s.activeId).toBe("mao");
  });

  it("fail e retry com licença", () => {
    let s = AparenciaMachine.initial();
    s = AparenciaMachine.imagesReady(s);
    s = AparenciaMachine.beginDownload(s, "jin");
    s = AparenciaMachine.fail(s, "Hiyori", "rede");
    expect(s.failName).toBe("Hiyori");
    expect(s.phase).toBe("falha");
    s = AparenciaMachine.retry(s, true, false);
    expect(s.phase).toBe("licenca");
    s = AparenciaMachine.retry(s, true, true);
    expect(s.phase).toBe("baixando");
  });
});