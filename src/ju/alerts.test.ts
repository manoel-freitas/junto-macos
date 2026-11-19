import { describe, expect, it, vi, afterEach } from "vitest";
import {
  ALERT_COOLDOWN_MS,
  ALERT_LEVEL2_MS,
  beginAlert,
  canFireAlert,
  clearAlertTimers,
  escalateToLevel2,
  escalateToLevel3,
  initialAlertGate,
} from "./alerts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("alert cooldown", () => {
  it("allows first alert", () => {
    expect(canFireAlert(initialAlertGate(), 0)).toBe(true);
  });

  it("blocks within 10 min", () => {
    const t0 = 1_000_000;
    const gate = beginAlert(initialAlertGate(), t0);
    expect(canFireAlert(gate, t0 + ALERT_COOLDOWN_MS - 1)).toBe(false);
    expect(canFireAlert(gate, t0 + ALERT_COOLDOWN_MS)).toBe(true);
  });
});

describe("alert levels", () => {
  it("starts at level 1", () => {
    const gate = beginAlert(initialAlertGate(), 0);
    expect(gate.level).toBe(1);
  });

  it("escalates 2 and 3", () => {
    let gate = beginAlert(initialAlertGate(), 0);
    gate = escalateToLevel2(gate);
    expect(gate.level).toBe(2);
    gate = escalateToLevel3(gate);
    expect(gate.level).toBe(3);
  });

  it("schedules level 2 after 20s", () => {
    vi.useFakeTimers();
    const on2 = vi.fn();
    beginAlert(initialAlertGate(), 0, on2);
    vi.advanceTimersByTime(ALERT_LEVEL2_MS - 1);
    expect(on2).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(on2).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("clearAlertTimers resets", () => {
    vi.useFakeTimers();
    const gate = beginAlert(initialAlertGate(), 0, () => undefined);
    const cleared = clearAlertTimers(gate);
    expect(cleared.level2Timer).toBeNull();
    vi.useRealTimers();
  });
});