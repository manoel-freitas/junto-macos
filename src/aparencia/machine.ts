import { Catalog } from "./catalog";
import type { FilterKind } from "./catalog";

export type AparenciaPhase =
  | "carregando"
  | "pronta"
  | "licenca"
  | "baixando"
  | "falha";

export interface AparenciaMachineState {
  phase: AparenciaPhase;
  activeId: string;
  selectedId: string;
  filter: FilterKind;
  query: string;
  downloadId: string | null;
  progressReceived: number;
  progressTotal: number;
  failName: string | null;
  failReason: string | null;
}

export class AparenciaMachine {
  static initial(activeId = "mao"): AparenciaMachineState {
    return {
      phase: "carregando",
      activeId,
      selectedId: activeId,
      filter: "todas",
      query: "",
      downloadId: null,
      progressReceived: 0,
      progressTotal: 0,
      failName: null,
      failReason: null,
    };
  }

  static imagesReady(s: AparenciaMachineState): AparenciaMachineState {
    if (s.phase !== "carregando") return s;
    return { ...s, phase: "pronta" };
  }

  static select(s: AparenciaMachineState, id: string): AparenciaMachineState {
    return { ...s, selectedId: id };
  }

  static setFilter(s: AparenciaMachineState, filter: FilterKind): AparenciaMachineState {
    return { ...s, filter };
  }

  static setQuery(s: AparenciaMachineState, query: string): AparenciaMachineState {
    return { ...s, query };
  }

  static beginDownload(s: AparenciaMachineState, id: string): AparenciaMachineState {
    return {
      ...s,
      phase: "baixando",
      selectedId: id,
      downloadId: id,
      progressReceived: 0,
      progressTotal: 0,
      failName: null,
      failReason: null,
    };
  }

  static needLicense(s: AparenciaMachineState, id: string): AparenciaMachineState {
    return { ...s, phase: "licenca", selectedId: id, downloadId: id };
  }

  static progress(
    s: AparenciaMachineState,
    received: number,
    total: number,
  ): AparenciaMachineState {
    if (s.phase !== "baixando") return s;
    return { ...s, progressReceived: received, progressTotal: total };
  }

  static cancel(s: AparenciaMachineState): AparenciaMachineState {
    const prevActive = s.activeId;
    return {
      ...AparenciaMachine.initial(prevActive),
      phase: "pronta",
      activeId: prevActive,
      selectedId: s.selectedId,
      filter: s.filter,
      query: s.query,
    };
  }

  static fail(
    s: AparenciaMachineState,
    displayName: string,
    reason: string,
  ): AparenciaMachineState {
    return {
      ...s,
      phase: "falha",
      failName: displayName,
      failReason: reason,
    };
  }

  static retry(
    s: AparenciaMachineState,
    needsLicense: boolean,
    licenseAccepted: boolean,
  ): AparenciaMachineState {
    const id = s.downloadId ?? s.selectedId;
    const entry = Catalog.getById(id);
    if (needsLicense && entry?.otherLicense && !licenseAccepted) {
      return { ...s, phase: "licenca", failName: null, failReason: null };
    }
    return AparenciaMachine.beginDownload(
      { ...s, failName: null, failReason: null },
      id,
    );
  }

  static committed(
    s: AparenciaMachineState,
    id: string,
    persistActive: boolean,
  ): AparenciaMachineState {
    return {
      ...s,
      phase: "pronta",
      downloadId: null,
      activeId: persistActive ? id : s.activeId,
      selectedId: id,
      progressReceived: 0,
      progressTotal: 0,
      failName: null,
      failReason: null,
    };
  }
}