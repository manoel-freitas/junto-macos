import type { SessionState } from "../session/machine";

export type JuVisualState =
  | "idle"
  | "working"
  | "calling"
  | "pause"
  | "done"
  | "needs-adjustment";

export interface JuContext {
  juCalling?: boolean;
  celebration?: boolean;
}

export function juStateFromSession(
  s: SessionState,
  ctx: JuContext = {},
): JuVisualState {
  if (s.engineMissing || s.engineLoading || s.micDenied) {
    return "needs-adjustment";
  }
  if (ctx.juCalling || s.phase === "mid") return "calling";
  if (s.phase === "pre_breath") return "working";
  switch (s.phase) {
    case "start":
      return "idle";
    case "session":
      return "working";
    case "paused":
      return "pause";
    case "end":
      return ctx.celebration ? "done" : "done";
    default:
      return "idle";
  }
}

export function juCssClass(state: JuVisualState): string {
  return `ju--${state}`;
}