import type { JuVisualState } from "../ju/state";

const OLVT_GESTURE_URL = "http://127.0.0.1:12393/junto/gesture";

export class GestureTrigger {
  static async fire(juState: JuVisualState): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("aparencia_trigger_gesture", { juState });
    } catch {
      if (typeof window !== "undefined") {
        (window as unknown as { __JUNTO_LAST_GESTURE__?: string }).__JUNTO_LAST_GESTURE__ =
          juState;
      }
      try {
        await fetch(OLVT_GESTURE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ juState }),
        });
      } catch {
        /* OLVT offline em dev */
      }
    }
  }
}