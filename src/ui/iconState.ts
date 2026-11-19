import type { SessionState } from "../session/machine";

export type IconStateId = "idle" | "session" | "checkin" | "paused" | "ajuste";

export function iconStateFromSession(state: SessionState): IconStateId {
  if (state.engineMissing || state.engineLoading) return "ajuste";
  if (state.phase === "paused") return "paused";
  if (state.phase === "mid") return "checkin";
  if (state.phase === "session") return "session";
  return "idle";
}

export function trayTitleForIcon(id: IconStateId, remainingLabel: string): string {
  switch (id) {
    case "session":
      return remainingLabel;
    case "paused":
      return "pausa";
    case "ajuste":
      return "!";
    default:
      return "";
  }
}