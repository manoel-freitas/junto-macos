import { el } from "./util";

export function renderMic(
  root: HTMLElement,
  onOpenSettings: () => void,
  onKeyboard: () => void,
): void {
  root.replaceChildren();
  const wrap = el("div", "warn");
  const title = el("b", undefined, "Sem acesso ao microfone");
  const sub = el(
    "div",
    "muted",
    "Você ainda pode responder pelo teclado. Voz é opcional.",
  );
  sub.style.margin = "8px 0";

  const settings = el("button", "btn pri", "Abrir Ajustes do Sistema");
  settings.type = "button";
  settings.addEventListener("click", onOpenSettings);

  const kb = el("button", "btn", "Seguir no teclado");
  kb.type = "button";
  kb.addEventListener("click", onKeyboard);

  const row = el("div", "btn-row");
  row.append(settings, kb);
  wrap.append(title, sub);
  root.append(wrap, row);
}