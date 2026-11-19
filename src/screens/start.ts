import type { SessionState } from "../session/machine";
import { el } from "./util";

export interface StartHandlers {
  onSubmit: (goal: string) => void;
  onDuration: (d: SessionState["duration"]) => void;
}

export function renderStart(
  root: HTMLElement,
  state: SessionState,
  handlers: StartHandlers,
): HTMLInputElement {
  root.replaceChildren();

  const title = state.askConcreteStep
    ? el("div", "title", "Qual é o primeiro passo concreto?")
    : el("div", "title", "O que você vai terminar agora?");

  const input = el("input", "input") as HTMLInputElement;
  input.type = "text";
  input.placeholder = "ex.: revisar o PR do login";
  input.value = state.goal;
  input.setAttribute("aria-label", "Meta de foco");

  const durLabel = el("div", "muted", "Duração");
  const chips = el("div", "chips");
  const durations: SessionState["duration"][] = ["25", "50", "livre"];
  const labels: Record<SessionState["duration"], string> = {
    "25": "25 min",
    "50": "50 min",
    livre: "livre",
  };
  for (const d of durations) {
    const chip = el("button", `chip${state.duration === d ? " on" : ""}`, labels[d]);
    chip.type = "button";
    chip.addEventListener("click", () => handlers.onDuration(d));
    chips.appendChild(chip);
  }

  const startBtn = el("button", "btn pri", "Começar ");
  const kbd = el("span", "k", "⏎");
  startBtn.appendChild(kbd);
  startBtn.type = "button";
  startBtn.addEventListener("click", () => handlers.onSubmit(input.value));

  const hint = el(
    "div",
    "muted",
    "Meta vaga? O app pede o 1º passo concreto.",
  );
  hint.style.marginTop = "10px";

  root.append(title, input, durLabel, chips, startBtn, hint);
  return input;
}