import { describe, expect, it } from "vitest";
import {
  IDLE_NO_SESSION_MS,
  LOGIN_DELAY_MS,
  MIN_GAP_MS,
  initialInviteState,
  onInviteIgnored,
  onInviteResponse,
  onInviteShown,
  pickInviteTrigger,
  rollDailyState,
  type InviteState,
} from "./machine";
import { DEFAULT_WORK_HOURS, isWithinWorkHours } from "./work-hours";

const mon0945 = new Date("2026-03-02T09:45:00-03:00").getTime();

function quietOpen(now: number) {
  return {
    inWorkHours: isWithinWorkHours(DEFAULT_WORK_HOURS, now),
    meeting: false,
    fullscreen: false,
    mutedUntil: null,
    sessionActive: false,
  };
}

function evalAt(state: InviteState, now: number, extra?: { unlock?: boolean; idleSince?: number | null }) {
  return pickInviteTrigger(state, {
    now,
    quiet: quietOpen(now),
    unlockedJustNow: extra?.unlock ?? false,
    idleSince: extra?.idleSince ?? null,
  });
}

describe("invite machine", () => {
  it("fires login trigger after 2 minutes", () => {
    const t0 = mon0945;
    let s = initialInviteState(t0);
    expect(evalAt(s, t0 + LOGIN_DELAY_MS - 1)).toBeNull();
    expect(evalAt(s, t0 + LOGIN_DELAY_MS)).toBe("login");
  });

  it("respects 45 min gap and max 3 per day", () => {
    const t0 = mon0945 + LOGIN_DELAY_MS;
    let s = initialInviteState(mon0945);
    s = onInviteShown(s, t0, "login");
    expect(evalAt(s, t0 + 1, { unlock: true })).toBeNull();
    const t1 = t0 + MIN_GAP_MS;
    expect(evalAt(s, t1, { unlock: true })).toBe("unlock");
    s = onInviteShown(s, t1, "unlock");
    const t2 = t1 + MIN_GAP_MS;
    expect(evalAt(s, t2, { idleSince: t2 - IDLE_NO_SESSION_MS })).toBe("idle15");
    s = onInviteShown(s, t2, "idle15");
    expect(evalAt(s, t2 + MIN_GAP_MS)).toBeNull();
  });

  it("snoozes 15 min on response 2", () => {
    const t0 = mon0945 + LOGIN_DELAY_MS;
    let s = onInviteShown(initialInviteState(mon0945), t0, "login");
    s = onInviteResponse(s, t0, "snooze15");
    expect(evalAt(s, t0 + 1)).toBeNull();
    const afterSnooze = t0 + 15 * 60 * 1000 + MIN_GAP_MS;
    expect(
      evalAt(s, afterSnooze, { idleSince: afterSnooze - IDLE_NO_SESSION_MS }),
    ).toBe("idle15");
  });

  it("silences until tomorrow on not_today", () => {
    const t0 = mon0945 + LOGIN_DELAY_MS;
    let s = onInviteResponse(
      onInviteShown(initialInviteState(mon0945), t0, "login"),
      t0,
      "not_today",
    );
    expect(evalAt(s, t0 + 60_000)).toBeNull();
    const nextDay = new Date("2026-03-03T10:00:00-03:00").getTime();
    s = rollDailyState(s, nextDay);
    expect(evalAt(s, nextDay, { unlock: true })).toBe("unlock");
  });

  it("naps after 3 ignores without punishment counter reset mid-day", () => {
    const t0 = mon0945 + LOGIN_DELAY_MS;
    let s = initialInviteState(mon0945);
    for (let i = 0; i < 3; i++) {
      const at = t0 + i * MIN_GAP_MS;
      s = onInviteShown(s, at, "login");
      s = onInviteIgnored(s, at);
    }
    expect(s.silencedUntil).not.toBeNull();
    expect(evalAt(s, t0 + 3 * MIN_GAP_MS)).toBeNull();
  });

  it("stays quiet in meeting", () => {
    const t0 = mon0945 + LOGIN_DELAY_MS;
    const s = initialInviteState(mon0945);
    const trigger = pickInviteTrigger(s, {
      now: t0,
      quiet: { ...quietOpen(t0), meeting: true },
      unlockedJustNow: false,
      idleSince: null,
    });
    expect(trigger).toBeNull();
  });
});