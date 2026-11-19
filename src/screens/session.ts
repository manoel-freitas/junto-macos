import type { SessionState } from "../session/machine";
import { remainingMs, timeUntilMidMs, totalDurationMs } from "../session/machine";
import { el, formatMs } from "./util";

export function renderSession(
  root: HTMLElement,
  state: SessionState,
  onPause: () => void,
  onDone: () => void,
): void {
  root.replaceChildren();
  el("div", "muted", "Terminando").append;
  const label = el("div", "muted", "Terminando");
  const goal = el("b", undefined, state.goal);
  goal.setAttribute("aria-live", "polite");

  const rem = remainingMs(state);
  const elapsed = state.elapsedMs;
  const displayMs = rem !== null ? rem : elapsed;
  const timer = el("div", "timer", formatMs(displayMs));
  timer.setAttribute("aria-live", "polite");

  const cap = totalDurationMs(state.duration);
  const progWrap = el("div", "prog");
  const progBar = el("i");
  if (cap) {
    progBar.style.width = `${Math.min(100, (state.elapsedMs / cap) * 100)}%`;
  } else {
    progBar.style.width = "0%";
  }
  progWrap.appendChild(progBar);

  const pauseBtn = el("button", "btn", "Pausar ");
  pauseBtn.appendChild(el("span", "k", "P"));
  pauseBtn.type = "button";
  pauseBtn.addEventListener("click", onPause);

  const doneBtn = el("button", "btn pri", "Acabei ");
  doneBtn.appendChild(el("span", "k", "A"));
  doneBtn.type = "button";
  doneBtn.addEventListener("click", onDone);

  const row = el("div", "btn-row");
  row.append(pauseBtn, doneBtn);

  const untilMid = timeUntilMidMs(state);
  const foot = el(
    "div",
    "muted",
    untilMid !== null
      ? `Check-in em ${formatMs(untilMid)} · Foco do macOS respeitado`
      : "Foco do macOS respeitado",
  );
  foot.style.marginTop = "12px";

  root.append(label, goal, timer, progWrap, row, foot);
}