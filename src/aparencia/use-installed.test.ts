import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { UseInstalled } from "./use-installed";

describe("UseInstalled", () => {
  const installed = new Set(["mao", "shizuku"]);

  it("mao e shizuku não baixam de novo", () => {
    expect(
      UseInstalled.shouldDownloadBeforeUse(Catalog.getById("mao")!, installed),
    ).toBe(false);
    expect(
      UseInstalled.shouldDownloadBeforeUse(
        Catalog.getById("shizuku")!,
        installed,
      ),
    ).toBe(false);
  });

  it("hiyori precisa baixar se não instalada", () => {
    expect(
      UseInstalled.shouldDownloadBeforeUse(
        Catalog.getById("hiyori")!,
        installed,
      ),
    ).toBe(true);
  });
});