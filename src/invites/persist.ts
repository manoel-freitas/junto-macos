import {
  dateKeyLocal,
  initialInviteState,
  type InviteState,
} from "./machine";

const KEY = "junto.inviteState";

type Persisted = Omit<
  InviteState,
  "loginAt" | "loginInviteShown" | "pendingTrigger"
>;

export function loadPersistedInviteState(now = Date.now()): InviteState {
  const base = initialInviteState(now);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<Persisted>;
    if (p.dateKey !== dateKeyLocal(now)) {
      return base;
    }
    return {
      ...base,
      invitesToday: p.invitesToday ?? 0,
      unansweredStreak: p.unansweredStreak ?? 0,
      lastInviteAt: p.lastInviteAt ?? null,
      silencedUntil: p.silencedUntil ?? null,
      snoozeUntil: p.snoozeUntil ?? null,
      unlockInviteShownToday: p.unlockInviteShownToday ?? false,
      idle15ShownForPeriod: p.idle15ShownForPeriod ?? false,
    };
  } catch {
    return base;
  }
}

export function savePersistedInviteState(state: InviteState): void {
  const p: Persisted = {
    dateKey: state.dateKey,
    invitesToday: state.invitesToday,
    unansweredStreak: state.unansweredStreak,
    lastInviteAt: state.lastInviteAt,
    silencedUntil: state.silencedUntil,
    snoozeUntil: state.snoozeUntil,
    unlockInviteShownToday: state.unlockInviteShownToday,
    idle15ShownForPeriod: state.idle15ShownForPeriod,
  };
  localStorage.setItem(KEY, JSON.stringify(p));
}