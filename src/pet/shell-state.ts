import type { JuVisualState } from "../ju/state";
import { juCssClass } from "../ju/state";

/** Atualiza classes de estado da Ju sem remover noRecolor / level-2 */
export function applyJuShellClasses(
  shell: HTMLElement,
  state: JuVisualState,
  opts?: { level2?: boolean; noRecolor?: boolean },
): void {
  const keepNoRecolor =
    opts?.noRecolor ?? shell.classList.contains("ju--no-recolor");
  const keepLevel2 = opts?.level2 ?? shell.classList.contains("ju--level-2");

  shell.className = `ju-shell ${juCssClass(state)}`;
  if (keepNoRecolor) shell.classList.add("ju--no-recolor");
  if (keepLevel2) shell.classList.add("ju--level-2");
}

export function idleFilterWouldApply(shell: HTMLElement): boolean {
  return (
    shell.classList.contains("ju--idle") &&
    !shell.classList.contains("ju--no-recolor")
  );
}