export interface WorkHoursConfig {
  /** 0 = domingo … 6 = sábado */
  weekdays: number[];
  startHour: number;
  endHour: number;
}

export const DEFAULT_WORK_HOURS: WorkHoursConfig = {
  weekdays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 18,
};

const STORAGE_KEY = "junto.workHours";

export function loadWorkHours(
  raw: string | null | undefined,
): WorkHoursConfig {
  if (!raw) return { ...DEFAULT_WORK_HOURS };
  try {
    const parsed = JSON.parse(raw) as Partial<WorkHoursConfig>;
    return {
      weekdays: Array.isArray(parsed.weekdays)
        ? parsed.weekdays.filter((d) => d >= 0 && d <= 6)
        : [...DEFAULT_WORK_HOURS.weekdays],
      startHour:
        typeof parsed.startHour === "number"
          ? parsed.startHour
          : DEFAULT_WORK_HOURS.startHour,
      endHour:
        typeof parsed.endHour === "number"
          ? parsed.endHour
          : DEFAULT_WORK_HOURS.endHour,
    };
  } catch {
    return { ...DEFAULT_WORK_HOURS };
  }
}

export function loadWorkHoursFromStorage(): WorkHoursConfig {
  try {
    return loadWorkHours(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_WORK_HOURS };
  }
}

export function saveWorkHours(cfg: WorkHoursConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function isWithinWorkHours(
  cfg: WorkHoursConfig,
  now = Date.now(),
): boolean {
  const d = new Date(now);
  const day = d.getDay();
  if (!cfg.weekdays.includes(day)) return false;
  const minutes = d.getHours() * 60 + d.getMinutes();
  const start = cfg.startHour * 60;
  const end = cfg.endHour * 60;
  return minutes >= start && minutes < end;
}