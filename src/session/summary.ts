import type { Outcome } from "./machine";

export interface SessionRecord {
  goal: string;
  durationLabel: string;
  startedAt: string;
  endedAt: string;
  focusMs: number;
  outcome: Outcome | null;
  activeApp: string;
}

export function formatFocusDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m} min`;
}

export function daySummaryLines(records: SessionRecord[], dateLabel: string): string[] {
  const done = records.filter((r) => r.outcome === "sim").length;
  const partial = records.filter((r) => r.outcome === "parcial").length;
  const totalFocus = records.reduce((a, r) => a + r.focusMs, 0);
  const longest = records.reduce<SessionRecord | null>((best, r) => {
    if (!best || r.focusMs > best.focusMs) return r;
    return best;
  }, null);

  const line1 = `${records.length} sessões, ${formatFocusDuration(totalFocus)} de foco`;
  const line2 = `${done} metas concluídas, ${partial} parciais`;
  const line3 = longest
    ? `Mais longa: ${formatFocusDuration(longest.focusMs)} no ${longest.goal}`
  : `Hoje · ${dateLabel}`;

  return [line1, line2, line3];
}