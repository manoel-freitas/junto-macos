import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";

describe("Catalog", () => {
  it("tem 24 modelos na ordem esperada", () => {
    const ids = Catalog.all.map((e) => e.id);
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(24);
    expect(ids[0]).toBe("mao");
    expect(ids[ids.length - 1]).toBe("zundamon");
  });

  it("contagens por categoria", () => {
    const c = Catalog.counts(new Set(["mao"]));
    expect(c).toEqual({
      todas: 24,
      pessoas: 17,
      bichinhos: 2,
      chibi: 5,
      instaladas: 1,
    });
  });

  it("selos", () => {
    const mao = Catalog.getById("mao")!;
    const hiyori = Catalog.getById("hiyori")!;
    const jin = Catalog.getById("jin")!;
    const installed = new Set(["mao"]);
    expect(Catalog.badge(mao, installed)).toBe("instalada");
    expect(Catalog.badge(hiyori, installed)).toBe("baixar");
    expect(Catalog.badge(jin, installed)).toBe("licenca");
    expect(Catalog.badge(jin, new Set(["jin"]))).toBe("instalada");
  });

  it("filtros e busca", () => {
    const installed = new Set(["mao"]);
    const bichos = Catalog.filter(Catalog.all, "bichinhos", installed, "");
    expect(bichos.map((e) => e.id).sort()).toEqual(["tororo", "wanko"]);
    const inst = Catalog.filter(Catalog.all, "instaladas", installed, "");
    expect(inst.map((e) => e.id)).toEqual(["mao"]);
    const haru = Catalog.filter(Catalog.all, "todas", installed, "haru");
    expect(haru.map((e) => e.displayName)).toEqual([
      "Haru",
      "Haru recepcionista",
    ]);
    const haruCi = Catalog.filter(Catalog.all, "todas", installed, "HARU");
    expect(haruCi.length).toBe(2);
    const emptyQ = Catalog.filter(Catalog.all, "todas", installed, "  ");
    expect(emptyQ.length).toBe(24);
  });
});