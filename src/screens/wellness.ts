import type { WellnessToggles } from "../wellness/toggles";
import { el } from "./util";

const LABELS: Record<keyof WellnessToggles, string> = {
  breath: "Respiração (1 min antes de começar)",
  water: "Água ao fim do bloco",
  stretch: "Alongar a cada 2 blocos",
  longBreak: "Pausa longa a cada 4 blocos",
};

export function renderWellnessSettings(
  root: HTMLElement,
  toggles: WellnessToggles,
  onChange: (key: keyof WellnessToggles, value: boolean) => void,
): void {
  root.replaceChildren();
  root.appendChild(el("h2", undefined, "Bem-estar nas bordas"));
  root.appendChild(
    el(
      "p",
      "muted",
      "Lembretes só fora do foco ativo. Sem streak e sem cobrança.",
    ),
  );
  for (const key of Object.keys(LABELS) as (keyof WellnessToggles)[]) {
    const label = document.createElement("label");
    label.className = "toggle-row";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = toggles[key];
    input.addEventListener("change", () => onChange(key, input.checked));
    label.append(input, document.createTextNode(` ${LABELS[key]}`));
    root.appendChild(label);
  }
}