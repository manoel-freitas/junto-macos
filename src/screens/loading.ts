import { el } from "./util";

export function renderLoading(
  root: HTMLElement,
  percent: number,
  label: string,
  onStartAnyway: () => void,
  error: string | null,
  onRetry: () => void,
): void {
  root.replaceChildren();
  const title = el("b", undefined, error ? "Não deu para preparar a dupla" : "Preparando sua dupla");
  const progWrap = el("div", "prog");
  const bar = el("i");
  bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  progWrap.appendChild(bar);
  const sub = el("div", "muted", label);

  const row = el("div", "btn-row");
  if (error) {
    const retry = el("button", "btn pri", "Tentar de novo");
    retry.type = "button";
    retry.addEventListener("click", onRetry);
    row.append(retry);
  } else {
    const anyway = el("button", "btn pri", "Começar mesmo assim");
    anyway.type = "button";
    anyway.addEventListener("click", onStartAnyway);
    row.append(anyway);
    const hint = el(
      "div",
      "muted",
      "O avatar entra quando estiver pronto.",
    );
    hint.style.marginTop = "10px";
    root.append(title, progWrap, sub, row, hint);
    return;
  }
  root.append(title, el("div", "muted", error), row);
}