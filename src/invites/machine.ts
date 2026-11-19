export const INVITE_BALLOON =
  "Bora começar? O que você vai terminar agora?";
export const MIN_GAP_MS = 45 * 60 * 1000;
export const MAX_INVITES_PER_DAY = 3;
export const MAX_UNANSWERED_BEFORE_NAP = 3;
export const LOGIN_DELAY_MS = 2 * 60 * 1000;
export const IDLE_NO_SESSION_MS = 15 * 60 * 1000;
export const SNOOZE_MS = 15 * 60 * 1000;

export type InviteTrigger = "login" | "unlock" | "idle15";
export type InviteResponse = "start" | "snooze15" | "not_today";

export interface InviteState {
  dateKey: string;
  invitesToday: number;
  unansweredStreak: number;
  lastInviteAt: number | null;
  silencedUntil: number | null;
  snoozeUntil: number | null;
  loginAt: number;
  loginInviteShown: boolean;
  unlockInviteShownToday: boolean;
  idle15ShownForPeriod: boolean;
  pendingTrigger: InviteTrigger | null;
}

export interface QuietContext {
  inWorkHours: boolean;
  meeting: boolean;
  fullscreen: boolean;
  mutedUntil: number | null;
  sessionActive: boolean;
}

export interface EvaluateInput {
  now: number;
  quiet: QuietContext;
  unlockedJustNow: boolean;
  idleSince: number | null;
}

export function dateKeyLocal(now: number): string {
  const d = new Date(now);
  return d.toLocaleDateString("en-CA");
}

export function startOfNextLocalDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function initialInviteState(now = Date.now()): InviteState {
  return {
    dateKey: dateKeyLocal(now),
    invitesToday: 0,
    unansweredStreak: 0,
    lastInviteAt: null,
    silencedUntil: null,
    snoozeUntil: null,
    loginAt: now,
    loginInviteShown: false,
    unlockInviteShownToday: false,
    idle15ShownForPeriod: false,
    pendingTrigger: null,
  };
}

export function rollDailyState(state: InviteState, now: number): InviteState {
  const key = dateKeyLocal(now);
  if (key === state.dateKey) return state;
  return {
    ...state,
    dateKey: key,
    invitesToday: 0,
    unansweredStreak: 0,
    unlockInviteShownToday: false,
    idle15ShownForPeriod: false,
    silencedUntil:
      state.silencedUntil !== null && state.silencedUntil <= now
        ? null
        : state.silencedUntil,
  };
}

export function isQuiet(ctx: QuietContext, now: number): boolean {
  if (!ctx.inWorkHours) return true;
  if (ctx.meeting || ctx.fullscreen) return true;
  if (ctx.mutedUntil !== null && now < ctx.mutedUntil) return true;
  if (ctx.sessionActive) return true;
  return false;
}

export function isSilenced(state: InviteState, now: number): boolean {
  if (state.silencedUntil !== null && now < state.silencedUntil) return true;
  return false;
}

export function canScheduleInvite(state: InviteState, now: number): boolean {
  if (isSilenced(state, now)) return false;
  if (state.snoozeUntil !== null && now < state.snoozeUntil) return false;
  if (state.invitesToday >= MAX_INVITES_PER_DAY) return false;
  if (
    state.lastInviteAt !== null &&
    now - state.lastInviteAt < MIN_GAP_MS
  ) {
    return false;
  }
  return true;
}

function loginReady(state: InviteState, now: number): boolean {
  return (
    !state.loginInviteShown && now - state.loginAt >= LOGIN_DELAY_MS
  );
}

function unlockReady(
  state: InviteState,
  unlockedJustNow: boolean,
): boolean {
  return unlockedJustNow && !state.unlockInviteShownToday;
}

function idleReady(
  state: InviteState,
  now: number,
  idleSince: number | null,
): boolean {
  if (state.idle15ShownForPeriod || idleSince === null) return false;
  return now - idleSince >= IDLE_NO_SESSION_MS;
}

export function pickInviteTrigger(
  state: InviteState,
  input: EvaluateInput,
): InviteTrigger | null {
  if (isQuiet(input.quiet, input.now)) return null;
  if (!canScheduleInvite(state, input.now)) return null;
  if (loginReady(state, input.now)) return "login";
  if (unlockReady(state, input.unlockedJustNow)) return "unlock";
  if (idleReady(state, input.now, input.idleSince)) return "idle15";
  return null;
}

export function onInviteShown(
  state: InviteState,
  now: number,
  trigger: InviteTrigger,
): InviteState {
  const next: InviteState = {
    ...state,
    invitesToday: state.invitesToday + 1,
    lastInviteAt: now,
    pendingTrigger: trigger,
  };
  if (trigger === "login") next.loginInviteShown = true;
  if (trigger === "unlock") next.unlockInviteShownToday = true;
  if (trigger === "idle15") next.idle15ShownForPeriod = true;
  return next;
}

export function onInviteResponse(
  state: InviteState,
  now: number,
  response: InviteResponse,
): InviteState {
  const base: InviteState = { ...state, pendingTrigger: null };
  if (response === "start") {
    return { ...base, unansweredStreak: 0 };
  }
  if (response === "snooze15") {
    return {
      ...base,
      snoozeUntil: now + SNOOZE_MS,
      unansweredStreak: 0,
    };
  }
  return {
    ...base,
    silencedUntil: startOfNextLocalDay(now),
    unansweredStreak: 0,
  };
}

export function onInviteIgnored(state: InviteState, now: number): InviteState {
  const streak = state.unansweredStreak + 1;
  const next: InviteState = {
    ...state,
    pendingTrigger: null,
    unansweredStreak: streak,
  };
  if (streak >= MAX_UNANSWERED_BEFORE_NAP) {
    next.silencedUntil = startOfNextLocalDay(now);
    next.unansweredStreak = 0;
  }
  return next;
}

export function onSessionStarted(state: InviteState): InviteState {
  return { ...state, idle15ShownForPeriod: false, pendingTrigger: null };
}