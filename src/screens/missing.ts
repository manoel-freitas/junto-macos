import { el } from "./util";

export interface MissingStatus {
  juntoOk: boolean;
  olvtOk: boolean;
  ollamaOk: boolean;
}

export function renderMissing(
  root: HTMLElement,
  status: MissingStatus,
  onInstall: () => void,
  onTextOnly: () => void,
): void {
  root.replaceChildren();
  const wrap = el("div", "warn");
  const title = el("b", undefined, "Falta o motor de voz e avatar");
  const sub = el(
    "div",
    "muted",
    "O Junto funciona só com texto enquanto isso.",
  );
  sub.style.margin = "8px 0";
  const list = el("div", "checklist");
  list.innerHTML = [
    `${status.juntoOk ? "✓" : "✗"} Junto instalado`,
    `${status.olvtOk ? "✓" : "✗"} Open-LLM-VTuber (servidor local)`,
    `${status.ollamaOk ? "✓" : "✗"} Ollama`,
  ].join("<br>");

  const install = el("button", "btn pri", "Instalar e verificar");
  install.type = "button";
  install.addEventListener("click", onInstall);

  const text = el("button", "btn", "Usar só texto");
  text.type = "button";
  text.addEventListener("click", onTextOnly);

  const row = el("div", "btn-row");
  row.append(install, text);
  wrap.append(title, sub, list);
  root.append(wrap, row);
}