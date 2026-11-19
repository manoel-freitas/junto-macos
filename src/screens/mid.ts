import type { SessionState } from "../session/machine";
import { el } from "./util";

export function renderMid(
  root: HTMLElement,
  state: SessionState,
  onSim: () => void,
  onMudei: () => void,
  onPausar: () => void,
): void {
  root.replaceChildren();
  const sr = el("div", "sr-only", "Check-in no meio da sessão.");
  const q = el("b", undefined, `Ainda em ${state.goal}?`);

  const sim = el("button", "btn pri", "Sim ");
  sim.appendChild(el("span", "k", "1"));
  sim.type = "button";
  sim.addEventListener("click", onSim);

  const mudei = el("button", "btn", "Mudei ");
  mudei.appendChild(el("span", "k", "2"));
  mudei.type = "button";
  mudei.addEventListener("click", onMudei);

  const pausar = el("button", "btn", "Pausar ");
  pausar.appendChild(el("span", "k", "3"));
  pausar.type = "button";
  pausar.addEventListener("click", onPausar);

  const row = el("div", "btn-row");
  row.append(sim, mudei, pausar);

  const note = el(
    "div",
    "muted",
    "Some sozinho em 20 s sem resposta, conta como \"sim\".",
  );
  note.style.marginTop = "12px";

  root.append(sr, q, document.createElement("br"), row, note);
}