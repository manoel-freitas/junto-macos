import categories from "../../config/distraction-categories.json";

export interface DistractionCategory {
  id: string;
  label: string;
  patterns: string[];
}

export const DISTRACTION_CATEGORIES: DistractionCategory[] = categories;

export function extractHostname(urlOrHost: string): string {
  const raw = urlOrHost.trim().toLowerCase();
  if (!raw) return "";
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^www\./, "").split("/")[0] ?? "";
  }
}

export function matchDistractionCategory(
  urlOrHost: string,
  enabledIds: Set<string>,
): DistractionCategory | null {
  const host = extractHostname(urlOrHost);
  const full = urlOrHost.toLowerCase();
  for (const cat of DISTRACTION_CATEGORIES) {
    if (!enabledIds.has(cat.id)) continue;
    for (const pat of cat.patterns) {
      const p = pat.toLowerCase();
      if (p.includes("/")) {
        if (full.includes(p)) return cat;
      } else if (host === p || host.endsWith(`.${p}`) || host.includes(p)) {
        return cat;
      }
    }
  }
  return null;
}