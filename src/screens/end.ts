import type { Outcome } from "../session/machine";
import { el } from "./util";

export function renderEnd(
  root: HTMLElement,
  dateLabel: string,
  summaryLines: string[],
  onOutcome: (o: Outcome) => void,
  onAnother: () => void,
): void {
  root.replaceChildren();
  const q = el("b", undefined, "Saiu?");

  const sim = el("button", "btn pri", "Sim ");
  sim.appendChild(el("span", "k", "1"));
  sim.type = "button";
  sim.addEventListener("click", () => onOutcome("sim"));

  const parcial = el("button", "btn", "Parcial ");
  parcial.appendChild(el("span", "k", "2"));
  parcial.type = "button";
  parcial.addEventListener("click", () => onOutcome("parcial"));

  const nao = el("button", "btn", "Não ");
  nao.appendChild(el("span", "k", "3"));
  nao.type = "button";
  nao.addEventListener("click", () => onOutcome("nao"));

  const row = el("div", "btn-row");
  row.append(sim, parcial, nao);

  const day = el("div", "muted", `Hoje · ${dateLabel}`);
  day.style.marginTop = "14px";

  const summary = el("div", "summary");
  for (const line of summaryLines) {
    summary.appendChild(document.createElement("br"));
    summary.append(line);
  }
  summary.firstChild?.remove();

  const another = el("button", "btn", "Outra sessão");
  another.type = "button";
  another.style.marginTop = "12px";
  another.addEventListener("click", onAnother);

  root.append(q, row, day, summary, another);
}