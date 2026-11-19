import type { JuGestureKey } from "../aparencia/gestures";
import type { JuVisualState } from "./state";

export class GestureTarget {
  static keyForJuState(state: JuVisualState): JuGestureKey {
    switch (state) {
      case "calling":
        return "chamando";
      case "pause":
        return "pausa";
      case "done":
        return "acabou";
      case "needs-adjustment":
        return "ajuste";
      case "idle":
      case "working":
      default:
        return "parada";
    }
  }
}