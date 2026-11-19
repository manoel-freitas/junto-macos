import { DISTRACTION_CATEGORIES } from "../automation/domains";

export function renderCategoryChips(
  host: HTMLElement,
  enabled: Set<string>,
  onToggle: (id: string) => void,
): void {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "chip-row";
  for (const cat of DISTRACTION_CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = enabled.has(cat.id) ? "chip on" : "chip";
    btn.textContent = cat.label;
    btn.addEventListener("click", () => onToggle(cat.id));
    wrap.appendChild(btn);
  }
  host.appendChild(wrap);
}