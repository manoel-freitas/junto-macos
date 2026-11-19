import "../styles/aparencia.css";
import { AparenciaBridge, type InstallDone } from "./bridge";
import { Catalog } from "./catalog";
import { GestureMap, type Model3Shape } from "./gestures";
import { AparenciaMachine, type AparenciaMachineState } from "./machine";
import { ModelDictUpdate } from "./model-dict";
import { AparenciaScreen } from "../screens/aparencia";
import type { FilterKind } from "./catalog";
import { UseInstalled } from "./use-installed";
import { applyAparenciaDemoEstado, parseDemoEstado } from "./demo-state";

const root = document.querySelector("#root") as HTMLElement;

let machine = AparenciaMachine.initial();
let installedIds = new Set<string>(["mao"]);
let licenseAccepted = new Set<string>();
let selectedModel3: Model3Shape | null = null;
let imagesLoaded = false;
let unlisten: (() => void) | null = null;
const demoEstado = parseDemoEstado(location.search);

async function refreshModel3(id: string): Promise<void> {
  if (!installedIds.has(id)) {
    selectedModel3 = null;
    return;
  }
  try {
    selectedModel3 = await AparenciaBridge.readModel3(id);
  } catch {
    selectedModel3 = null;
  }
}

function render(): void {
  AparenciaScreen.render(root, {
    state: machine,
    installedIds,
    licenseAccepted,
    selectedModel3,
    imagesLoaded,
    onSelect: (id) => {
      void (async () => {
        machine = AparenciaMachine.select(machine, id);
        await refreshModel3(id);
        render();
      })();
    },
    onFilter: (f: FilterKind) => {
      machine = AparenciaMachine.setFilter(machine, f);
      render();
    },
    onQuery: (q) => {
      machine = AparenciaMachine.setQuery(machine, q);
      render();
    },
    onUse: () => void handleUse(),
    onTest: () => void handleTest(),
    onCancel: () => void handleCancel(),
    onRetry: () => void handleRetry(),
    onAcceptLicense: () => void handleAcceptLicense(),
    onShowReason: () => {
      if (machine.failReason) alert(machine.failReason);
    },
  });
}

async function buildCommit(id: string, model3Rel: string, model3: Model3Shape, persist: boolean) {
  const entry = Catalog.getById(id)!;
  const gestures = GestureMap.fromModel3(model3);
  const publicUrl = model3Rel.startsWith("live2d-models")
    ? `/live2d-models/${model3Rel.split("live2d-models/")[1] ?? model3Rel}`
    : `/${model3Rel}`;
  const modelDict = ModelDictUpdate.buildEntry(entry, publicUrl, model3, gestures);
  await AparenciaBridge.commit({
    id,
    olvtName: entry.olvtName,
    noRecolor: entry.noRecolor,
    model3Relative: model3Rel,
    gestures,
    modelDict,
    persistActive: persist,
    licenseAccepted: [...licenseAccepted],
  });
}

async function handleUse(): Promise<void> {
  const id = machine.selectedId;
  const entry = Catalog.getById(id)!;
  const needsLicense = entry.otherLicense && !licenseAccepted.has(id);
  if (!UseInstalled.shouldDownloadBeforeUse(entry, installedIds)) {
    /* cai no commit abaixo */
  } else if (!installedIds.has(id)) {
    if (needsLicense) {
      machine = AparenciaMachine.needLicense(machine, id);
      render();
      return;
    }
    machine = AparenciaMachine.beginDownload(machine, id);
    render();
    await AparenciaBridge.install(id);
    return;
  }
  const model3 = await AparenciaBridge.readModel3(id);
  const st = await AparenciaBridge.status();
  const row = st.installed.find((i) => i.id === id);
  const rel = row?.model3 ?? `live2d-models/${entry.olvtName}/runtime/${entry.olvtName}.model3.json`;
  try {
    await buildCommit(id, rel, model3, true);
    machine = AparenciaMachine.committed(machine, id, true);
    machine = { ...machine, activeId: id };
    render();
  } catch (e) {
    machine = AparenciaMachine.fail(machine, entry.displayName, String(e));
    render();
  }
}

async function afterInstall(done: InstallDone): Promise<void> {
  const entry = Catalog.getById(done.id)!;
  if (!done.ok) {
    machine = AparenciaMachine.fail(
      machine,
      entry.displayName,
      done.reason ?? "erro desconhecido",
    );
    render();
    return;
  }
  installedIds.add(done.id);
  const model3 =
    done.model3Json ?? (await AparenciaBridge.readModel3(done.id));
  selectedModel3 = model3;
  const rel = done.model3 ?? "";
  try {
    await buildCommit(done.id, rel, model3, true);
    machine = AparenciaMachine.committed(machine, done.id, true);
  } catch (e) {
    machine = AparenciaMachine.fail(machine, entry.displayName, String(e));
  }
  render();
}

async function handleTest(): Promise<void> {
  const id = machine.selectedId;
  if (!installedIds.has(id)) return;
  const entry = Catalog.getById(id)!;
  const model3 = await AparenciaBridge.readModel3(id);
  const st = await AparenciaBridge.status();
  const row = st.installed.find((i) => i.id === id);
  const rel = row?.model3 ?? "";
  const gestures = GestureMap.fromModel3(model3);
  const publicUrl = rel.startsWith("live2d-models") ? `/${rel}` : rel;
  const modelDict = ModelDictUpdate.buildEntry(entry, publicUrl, model3, gestures);
  try {
    await AparenciaBridge.preview({
      id,
      olvtName: entry.olvtName,
      noRecolor: entry.noRecolor,
      model3Relative: rel,
      gestures,
      modelDict,
      persistActive: false,
      licenseAccepted: [...licenseAccepted],
    });
  } catch (e) {
    machine = AparenciaMachine.fail(machine, entry.displayName, String(e));
    render();
  }
}

function handleCancel(): void {
  void AparenciaBridge.cancel();
  machine = AparenciaMachine.cancel(machine);
  render();
}

function handleRetry(): void {
  machine = AparenciaMachine.retry(
    machine,
    true,
    licenseAccepted.has(machine.downloadId ?? machine.selectedId),
  );
  render();
  if (machine.phase === "baixando") {
    void AparenciaBridge.install(machine.downloadId!);
  }
}

function handleAcceptLicense(): void {
  const id = machine.downloadId ?? machine.selectedId;
  licenseAccepted.add(id);
  machine = AparenciaMachine.beginDownload(machine, id);
  render();
  void AparenciaBridge.install(id);
}

async function boot(): Promise<void> {
  if (demoEstado) {
    const applied = applyAparenciaDemoEstado(demoEstado, machine);
    machine = applied.machine;
    imagesLoaded = applied.imagesLoaded;
  }

  const st = await AparenciaBridge.status();
  if (!demoEstado) {
    machine = { ...machine, activeId: st.activeId, selectedId: st.activeId };
  } else if (demoEstado === "carregando") {
    machine = { ...machine, activeId: st.activeId, selectedId: st.activeId };
  }
  installedIds = new Set(st.installed.map((i) => i.id));
  if (!installedIds.has("mao") && installedIds.size === 0) installedIds.add("mao");
  licenseAccepted = new Set(st.licenseAccepted);
  await refreshModel3(machine.selectedId);

  if (demoEstado) {
    render();
    return;
  }

  imagesLoaded = true;
  machine = AparenciaMachine.imagesReady(machine);

  unlisten = AparenciaBridge.listenProgress(
    (id, received, total) => {
      if (machine.downloadId === id) {
        machine = AparenciaMachine.progress(machine, received, total);
        render();
      }
    },
    (done) => void afterInstall(done),
  );

  render();
}

void boot();