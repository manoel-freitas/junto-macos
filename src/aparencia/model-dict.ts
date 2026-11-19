import { Catalog, type CatalogEntry } from "./catalog";
import type { JuGestureMap, Model3Shape } from "./gestures";

const MAO_EMOTION_MAP: Record<string, number> = {
  neutral: 0,
  anger: 2,
  disgust: 2,
  fear: 1,
  joy: 3,
  smirk: 3,
  sadness: 1,
  surprise: 3,
};

const EXPRESSION_KEYWORDS: Record<string, string[]> = {
  anger: ["anger", "angry"],
  disgust: ["disgust"],
  fear: ["fear", "scared"],
  joy: ["joy", "happy"],
  smirk: ["smirk"],
  sadness: ["sad", "sadness"],
  surprise: ["surprise"],
  neutral: ["neutral", "exp"],
};

export interface ModelDictEntry {
  name: string;
  description: string;
  url: string;
  kScale: number;
  initialXshift: number;
  initialYshift: number;
  kXOffset: number;
  idleMotionGroupName: string;
  emotionMap: Record<string, number>;
  tapMotions: Record<string, Record<string, number>>;
}

export class ModelDictUpdate {
  static upsert(
    existing: ModelDictEntry[],
    entry: ModelDictEntry,
  ): ModelDictEntry[] {
    const out = existing.filter((e) => e.name !== entry.name);
    out.push(entry);
    return out;
  }

  static buildEntry(
    entry: CatalogEntry,
    model3PublicUrl: string,
    model3: Model3Shape,
    gestures: JuGestureMap,
  ): ModelDictEntry {
    const expressions = model3.FileReferences?.Expressions ?? [];
    const expCount = expressions.length;
    const emotionMap: Record<string, number> = {};
    if (expCount === 0) {
      emotionMap.neutral = 0;
    } else {
      for (const [emo, keywords] of Object.entries(EXPRESSION_KEYWORDS)) {
        for (let i = 0; i < expressions.length; i++) {
          const name = expressions[i]!.Name.toLowerCase();
          if (keywords.some((k) => name.includes(k))) {
            emotionMap[emo] = i;
            break;
          }
        }
        if (emotionMap[emo] === undefined && emo in MAO_EMOTION_MAP) {
          emotionMap[emo] = Math.min(MAO_EMOTION_MAP[emo]!, expCount - 1);
        }
      }
      if (emotionMap.neutral === undefined) emotionMap.neutral = 0;
    }

    const motions = model3.FileReferences?.Motions ?? {};
    let idleGroup = gestures.parada?.group ?? "";
    if (!idleGroup && "Idle" in motions) idleGroup = "Idle";
    if (!idleGroup) {
      const keys = Object.keys(motions);
      idleGroup = keys[0] ?? "";
    }

    const hitAreas = model3.HitAreas ?? [];
    const tapRef = gestures.chamando ?? gestures.parada;
    const tapMotions: Record<string, Record<string, number>> = {};
    for (const ha of hitAreas) {
      if (tapRef) {
        tapMotions[ha.Id] = { [tapRef.group]: tapRef.index };
      } else if (idleGroup) {
        tapMotions[ha.Id] = { [idleGroup]: 0 };
      }
    }
    if (Object.keys(tapMotions).length === 0 && idleGroup) {
      tapMotions.HitAreaHead = { [idleGroup]: 0 };
      tapMotions.HitAreaBody = { [idleGroup]: 0 };
    }

    const url = model3PublicUrl.startsWith("/")
      ? model3PublicUrl
      : `/${model3PublicUrl}`;

    return {
      name: entry.olvtName,
      description: entry.displayName,
      url,
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      kXOffset: 1150,
      idleMotionGroupName: idleGroup,
      emotionMap,
      tapMotions,
    };
  }
}

export interface ConfYamlShape {
  character_config: { live2d_model_name: string; [key: string]: unknown };
  [key: string]: unknown;
}

export class ConfUpdate {
  static withLive2dModelName(
    conf: ConfYamlShape,
    olvtName: string,
  ): ConfYamlShape {
    const cat = Catalog.all.find((e) => e.olvtName === olvtName);
    if (!cat && olvtName !== "mao_pro") {
      throw new Error(`Modelo desconhecido: ${olvtName}`);
    }
    return {
      ...conf,
      character_config: {
        ...conf.character_config,
        live2d_model_name: olvtName,
      },
    };
  }

  static activeOlvtName(
    activeId: string,
    installed: Record<string, { olvtName: string }>,
  ): string {
    return installed[activeId]?.olvtName ?? "mao_pro";
  }
}