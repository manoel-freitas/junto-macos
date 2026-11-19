import { renderCategoryChips } from "./distraction-categories";
import { el } from "./util";

export interface DistractionUiState {
  enabled: boolean;
  categories: Set<string>;
  permissionWarn?: string;
}

export function renderDistractionSettings(
  root: HTMLElement,
  state: DistractionUiState,
  onToggleFeature: (on: boolean) => void,
  onToggleCategory: (id: string) => void,
  onOpenSettings?: () => void,
): void {
  root.replaceChildren();
  const title = el("h2", undefined, "Perceber distrações");
  const muted = el(
    "p",
    "muted",
    "Opcional e desligado por padrão. Lê só o domínio da aba no Chrome ou Safari — título e URL não vão para nuvem nem ficam guardados.",
  );

  const label = document.createElement("label");
  label.className = "toggle-row";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = state.enabled;
  input.addEventListener("change", () => onToggleFeature(input.checked));
  label.append(input, document.createTextNode(" Ativar sensor de distração"));

  const chips = document.createElement("div");
  renderCategoryChips(chips, state.categories, onToggleCategory);

  root.append(title, muted, label, chips);

  if (state.permissionWarn) {
    const warn = el("div", "strip", state.permissionWarn);
    if (onOpenSettings) {
      const btn = el("button", "btn", "Abrir Ajustes");
      btn.type = "button";
      btn.addEventListener("click", onOpenSettings);
      warn.appendChild(btn);
    }
    root.appendChild(warn);
  }
}