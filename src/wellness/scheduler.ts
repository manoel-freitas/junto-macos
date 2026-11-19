import type { WellnessToggles } from "./toggles";

export type WellnessCue =
  | { kind: "breath"; minutes: 1 }
  | { kind: "water" }
  | { kind: "stretch" }
  | { kind: "long_break" };

export function cuesAfterBlock(
  blocksCompleted: number,
  toggles: WellnessToggles,
): WellnessCue[] {
  const cues: WellnessCue[] = [];
  if (toggles.water) cues.push({ kind: "water" });
  if (toggles.stretch && blocksCompleted > 0 && blocksCompleted % 2 === 0) {
    cues.push({ kind: "stretch" });
  }
  if (toggles.longBreak && blocksCompleted > 0 && blocksCompleted % 4 === 0) {
    cues.push({ kind: "long_break" });
  }
  return cues;
}

export function cueBeforeStart(toggles: WellnessToggles): WellnessCue | null {
  if (!toggles.breath) return null;
  return { kind: "breath", minutes: 1 };
}

export function wellnessBalloonText(cue: WellnessCue): string {
  switch (cue.kind) {
    case "breath":
      return "Um minuto de respiração antes de começar?";
    case "water":
      return "Bloco feito. Um gole d'água?";
    case "stretch":
      return "Dois blocos. Alongar um pouco?";
    case "long_break":
      return "Quatro blocos. Uma pausa mais longa?";
  }
}