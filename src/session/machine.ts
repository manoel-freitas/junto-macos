export type DurationChoice = "25" | "50" | "livre";
export type Phase = "start" | "pre_breath" | "session" | "mid" | "paused" | "end";
export type Outcome = "sim" | "parcial" | "nao";

export interface SessionState {
  phase: Phase;
  goal: string;
  duration: DurationChoice;
  elapsedMs: number;
  midFired: boolean;
  midDeferred: boolean;
  askConcreteStep: boolean;
  outcome: Outcome | null;
  textOnly: boolean;
  blocksCompleted: number;
  preBreathPending: boolean;
  engineMissing: boolean;
  engineLoading: boolean;
  micDenied: boolean;
  midTimedOut: boolean;
}

export interface TickEvent {
  deltaMs: number;
  meeting: boolean;
  focus: boolean;
}

const VAGUE_WORDS = new Set([
  "trabalhar",
  "estudar",
  "focar",
  "foco",
  "coisas",
  "tarefas",
  "email",
  "emails",
]);

export function midAtMs(duration: DurationChoice): number {
  switch (duration) {
    case "25":
      return 750_000;
    case "50":
    case "livre":
      return 1_500_000;
  }
}

export function totalDurationMs(duration: DurationChoice): number | null {
  if (duration === "25") return 25 * 60 * 1000;
  if (duration === "50") return 50 * 60 * 1000;
  return null;
}

export function isVagueGoal(goal: string): boolean {
  const trimmed = goal.trim();
  if (!trimmed) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3) return true;
  const lower = trimmed.toLowerCase();
  if (words.length === 1 && VAGUE_WORDS.has(lower)) return true;
  return false;
}

export function initialSessionState(): SessionState {
  return {
    phase: "start",
    goal: "",
    duration: "25",
    elapsedMs: 0,
    midFired: false,
    midDeferred: false,
    askConcreteStep: false,
    outcome: null,
    textOnly: false,
    blocksCompleted: 0,
    preBreathPending: false,
    engineMissing: false,
    engineLoading: false,
    micDenied: false,
    midTimedOut: false,
  };
}

export function setDuration(state: SessionState, duration: DurationChoice): SessionState {
  return { ...state, duration };
}

export function setEngineFlags(
  state: SessionState,
  flags: Partial<Pick<SessionState, "engineMissing" | "engineLoading" | "micDenied">>,
): SessionState {
  return { ...state, ...flags };
}

export function useTextOnly(state: SessionState): SessionState {
  return { ...state, textOnly: true, engineMissing: false };
}

export function submitGoal(
  state: SessionState,
  goal: string,
  opts?: { skipPreBreath?: boolean },
): SessionState {
  const trimmed = goal.trim();
  if (!trimmed) return state;
  if (isVagueGoal(trimmed)) {
    return { ...state, goal: trimmed, askConcreteStep: true, phase: "start" };
  }
  const base = {
    ...state,
    goal: trimmed,
    askConcreteStep: false,
    midFired: false,
    midDeferred: false,
    elapsedMs: 0,
    textOnly:
      state.textOnly ||
      state.engineMissing ||
      state.engineLoading ||
      state.micDenied,
  };
  if (state.preBreathPending && !opts?.skipPreBreath) {
    return { ...base, phase: "pre_breath" as Phase };
  }
  return { ...base, phase: "session" as Phase };
}

export function finishPreBreath(state: SessionState): SessionState {
  if (state.phase !== "pre_breath") return state;
  return { ...state, phase: "session", preBreathPending: false };
}

export function skipPreBreath(state: SessionState): SessionState {
  if (state.phase !== "pre_breath" && !state.preBreathPending) return state;
  return { ...state, phase: "session", preBreathPending: false };
}

export function setPreBreathPending(
  state: SessionState,
  pending: boolean,
): SessionState {
  return { ...state, preBreathPending: pending };
}

export function pauseSession(state: SessionState): SessionState {
  if (state.phase !== "session" && state.phase !== "mid") return state;
  return { ...state, phase: "paused" };
}

export function resumeSession(state: SessionState): SessionState {
  if (state.phase !== "paused") return state;
  return { ...state, phase: "session" };
}

export function finishSession(state: SessionState): SessionState {
  if (state.phase !== "session" && state.phase !== "paused") return state;
  return { ...state, phase: "end" };
}

export function setOutcome(state: SessionState, outcome: Outcome): SessionState {
  if (state.phase !== "end") return state;
  return { ...state, outcome };
}

export function anotherSession(state: SessionState): SessionState {
  return {
    ...initialSessionState(),
    textOnly: state.textOnly,
    engineMissing: state.engineMissing,
    engineLoading: state.engineLoading,
    micDenied: state.micDenied,
    blocksCompleted: state.blocksCompleted,
    preBreathPending: state.preBreathPending,
  };
}

export function recordBlockComplete(state: SessionState): SessionState {
  return { ...state, blocksCompleted: state.blocksCompleted + 1 };
}

export function midResponse(
  state: SessionState,
  choice: "sim" | "mudei" | "pausar",
): SessionState {
  if (state.phase !== "mid") return state;
  if (choice === "pausar") {
    return { ...state, phase: "paused" };
  }
  if (choice === "mudei") {
    return {
      ...state,
      phase: "start",
      askConcreteStep: true,
      midTimedOut: false,
    };
  }
  return { ...state, phase: "session", midTimedOut: false };
}

export function midTimeout(state: SessionState): SessionState {
  if (state.phase !== "mid") return state;
  return { ...state, phase: "session", midTimedOut: true };
}

export function tick(state: SessionState, event: TickEvent): SessionState {
  if (
    state.phase === "paused" ||
    state.phase === "end" ||
    state.phase === "start" ||
    state.phase === "pre_breath"
  ) {
    return state;
  }

  let next = { ...state };

  if (state.phase === "session") {
    next.elapsedMs += event.deltaMs;
    const cap = totalDurationMs(state.duration);
    if (cap !== null && next.elapsedMs >= cap) {
      return { ...next, phase: "end" };
    }
    const mid = midAtMs(state.duration);
    if (!next.midFired && next.elapsedMs >= mid) {
      if (event.meeting || event.focus) {
        return { ...next, midDeferred: true };
      }
      return {
        ...next,
        phase: "mid",
        midFired: true,
        midDeferred: false,
      };
    }
    if (next.midDeferred && !next.midFired && next.elapsedMs >= mid) {
      if (!event.meeting && !event.focus) {
        return {
          ...next,
          phase: "mid",
          midFired: true,
          midDeferred: false,
        };
      }
    }
  }

  return next;
}

export function remainingMs(state: SessionState): number | null {
  const cap = totalDurationMs(state.duration);
  if (cap === null) return null;
  return Math.max(0, cap - state.elapsedMs);
}

export function timeUntilMidMs(state: SessionState): number | null {
  if (state.phase !== "session" || state.midFired) return null;
  const mid = midAtMs(state.duration);
  return Math.max(0, mid - state.elapsedMs);
}
