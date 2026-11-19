import type { JuGestureMap, Model3Shape } from "./gestures";
import type { ModelDictEntry } from "./model-dict";

export interface AparenciaStatus {
  activeId: string;
  installed: { id: string; olvtName: string; model3: string; noRecolor: boolean }[];
  licenseAccepted: string[];
}

export interface InstallDone {
  id: string;
  ok: boolean;
  model3?: string;
  model3Json?: Model3Shape;
  reason?: string;
}

export interface CommitInput {
  id: string;
  olvtName: string;
  noRecolor: boolean;
  model3Relative: string;
  gestures: JuGestureMap;
  modelDict: ModelDictEntry;
  persistActive: boolean;
  licenseAccepted: string[];
}

const MOCK_KEY = "junto-aparencia-mock";

function tauriOk(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export class AparenciaBridge {
  static async status(): Promise<AparenciaStatus> {
    if (!tauriOk()) {
      const raw = localStorage.getItem(MOCK_KEY);
      if (raw) return JSON.parse(raw) as AparenciaStatus;
      return { activeId: "mao", installed: [{ id: "mao", olvtName: "mao_pro", model3: "", noRecolor: false }], licenseAccepted: [] };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<AparenciaStatus>("aparencia_status");
  }

  static async readModel3(id: string): Promise<Model3Shape> {
    if (!tauriOk()) {
      return {
        FileReferences: {
          Motions: { Idle: [{ File: "motions/mtn_01.motion3.json" }] },
          Expressions: [{ Name: "exp_01", File: "expressions/exp_01.exp3.json" }],
        },
        Groups: [{ Name: "EyeBlink", Target: "Parameter" }],
      };
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<Model3Shape>("aparencia_read_model3", { id });
  }

  static async install(id: string): Promise<void> {
    if (!tauriOk()) {
      window.dispatchEvent(new CustomEvent("aparencia-progress-mock", { detail: { id, received: 50, total: 100 } }));
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("aparencia-done-mock", {
            detail: {
              id,
              ok: true,
              model3: `live2d-models/${id}/runtime/${id}.model3.json`,
            } satisfies InstallDone,
          }),
        );
      }, 400);
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("aparencia_install", { id });
  }

  static async cancel(): Promise<void> {
    if (!tauriOk()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("aparencia_cancel");
  }

  static async commit(payload: CommitInput): Promise<void> {
    if (!tauriOk()) {
      const st = await AparenciaBridge.status();
      st.activeId = payload.persistActive ? payload.id : st.activeId;
      if (!st.installed.some((i) => i.id === payload.id)) {
        st.installed.push({
          id: payload.id,
          olvtName: payload.olvtName,
          model3: payload.model3Relative,
          noRecolor: payload.noRecolor,
        });
      }
      st.licenseAccepted = [...new Set([...st.licenseAccepted, ...payload.licenseAccepted])];
      localStorage.setItem(MOCK_KEY, JSON.stringify(st));
      return;
    }
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("aparencia_commit", { payload });
  }

  static async preview(payload: CommitInput): Promise<void> {
    if (!tauriOk()) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("aparencia_preview", { payload });
  }

  static listenProgress(
    onProgress: (id: string, received: number, total: number) => void,
    onDone: (ev: InstallDone) => void,
  ): () => void {
    if (!tauriOk()) {
      const p = (e: Event) => {
        const d = (e as CustomEvent).detail as { id: string; received: number; total: number };
        onProgress(d.id, d.received, d.total);
      };
      const d = (e: Event) => onDone((e as CustomEvent).detail as InstallDone);
      window.addEventListener("aparencia-progress-mock", p);
      window.addEventListener("aparencia-done-mock", d);
      return () => {
        window.removeEventListener("aparencia-progress-mock", p);
        window.removeEventListener("aparencia-done-mock", d);
      };
    }
    let unsubs: (() => void)[] = [];
    void import("@tauri-apps/api/event").then(({ listen }) => {
      void listen<{ id: string; received: number; total: number }>(
        "aparencia-progress",
        (ev) => onProgress(ev.payload.id, ev.payload.received, ev.payload.total),
      ).then((u) => unsubs.push(u));
      void listen<InstallDone>("aparencia-done", (ev) => onDone(ev.payload)).then((u) =>
        unsubs.push(u),
      );
    });
    return () => unsubs.forEach((u) => u());
  }
}