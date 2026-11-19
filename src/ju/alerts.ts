export type AlertLevel = 1 | 2 | 3;

const COOLDOWN_MS = 10 * 60 * 1000;
const LEVEL2_DELAY_MS = 20_000;

export interface AlertGate {
  lastAlertAt: number | null;
  level: AlertLevel;
  level2Timer: ReturnType<typeof setTimeout> | null;
}

export function initialAlertGate(): AlertGate {
  return { lastAlertAt: null, level: 1, level2Timer: null };
}

export function canFireAlert(gate: AlertGate, now = Date.now()): boolean {
  if (gate.lastAlertAt === null) return true;
  return now - gate.lastAlertAt >= COOLDOWN_MS;
}

export function beginAlert(
  gate: AlertGate,
  now = Date.now(),
  onLevel2?: () => void,
): AlertGate {
  const next: AlertGate = {
    ...gate,
    level: 1,
    lastAlertAt: now,
    level2Timer: null,
  };
  if (onLevel2) {
    next.level2Timer = setTimeout(() => {
      onLevel2();
    }, LEVEL2_DELAY_MS);
  }
  return next;
}

export function escalateToLevel2(gate: AlertGate): AlertGate {
  if (gate.level >= 2) return gate;
  return { ...gate, level: 2 };
}

export function escalateToLevel3(gate: AlertGate): AlertGate {
  return { ...gate, level: 3 };
}

export function clearAlertTimers(gate: AlertGate): AlertGate {
  if (gate.level2Timer) clearTimeout(gate.level2Timer);
  return { ...gate, level2Timer: null, level: 1 };
}

export const ALERT_COOLDOWN_MS = COOLDOWN_MS;
export const ALERT_LEVEL2_MS = LEVEL2_DELAY_MS;