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

const ORDER: JuGestureKey[] = ["parada", "chamando", "pausa", "ajuste", "acabou"];

const SEMANTIC: Record<JuGestureKey, string[]> = {
  parada: ["idle", "breath", "breathing", "loop"],
  chamando: ["wave", "hello", "greet", "hand"],
  pausa: ["sleep", "sleepy", "yawn", "nemuri", "rest"],
  acabou: ["happy", "celebrate", "cheer", "joy", "smile", "clap", "special"],
  ajuste: ["flickhead", "shake", "tilt", "head"],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9@]/g, "");
}

function refKey(ref: GestureRef): string {
  return `${ref.group}:${ref.index}`;
}

function allMotionRefs(motions: Record<string, { File: string }[]>): GestureRef[] {
  const out: GestureRef[] = [];
  for (const group of Object.keys(motions)) {
    const list = motions[group]!;
    for (let i = 0; i < list.length; i++) {
      out.push({ group, index: i, file: list[i]!.File });
    }
  }
  return out;
}

function idleParadaRef(motions: Record<string, { File: string }[]>): GestureRef | null {
  const groups = Object.keys(motions);
  for (const group of groups) {
    const gn = norm(group);
    if (gn === "idle" || gn.includes("idle")) {
      const list = motions[group]!;
      if (list.length) return { group, index: 0, file: list[0]!.File };
    }
  }
  for (const group of groups) {
    const list = motions[group]!;
    for (let i = 0; i < list.length; i++) {
      const base = norm(list[i]!.File.split("/").pop() ?? "");
      for (const p of SEMANTIC.parada) {
        if (base.includes(p) || norm(group).includes(p)) {
          return { group, index: i, file: list[i]!.File };
        }
      }
    }
  }
  return null;
}

function semanticPick(
  key: JuGestureKey,
  refs: GestureRef[],
  used: Set<string>,
): GestureRef | null {
  const patterns = SEMANTIC[key];
  for (const ref of refs) {
    if (used.has(refKey(ref))) continue;
    const gn = norm(ref.group);
    const base = norm(ref.file.split("/").pop() ?? "");
    for (const p of patterns) {
      if (gn.includes(p) || base.includes(p)) return ref;
    }
  }
  return null;
}

function expressionHint(
  expressions: { Name: string }[] | undefined,
  keywords: string[],
): boolean {
  if (!expressions?.length) return false;
  return expressions.some((e) => {
    const n = norm(e.Name);
    return keywords.some((k) => n.includes(k));
  });
}

function scoreChamando(ref: GestureRef): number {
  const g = norm(ref.group);
  const f = norm(ref.file);
  if (g.includes("tap@body")) return 100;
  if (g === "tap") return 92;
  if (g.startsWith("tap") && !g.includes("@head")) return 82;
  if (g.includes("flick@body")) return 75;
  if (g === "flick" || (g.includes("flick") && !g.includes("down") && !g.includes("up"))) {
    return 55;
  }
  if (ref.group === "" || g === "") return 70;
  if (f.includes("wave") || f.includes("hello") || f.includes("greet")) return 95;
  if (f.includes("mtn02") || f.includes("mtn_02")) return 75;
  if (g.includes("tap")) return 60;
  return 0;
}

function scorePausa(
  ref: GestureRef,
  motions: Record<string, { File: string }[]>,
  parada: GestureRef | null,
): number {
  const g = norm(ref.group);
  const f = norm(ref.file);
  if (g.includes("flickdown") || f.includes("flickdown")) return 95;
  if (f.includes("sleep") || f.includes("yawn") || f.includes("nemuri")) return 100;
  if (g === "idle" && ref.index > 0) return 70 + ref.index;
  if (parada && ref.group === parada.group && ref.index > parada.index) {
    return 65 + ref.index;
  }
  if (g === "" && (f.includes("mtn03") || f.includes("mtn_03"))) return 80;
  if (g.includes("shake")) return 50;
  return 0;
}

function scoreAjuste(ref: GestureRef): number {
  const g = norm(ref.group);
  const f = norm(ref.file);
  if (g.includes("@head") || g.includes("flickup@head") || g.includes("tap@head")) return 100;
  if (g.includes("flickup") || g.includes("flickhead")) return 90;
  if (g.includes("shake") || f.includes("shake")) return 88;
  if (g === "flick" || (g.includes("flick") && !g.includes("down") && !g.includes("body"))) {
    return 60;
  }
  if (g === "" && (f.includes("mtn04") || f.includes("mtn_04"))) return 75;
  if (g.includes("flick3")) return 55;
  if (g.includes("flickleft")) return 65;
  return 0;
}

function scoreAcabou(
  ref: GestureRef,
  hasSmileExpr: boolean,
  hasHappyMotion: boolean,
): number {
  const g = norm(ref.group);
  const f = norm(ref.file);
  if (f.includes("special")) return 95;
  if (f.includes("happy") || f.includes("smile") || f.includes("celebrate")) return 100;
  if (g === "tap" || g.includes("tap")) return hasSmileExpr ? 45 : 40;
  if (g === "" && f.includes("special")) return 95;
  if (hasSmileExpr && (g === "tap" || f.includes("mtn"))) return 50;
  if (hasHappyMotion && g.includes("flick") && !g.includes("down")) return 35;
  return 0;
}

function bestByScore(
  refs: GestureRef[],
  used: Set<string>,
  scoreFn: (ref: GestureRef) => number,
  minScore = 1,
): GestureRef | null {
  let best: GestureRef | null = null;
  let bestScore = minScore - 1;
  for (const ref of refs) {
    if (used.has(refKey(ref))) continue;
    const s = scoreFn(ref);
    if (s > bestScore) {
      bestScore = s;
      best = ref;
    }
  }
  return bestScore >= minScore ? best : null;
}

export class GestureMap {
  static fromModel3(model3: Model3Shape): JuGestureMap {
    const motions = model3.FileReferences?.Motions ?? {};
    const expressions = model3.FileReferences?.Expressions;
    const refs = allMotionRefs(motions);
    const used = new Set<string>();
    const result: JuGestureMap = {
      parada: null,
      chamando: null,
      pausa: null,
      acabou: null,
      ajuste: null,
    };

    if (!refs.length) return result;

    const parada = idleParadaRef(motions);
    if (parada) {
      result.parada = parada;
      used.add(refKey(parada));
    }

    for (const key of ORDER) {
      if (key === "parada") continue;
      const semantic = semanticPick(key, refs, used);
      if (semantic) {
        result[key] = semantic;
        used.add(refKey(semantic));
      }
    }

    const hasSmile = expressionHint(expressions, ["smile", "happy", "joy"]);
    const hasSad = expressionHint(expressions, ["sad", "sleep"]);

    if (!result.chamando) {
      const pick = bestByScore(refs, used, scoreChamando);
      if (pick) {
        result.chamando = pick;
        used.add(refKey(pick));
      }
    }

    if (!result.ajuste) {
      const pick = bestByScore(refs, used, scoreAjuste);
      if (pick) {
        result.ajuste = pick;
        used.add(refKey(pick));
      }
    }

    if (!result.pausa) {
      const pick = bestByScore(refs, used, (ref) => {
        let s = scorePausa(ref, motions, parada);
        if (hasSad && ref.group === parada?.group && ref.index > 0) s += 5;
        return s;
      });
      if (pick) {
        result.pausa = pick;
        used.add(refKey(pick));
      }
    }

    if (!result.acabou) {
      const pick = bestByScore(refs, used, (ref) =>
        scoreAcabou(ref, hasSmile, !!result.chamando),
      );
      if (pick) {
        result.acabou = pick;
        used.add(refKey(pick));
      }
    }

    if (refs.length === 1) {
      const single = refs[0]!;
      const base = norm(single.file);
      const gn = norm(single.group);
      if (base.includes("happy") || gn.includes("happy")) {
        result.acabou = single;
      } else if (!result.parada) {
        result.parada = single;
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

  /** Para testes e debug: resumo legível do mapa. */
  static formatMap(gestures: JuGestureMap): Record<JuGestureKey, string> {
    const fmt = (ref: GestureRef | null): string =>
      ref ? `${ref.group || "(sem nome)"}[${ref.index}]` : "?";
    return {
      parada: fmt(gestures.parada),
      chamando: fmt(gestures.chamando),
      pausa: fmt(gestures.pausa),
      acabou: fmt(gestures.acabou),
      ajuste: fmt(gestures.ajuste),
    };
  }
}