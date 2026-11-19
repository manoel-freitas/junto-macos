import type { SessionState } from "../session/machine";
import { remainingMs } from "../session/machine";
import { el, formatMs } from "./util";

export function renderPaused(
  root: HTMLElement,
  state: SessionState,
  onResume: () => void,
  onEnd: () => void,
): void {
  root.replaceChildren();
  const title = el("b", undefined, "Pausado. Sem pressa.");
  const rem = remainingMs(state);
  const display = rem !== null ? rem : state.elapsedMs;
  const timer = el("div", "timer pausa", formatMs(display));
  const note = el("div", "muted", "O tempo para aqui. Pausar não quebra nada.");

  const resume = el("button", "btn pri", "Retomar ");
  resume.appendChild(el("span", "k", "R"));
  resume.type = "button";
  resume.addEventListener("click", onResume);

  const end = el("button", "btn", "Encerrar");
  end.type = "button";
  end.addEventListener("click", onEnd);

  const row = el("div", "btn-row");
  row.append(resume, end);

  root.append(title, timer, note, row);
}