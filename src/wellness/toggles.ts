export interface WellnessToggles {
  breath: boolean;
  water: boolean;
  stretch: boolean;
  longBreak: boolean;
}

export const DEFAULT_WELLNESS: WellnessToggles = {
  breath: false,
  water: true,
  stretch: true,
  longBreak: true,
};

export function loadWellnessToggles(raw: Partial<WellnessToggles> | null): WellnessToggles {
  return {
    breath: raw?.breath ?? DEFAULT_WELLNESS.breath,
    water: raw?.water ?? DEFAULT_WELLNESS.water,
    stretch: raw?.stretch ?? DEFAULT_WELLNESS.stretch,
    longBreak: raw?.longBreak ?? DEFAULT_WELLNESS.longBreak,
  };
}