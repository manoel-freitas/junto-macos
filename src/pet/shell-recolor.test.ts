import { describe, expect, it } from "vitest";
import { applyJuShellClasses, idleFilterWouldApply } from "./shell-state";

function mockShell(initial: string): HTMLElement {
  const set = new Set(initial.split(/\s+/).filter(Boolean));
  const el = {
    get className() {
      return [...set].join(" ");
    },
    set className(v: string) {
      set.clear();
      v.split(/\s+/).filter(Boolean).forEach((c) => set.add(c));
    },
    classList: {
      contains: (c: string) => set.has(c),
      add: (c: string) => set.add(c),
    },
  };
  return el as unknown as HTMLElement;
}

describe("applyJuShellClasses noRecolor", () => {
  it("preserva ju--no-recolor ao mudar estado", () => {
    const shell = mockShell("ju-shell ju--idle ju--no-recolor");
    applyJuShellClasses(shell, "working");
    expect(shell.classList.contains("ju--no-recolor")).toBe(true);
    expect(shell.classList.contains("ju--working")).toBe(true);
  });

  it("sem noRecolor fica elegível ao filtro idle", () => {
    const shell = mockShell("ju-shell");
    applyJuShellClasses(shell, "idle", { noRecolor: false });
    expect(idleFilterWouldApply(shell)).toBe(true);
  });

  it("com noRecolor não aplica filtro idle", () => {
    const shell = mockShell("ju-shell");
    applyJuShellClasses(shell, "idle", { noRecolor: true });
    expect(idleFilterWouldApply(shell)).toBe(false);
  });
});