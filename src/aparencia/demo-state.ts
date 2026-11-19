import { AparenciaMachine, type AparenciaMachineState } from "./machine";

export const DEMO_ESTADOS = ["carregando", "baixando", "falha", "licenca"] as const;
export type DemoEstado = (typeof DEMO_ESTADOS)[number];

export function parseDemoEstado(search: string): DemoEstado | null {
  const p = new URLSearchParams(search).get("estado");
  if (p && (DEMO_ESTADOS as readonly string[]).includes(p)) {
    return p as DemoEstado;
  }
  return null;
}

export function applyAparenciaDemoEstado(
  estado: DemoEstado,
  machine = AparenciaMachine.initial("mao"),
): { machine: AparenciaMachineState; imagesLoaded: boolean } {
  let s: AparenciaMachineState = {
    ...machine,
    activeId: "mao",
    selectedId: "mao",
    filter: "todas",
    query: "",
  };

  if (estado === "carregando") {
    return { machine: { ...s, phase: "carregando" }, imagesLoaded: false };
  }

  s = AparenciaMachine.imagesReady(s);

  if (estado === "baixando") {
    s = AparenciaMachine.beginDownload(s, "hiyori");
    s = AparenciaMachine.progress(s, 45, 100);
  } else if (estado === "falha") {
    s = AparenciaMachine.beginDownload(s, "hiyori");
    s = AparenciaMachine.fail(s, "Hiyori", "timeout de rede");
    s = { ...s, selectedId: "hiyori", downloadId: "hiyori" };
  } else if (estado === "licenca") {
    s = AparenciaMachine.needLicense(s, "jin");
    s = { ...s, selectedId: "jin" };
  }

  return { machine: s, imagesLoaded: true };
}