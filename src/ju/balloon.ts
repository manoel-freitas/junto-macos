export interface BalloonSpec {
  text: string;
  ariaLive?: "polite" | "assertive";
  actions?: { label: string; key?: string; onClick: () => void }[];
  autoDismissMs?: number;
}

export function mountBalloon(host: HTMLElement, spec: BalloonSpec): () => void {
  host.replaceChildren();
  const bub = document.createElement("div");
  bub.className = "ju-balloon";
  bub.setAttribute("role", "status");
  if (spec.ariaLive) bub.setAttribute("aria-live", spec.ariaLive);

  const p = document.createElement("p");
  p.textContent = spec.text;
  bub.appendChild(p);

  if (spec.actions?.length) {
    const row = document.createElement("div");
    row.className = "ju-balloon__actions";
    for (const a of spec.actions) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ju-balloon__btn";
      btn.textContent = a.key ? `${a.label} ${a.key}` : a.label;
      btn.addEventListener("click", a.onClick);
      row.appendChild(btn);
    }
    bub.appendChild(row);
  }

  host.appendChild(bub);

  let timer: ReturnType<typeof setTimeout> | undefined;
  if (spec.autoDismissMs) {
    timer = setTimeout(() => {
      host.replaceChildren();
    }, spec.autoDismissMs);
  }

  return () => {
    if (timer) clearTimeout(timer);
    host.replaceChildren();
  };
}