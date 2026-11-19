export type AparenciaCategory = "pessoas" | "bichinhos" | "chibi";

export type BadgeKind = "instalada" | "baixar" | "licenca";

export type FilterKind = "todas" | AparenciaCategory | "instaladas";

export interface CatalogEntry {
  readonly id: string;
  readonly displayName: string;
  readonly category: AparenciaCategory;
  readonly olvtName: string;
  readonly zipPath: string | null;
  readonly thumbUrl: string;
  readonly otherLicense: boolean;
  readonly noRecolor: boolean;
}

const ZIP_BASE = "https://cubism.live2d.com/sample-data/bin/";
const THUMB_BASE = "https://www.live2d.com/wp-content/uploads/2026/06/";

const ENTRIES: CatalogEntry[] = [
  {
    id: "mao",
    displayName: "Mao",
    category: "pessoas",
    olvtName: "mao_pro",
    zipPath: null,
    thumbUrl: `${THUMB_BASE}sample-img-niziiromao.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "hiyori",
    displayName: "Hiyori",
    category: "pessoas",
    olvtName: "hiyori",
    zipPath: `${ZIP_BASE}hiyori/hiyori_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-hiyori.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "haru",
    displayName: "Haru",
    category: "pessoas",
    olvtName: "haru",
    zipPath: `${ZIP_BASE}haru/haru_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-haru.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "haru_greeter",
    displayName: "Haru recepcionista",
    category: "pessoas",
    olvtName: "haru_greeter",
    zipPath: `${ZIP_BASE}haru_greeter/haru_greeter_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-haru-greeter.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "kei",
    displayName: "Kei",
    category: "pessoas",
    olvtName: "kei",
    zipPath: `${ZIP_BASE}kei/kei_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-kei.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "rice",
    displayName: "Rice",
    category: "pessoas",
    olvtName: "rice",
    zipPath: `${ZIP_BASE}rice/rice_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-rice.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "miara",
    displayName: "Miara",
    category: "pessoas",
    olvtName: "miara",
    zipPath: `${ZIP_BASE}miara/miara_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-miara.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "epsilon",
    displayName: "Epsilon",
    category: "pessoas",
    olvtName: "epsilon",
    zipPath: `${ZIP_BASE}epsilon/epsilon_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-epsillon.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "shizuku",
    displayName: "Shizuku",
    category: "pessoas",
    olvtName: "shizuku",
    zipPath: `${ZIP_BASE}shizuku/shizuku_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-shizuku.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "hibiki",
    displayName: "Hibiki",
    category: "pessoas",
    olvtName: "hibiki",
    zipPath: `${ZIP_BASE}hibiki/hibiki_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-hibiki.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "izumi",
    displayName: "Izumi",
    category: "pessoas",
    olvtName: "izumi",
    zipPath: `${ZIP_BASE}izumi/izumi_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-izumi.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "ren",
    displayName: "Ren",
    category: "pessoas",
    olvtName: "ren",
    zipPath: `${ZIP_BASE}ren/ren_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-ren.png`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "jin",
    displayName: "Jin",
    category: "pessoas",
    olvtName: "jin",
    zipPath: `${ZIP_BASE}natori/natori_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-jin.jpg`,
    otherLicense: true,
    noRecolor: true,
  },
  {
    id: "chitose",
    displayName: "Chitose",
    category: "pessoas",
    olvtName: "chitose",
    zipPath: `${ZIP_BASE}chitose/chitose_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-chitose.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "gantzert",
    displayName: "Gantzert e dragão",
    category: "pessoas",
    olvtName: "gantzert",
    zipPath: `${ZIP_BASE}gantzert_felixander/gantzert_felixander_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-gantzert.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "miku",
    displayName: "Hatsune Miku",
    category: "pessoas",
    olvtName: "miku",
    zipPath: `${ZIP_BASE}miku/miku_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-miku.jpg`,
    otherLicense: true,
    noRecolor: false,
  },
  {
    id: "tsumiki",
    displayName: "Tsumiki",
    category: "pessoas",
    olvtName: "tsumiki",
    zipPath: `${ZIP_BASE}tsumiki/tsumiki_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-tsumiki.png`,
    otherLicense: true,
    noRecolor: true,
  },
  {
    id: "wanko",
    displayName: "Wankoromochi",
    category: "bichinhos",
    olvtName: "wanko",
    zipPath: `${ZIP_BASE}wanko/wanko_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-wanko.png`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "tororo",
    displayName: "Tororo e Hijiki",
    category: "bichinhos",
    olvtName: "tororo",
    zipPath: `${ZIP_BASE}tororo_hijiki/tororo_hijiki_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-th.png`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "koharu",
    displayName: "Koharu e Haruto",
    category: "chibi",
    olvtName: "koharu",
    zipPath: `${ZIP_BASE}koharu_haruto/koharu_haruto_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-SD.png`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "nito",
    displayName: "Nito",
    category: "chibi",
    olvtName: "nito",
    zipPath: `${ZIP_BASE}nito/nito_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-nito-2.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "mark",
    displayName: "Mark-kun",
    category: "chibi",
    olvtName: "mark",
    zipPath: `${ZIP_BASE}mark/mark_en.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-mark.jpg`,
    otherLicense: false,
    noRecolor: false,
  },
  {
    id: "unity",
    displayName: "Unity-chan",
    category: "chibi",
    olvtName: "unity",
    zipPath: `${ZIP_BASE}unitychan/unitychan_ja.zip`,
    thumbUrl: `${THUMB_BASE}sample-img-unity.png`,
    otherLicense: true,
    noRecolor: false,
  },
  {
    id: "zundamon",
    displayName: "Zundamon",
    category: "chibi",
    olvtName: "zundamon",
    zipPath: `${ZIP_BASE}zundamon/zundamon_ja.zip`,
    thumbUrl:
      "https://www.live2d.com/wp-content/uploads/2026/07/zundamon_%E3%82%B5%E3%83%A0%E3%83%8D%E3%82%A4%E3%83%AB.png",
    otherLicense: true,
    noRecolor: false,
  },
];

export const LICENSE_URL =
  "https://www.live2d.com/eula/live2d-sample-model-terms_en.html";

export class Catalog {
  static readonly all = ENTRIES;

  static getById(id: string): CatalogEntry | undefined {
    return ENTRIES.find((e) => e.id === id);
  }

  static counts(installedIds: ReadonlySet<string>): Record<FilterKind, number> {
    const instaladas = ENTRIES.filter((e) => installedIds.has(e.id)).length;
    return {
      todas: ENTRIES.length,
      pessoas: ENTRIES.filter((e) => e.category === "pessoas").length,
      bichinhos: ENTRIES.filter((e) => e.category === "bichinhos").length,
      chibi: ENTRIES.filter((e) => e.category === "chibi").length,
      instaladas,
    };
  }

  static badge(
    entry: CatalogEntry,
    installedIds: ReadonlySet<string>,
  ): BadgeKind {
    if (installedIds.has(entry.id)) return "instalada";
    if (entry.otherLicense) return "licenca";
    return "baixar";
  }

  static filter(
    entries: readonly CatalogEntry[],
    filter: FilterKind,
    installedIds: ReadonlySet<string>,
    query: string,
  ): CatalogEntry[] {
    let list = [...entries];
    if (filter === "instaladas") {
      list = list.filter((e) => installedIds.has(e.id));
    } else if (filter !== "todas") {
      list = list.filter((e) => e.category === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const lower = e.displayName.toLowerCase();
        const first = lower.split(/\s/)[0] ?? lower;
        return first.startsWith(q) || lower === q;
      });
    }
    return list;
  }

  static categoryLabel(cat: AparenciaCategory): string {
    switch (cat) {
      case "pessoas":
        return "Pessoas";
      case "bichinhos":
        return "Bichinhos";
      case "chibi":
        return "Chibi";
    }
  }
}