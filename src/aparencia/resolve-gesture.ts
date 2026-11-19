import { GestureTarget } from "../ju/gesture-target";
import type { JuVisualState } from "../ju/state";
import type { JuGestureKey, JuGestureMap } from "./gestures";

export type ResolvedGesture =
  | { kind: "motion"; group: string; index: number }
  | { kind: "idle"; group: string };

export class ResolveGesture {
  static forJuState(
    juState: JuVisualState,
    gestures: JuGestureMap,
    idleGroup: string,
  ): ResolvedGesture {
    const key = GestureTarget.keyForJuState(juState);
    return ResolveGesture.forKey(key, gestures, idleGroup);
  }

  static forKey(
    key: JuGestureKey,
    gestures: JuGestureMap,
    idleGroup: string,
  ): ResolvedGesture {
    const ref = gestures[key];
    if (ref?.group) {
      return { kind: "motion", group: ref.group, index: ref.index };
    }
    const idle =
      gestures.parada?.group ??
      (idleGroup.trim() ? idleGroup : "Idle");
    return { kind: "idle", group: idle };
  }
}