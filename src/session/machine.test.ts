import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  isVagueGoal,
  midAtMs,
  midResponse,
  midTimeout,
  pauseSession,
  resumeSession,
  setEngineFlags,
  submitGoal,
  tick,
  finishSession,
  setOutcome,
  useTextOnly,
} from "./machine";

describe("midAtMs", () => {
  it("maps durations", () => {
    expect(midAtMs("25")).toBe(750_000);
    expect(midAtMs("50")).toBe(1_500_000);
    expect(midAtMs("livre")).toBe(1_500_000);
  });
});

describe("vague goals", () => {
  it("detects vague", () => {
    expect(isVagueGoal("focar")).toBe(true);
    expect(isVagueGoal("revisar o PR do login")).toBe(false);
  });
});

describe("submitGoal", () => {
  it("starts session with concrete goal", () => {
    let s = initialSessionState();
    s = submitGoal(s, "revisar o PR do login");
    expect(s.phase).toBe("session");
    expect(s.askConcreteStep).toBe(false);
  });

  it("asks concrete step when vague", () => {
    let s = initialSessionState();
    s = submitGoal(s, "focar");
    expect(s.phase).toBe("start");
    expect(s.askConcreteStep).toBe(true);
  });

  it("ignores engine flags and still starts", () => {
    let s = initialSessionState();
    s = setEngineFlags(s, {
      engineMissing: true,
      engineLoading: true,
      micDenied: true,
    });
    s = submitGoal(s, "revisar o PR do login");
    expect(s.phase).toBe("session");
    expect(s.textOnly).toBe(true);
  });

  it("text only mode when user chooses", () => {
    let s = initialSessionState();
    s = setEngineFlags(s, { engineMissing: true });
    s = useTextOnly(s);
    s = submitGoal(s, "revisar o PR do login");
    expect(s.textOnly).toBe(true);
    expect(s.engineMissing).toBe(false);
  });
});

describe("mid check-in", () => {
  it("fires once at mid point", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    const delta = midAtMs("25") - s.elapsedMs;
    s = tick(s, { deltaMs: delta, meeting: false, focus: false });
    expect(s.phase).toBe("mid");
    expect(s.midFired).toBe(true);
    s = midResponse(s, "sim");
    expect(s.phase).toBe("session");
    s = tick(s, { deltaMs: 60_000, meeting: false, focus: false });
    expect(s.phase).toBe("session");
    expect(s.midFired).toBe(true);
  });

  it("defers when meeting or focus", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    const delta = midAtMs("25");
    s = tick(s, { deltaMs: delta, meeting: true, focus: false });
    expect(s.phase).toBe("session");
    expect(s.midDeferred).toBe(true);
    s = tick(s, { deltaMs: 0, meeting: false, focus: false });
    expect(s.phase).toBe("mid");
  });

  it("timeout equals sim", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    s = tick(s, {
      deltaMs: midAtMs("25"),
      meeting: false,
      focus: false,
    });
    s = midTimeout(s);
    expect(s.phase).toBe("session");
    expect(s.midTimedOut).toBe(true);
  });

  it("mudei returns to start with askConcreteStep", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    s = tick(s, {
      deltaMs: midAtMs("25"),
      meeting: false,
      focus: false,
    });
    s = midResponse(s, "mudei");
    expect(s.phase).toBe("start");
    expect(s.askConcreteStep).toBe(true);
  });
});

describe("pause", () => {
  it("does not advance timer when paused", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    s = { ...s, elapsedMs: 60_000 };
    s = pauseSession(s);
    expect(s.phase).toBe("paused");
    s = tick(s, { deltaMs: 999_999, meeting: false, focus: false });
    expect(s.elapsedMs).toBe(60_000);
    s = resumeSession(s);
    expect(s.phase).toBe("session");
  });
});

describe("end", () => {
  it("auto ends at timer for 25 min", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    s = tick(s, {
      deltaMs: 25 * 60 * 1000,
      meeting: false,
      focus: false,
    });
    expect(s.phase).toBe("end");
  });

  it("acabei ends session", () => {
    let s = initialSessionState();
    s = submitGoal(s, "meta concreta aqui");
    s = finishSession(s);
    expect(s.phase).toBe("end");
    s = setOutcome(s, "parcial");
    expect(s.outcome).toBe("parcial");
  });
});