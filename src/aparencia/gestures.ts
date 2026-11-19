export type JuGestureKey = "parada" | "chamando" | "pausa" | "acabou" | "ajuste";

export interface GestureRef {
  group: string;
  index: number;
  file: string;
}

export type JuGestureMap = Record<JuGestureKey, GestureRef | null>;

export interface Model3Shape {
  FileReferences?: {
    Motions?: Record<string, { File: string }[]>;
    Expressions?: { Name: string; File: string }[];
    Moc?: string;
  };
  Groups?: { Name: string; Target: string }[];
  HitAreas?: { Id: string; Name: string }[];
}

const KEYWORDS: Record<JuGestureKey, string[]> = {
  parada: ["idle", "breath", "breathing", "loop"],
  chamando: ["wave", "hello", "greet", "hand"],
  pausa: ["sleep", "sleepy", "yawn", "nemuri"],
  acabou: ["happy", "celebrate", "cheer", "joy", "smile", "clap"],
  ajuste: ["flickhead", "shake", "tilt", "head"],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export class GestureMap {
  static fromModel3(model3: Model3Shape): JuGestureMap {
    const motions = model3.FileReferences?.Motions ?? {};
    const groups = Object.keys(motions);
    const used = new Set<string>();

    const pick = (keys: JuGestureKey): GestureRef | null => {
      const patterns = KEYWORDS[keys];
      for (const group of groups) {
        const gn = norm(group);
        for (const p of patterns) {
          if (gn.includes(p)) {
            const list = motions[group]!;
            if (!list.length) continue;
            const key = `${group}:0`;
            if (used.has(key)) continue;
            used.add(key);
            return { group, index: 0, file: list[0]!.File };
          }
        }
        const list = motions[group]!;
        for (let i = 0; i < list.length; i++) {
          const base = norm(list[i]!.File.split("/").pop() ?? "");
          for (const p of patterns) {
            if (base.includes(p)) {
              const key = `${group}:${i}`;
              if (used.has(key)) continue;
              used.add(key);
              return { group, index: i, file: list[i]!.File };
            }
          }
        }
      }
      return null;
    };

    let result: JuGestureMap = {
      parada: pick("parada"),
      chamando: pick("chamando"),
      pausa: pick("pausa"),
      acabou: pick("acabou"),
      ajuste: pick("ajuste"),
    };

    const allRefs: GestureRef[] = [];
    for (const g of groups) {
      const list = motions[g]!;
      for (let i = 0; i < list.length; i++) {
        allRefs.push({ group: g, index: i, file: list[i]!.File });
      }
    }
    if (allRefs.length === 1 && !Object.values(result).some(Boolean)) {
      const singleHappy =
        norm(allRefs[0]!.file).includes("happy") ||
        norm(allRefs[0]!.group).includes("happy");
      if (singleHappy) {
        result = {
          parada: null,
          chamando: null,
          pausa: null,
          acabou: allRefs[0]!,
          ajuste: null,
        };
      }
    }

    return result;
  }

  static previewChips(
    model3: Model3Shape,
    gestures: JuGestureMap,
  ): { label: string; ok: boolean }[] {
    const hasEyeBlink = (model3.Groups ?? []).some(
      (g) => g.Name === "EyeBlink" || norm(g.Name).includes("eyeblink"),
    );
    return [
      {
        label: "respira e pisca",
        ok: gestures.parada !== null || hasEyeBlink,
      },
      {
        label: "expressões",
        ok: (model3.FileReferences?.Expressions?.length ?? 0) > 0,
      },
      { label: "aceno", ok: gestures.chamando !== null },
      { label: "sono", ok: gestures.pausa !== null },
    ];
  }
}