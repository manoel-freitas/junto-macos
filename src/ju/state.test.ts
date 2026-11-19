import { describe, expect, it } from "vitest";
import { juStateFromSession } from "./state";
import {
  initialSessionState,
  pauseSession,
  setEngineFlags,
  submitGoal,
} from "../session/machine";

describe("juStateFromSession", () => {
  it("maps phases", () => {
    expect(juStateFromSession(initialSessionState())).toBe("idle");
    let s = submitGoal(initialSessionState(), "revisar o PR do login");
    expect(juStateFromSession(s)).toBe("working");
    s = pauseSession(s);
    expect(juStateFromSession(s)).toBe("pause");
  });

  it("calling on mid or juCalling", () => {
    let s = submitGoal(initialSessionState(), "revisar o PR do login");
    s = { ...s, phase: "mid" };
    expect(juStateFromSession(s)).toBe("calling");
    s = { ...s, phase: "session" };
    expect(juStateFromSession(s, { juCalling: true })).toBe("calling");
  });

  it("needs-adjustment on engine flags", () => {
    let s = setEngineFlags(initialSessionState(), { engineMissing: true });
    expect(juStateFromSession(s)).toBe("needs-adjustment");
    s = setEngineFlags(initialSessionState(), { engineLoading: true });
    expect(juStateFromSession(s)).toBe("needs-adjustment");
    s = setEngineFlags(initialSessionState(), { micDenied: true });
    expect(juStateFromSession(s)).toBe("needs-adjustment");
  });
});