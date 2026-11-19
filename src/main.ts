import "./styles/popover.css";
import {
  anotherSession,
  finishPreBreath,
  finishSession,
  initialSessionState,
  midResponse,
  midTimeout,
  pauseSession,
  recordBlockComplete,
  remainingMs,
  resumeSession,
  setDuration,
  setEngineFlags,
  setOutcome,
  setPreBreathPending,
  submitGoal,
  skipPreBreath,
  tick,
  useTextOnly,
  type SessionState,
} from "./session/machine";
import { daySummaryLines, type SessionRecord } from "./session/summary";
import { renderEnd } from "./screens/end";
import { renderLoading } from "./screens/loading";
import { renderMic } from "./screens/mic";
import { renderMid } from "./screens/mid";
import { renderMissing, type MissingStatus } from "./screens/missing";
import { renderPaused } from "./screens/paused";
import { renderSession } from "./screens/session";
import { renderStart } from "./screens/start";
import { formatMs } from "./screens/util";
import { iconStateFromSession, trayTitleForIcon } from "./ui/iconState";
import { juStateFromSession } from "./ju/state";
import {
  canFireAlert,
  beginAlert,
  clearAlertTimers,
  initialAlertGate,
  type AlertGate,
} from "./ju/alerts";
import { DISTRACTION_CATEGORIES } from "./automation/domains";
import { renderDistractionSettings } from "./screens/distraction";
import { renderWellnessSettings } from "./screens/wellness";
import {
  cueBeforeStart,
  cuesAfterBlock,
  wellnessBalloonText,
} from "./wellness/scheduler";
import {
  DEFAULT_WELLNESS,
  loadWellnessToggles,
  type WellnessToggles,
} from "./wellness/toggles";

const MID_TIMEOUT_MS = 20_000;
const LOAD_TIMEOUT_MS = 120_000;

let state: SessionState = initialSessionState();
let goalInput: HTMLInputElement | null = null;
let midTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let loadStartedAt: number | null = null;
const sessionLog: SessionRecord[] = [];
let presence = { meeting: false, focus: false, activeApp: "" };
let engineStatus: MissingStatus = { juntoOk: true, olvtOk: false, ollamaOk: false };
let loadPercent = 0;
let loadError: string | null = null;
let alertGate: AlertGate = initialAlertGate();
let juCalling = false;
let settingsView: null | "distraction" | "wellness" = null;
let distractionEnabled = false;
let distractionCategories = new Set(
  DISTRACTION_CATEGORIES.map((c) => c.id),
);
let distractionWarn: string | undefined;
let wellness: WellnessToggles = { ...DEFAULT_WELLNESS };

const root = document.querySelector("#root") as HTMLElement;
const stripHost = document.createElement("div");
stripHost.className = "strip-host";
root.before(stripHost);

const settingsHost = document.createElement("div");
settingsHost.className = "settings-host";
root.after(settingsHost);

function notifyRust(payload: Record<string, unknown>): void {
  const g = globalThis as typeof globalThis & {
    __TAURI__?: { core?: { invoke: (c: string, a?: unknown) => Promise<unknown> } };
  };
  const invoke = g.__TAURI__?.core?.invoke;
  if (invoke) {
    void invoke("junto_sync", payload).catch(() => undefined);
  }
}

function juBalloonForPhase(s: SessionState): string | undefined {
  if (s.phase === "paused") return "Pausado. Sem pressa.";
  if (s.phase === "mid") return `Ainda em ${s.goal}?`;
  if (s.phase === "pre_breath") return wellnessBalloonText({ kind: "breath", minutes: 1 });
  return undefined;
}

function syncJu(s: SessionState, opts?: { alert?: boolean }): void {
  const juState = juStateFromSession(s, { juCalling });
  notifyRust({
    juState,
    juBalloon: juBalloonForPhase(s),
    juAlert: opts?.alert ?? false,
    distractionEnabled,
  });
}

function syncTray(s: SessionState): void {
  const icon = iconStateFromSession(s);
  const rem = remainingMs(s);
  const label = rem !== null ? formatMs(rem) : "";
  notifyRust({
    iconState: icon,
    trayTitle: trayTitleForIcon(icon, label),
    phase: s.phase,
    juState: juStateFromSession(s, { juCalling }),
  });
  syncJu(s);
}

function clearMidTimer(): void {
  if (midTimer) {
    clearTimeout(midTimer);
    midTimer = null;
  }
}

function scheduleMidTimeout(): void {
  clearMidTimer();
  midTimer = setTimeout(() => {
    state = midTimeout(state);
    render();
    syncTray(state);
  }, MID_TIMEOUT_MS);
}

function fireMidAlert(): void {
  if (!canFireAlert(alertGate)) return;
  alertGate = beginAlert(alertGate);
  juCalling = true;
  syncJu(state, { alert: true });
}

function clearJuCalling(): void {
  juCalling = false;
  alertGate = clearAlertTimers(alertGate);
  syncJu(state);
}

function startTick(): void {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    if (state.phase === "session") {
      state = tick(state, {
        deltaMs: 1000,
        meeting: presence.meeting,
        focus: presence.focus,
      });
      if (state.phase === "mid") {
        scheduleMidTimeout();
        fireMidAlert();
      }
      render();
      syncTray(state);
    }
  }, 1000);
}

function stopTick(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function systemStrip(): void {
  stripHost.replaceChildren();
  const parts: HTMLElement[] = [];
  if (state.engineMissing) {
    const d = document.createElement("div");
    d.className = "strip";
    renderMissing(d, engineStatus, () => notifyRust({ action: "install_check" }), () => {
      state = useTextOnly(state);
      render();
    });
    parts.push(d);
  } else if (state.engineLoading) {
    const d = document.createElement("div");
    d.className = "strip";
    renderLoading(
      d,
      loadPercent,
      loadError ? loadError : `Carregando modelo local · ${loadPercent}%`,
      () => {
        state = { ...state, engineLoading: false, textOnly: true };
        render();
      },
      loadError,
      () => {
        loadError = null;
        loadStartedAt = Date.now();
        notifyRust({ action: "olvt_restart" });
        render();
      },
    );
    parts.push(d);
  } else if (state.micDenied) {
    const d = document.createElement("div");
    d.className = "strip";
    renderMic(
      d,
      () => notifyRust({ action: "open_mic_settings" }),
      () => {
        state = { ...state, micDenied: false, textOnly: true };
        render();
      },
    );
    parts.push(d);
  }
  for (const p of parts) stripHost.appendChild(p);
}

function renderSettingsPanel(): void {
  settingsHost.replaceChildren();
  if (!settingsView) return;
  const panel = document.createElement("div");
  panel.className = "popover-root";
  if (settingsView === "distraction") {
    renderDistractionSettings(
      panel,
      {
        enabled: distractionEnabled,
        categories: distractionCategories,
        permissionWarn: distractionWarn,
      },
      (on) => {
        distractionEnabled = on;
        notifyRust({ distractionEnabled: on });
        renderSettingsPanel();
      },
      (id) => {
        if (distractionCategories.has(id)) distractionCategories.delete(id);
        else distractionCategories.add(id);
        renderSettingsPanel();
      },
      () => notifyRust({ action: "open_automation_settings" }),
    );
  } else {
    renderWellnessSettings(panel, wellness, (key, value) => {
      wellness = { ...wellness, [key]: value };
      state = setPreBreathPending(state, cueBeforeStart(wellness) !== null);
      renderSettingsPanel();
    });
  }
  settingsHost.appendChild(panel);
}

function render(): void {
  systemStrip();
  clearMidTimer();
  renderSettingsPanel();

  if (state.phase === "start") {
    goalInput = renderStart(root, state, {
      onSubmit: (g) => {
        state = setPreBreathPending(
          state,
          cueBeforeStart(wellness) !== null,
        );
        state = submitGoal(state, g);
        if (state.phase === "session") startTick();
        render();
        syncTray(state);
      },
      onDuration: (d) => {
        state = setDuration(state, d);
        render();
      },
    });
    goalInput.focus();
  } else if (state.phase === "pre_breath") {
    root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = "Respiração de 1 minuto (opcional).";
    const row = document.createElement("div");
    row.className = "btn-row";
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn pri";
    go.textContent = "Pronto";
    go.addEventListener("click", () => {
      state = finishPreBreath(state);
      startTick();
      render();
      syncTray(state);
    });
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "btn";
    skip.textContent = "Pular";
    skip.addEventListener("click", () => {
      state = skipPreBreath(state);
      startTick();
      render();
      syncTray(state);
    });
    row.append(go, skip);
    root.append(p, row);
    syncJu(state, { alert: true });
  } else if (state.phase === "session") {
    renderSession(
      root,
      state,
      () => {
        state = pauseSession(state);
        stopTick();
        render();
        syncTray(state);
      },
      () => {
        state = finishSession(state);
        stopTick();
        render();
        syncTray(state);
      },
    );
  } else if (state.phase === "mid") {
    scheduleMidTimeout();
    fireMidAlert();
    renderMid(
      root,
      state,
      () => {
        state = midResponse(state, "sim");
        clearJuCalling();
        render();
        syncTray(state);
      },
      () => {
        state = midResponse(state, "mudei");
        clearJuCalling();
        stopTick();
        render();
        syncTray(state);
      },
      () => {
        state = midResponse(state, "pausar");
        clearJuCalling();
        stopTick();
        render();
        syncTray(state);
      },
    );
  } else if (state.phase === "paused") {
    renderPaused(
      root,
      state,
      () => {
        state = resumeSession(state);
        startTick();
        render();
        syncTray(state);
      },
      () => {
        state = finishSession(state);
        render();
        syncTray(state);
      },
    );
  } else if (state.phase === "end") {
    const today = new Date().toLocaleDateString("pt-BR");
    const lines = daySummaryLines(sessionLog, today);
    renderEnd(
      root,
      today,
      lines,
      (o) => {
        state = setOutcome(state, o);
        state = recordBlockComplete(state);
        const cues = cuesAfterBlock(state.blocksCompleted, wellness);
        sessionLog.push({
          goal: state.goal,
          durationLabel: state.duration,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          focusMs: state.elapsedMs,
          outcome: o,
          activeApp: presence.activeApp,
        });
        notifyRust({ action: "save_session", record: sessionLog[sessionLog.length - 1] });
        if (cues.length && canFireAlert(alertGate)) {
          alertGate = beginAlert(alertGate);
          notifyRust({
            juState: "calling",
            juBalloon: wellnessBalloonText(cues[0]!),
            juAlert: true,
          });
        }
        render();
      },
      () => {
        state = anotherSession(state);
        render();
        syncTray(state);
      },
    );
  }
}

function onKeyDown(ev: KeyboardEvent): void {
  if (ev.altKey && ev.key === "d") {
    settingsView = settingsView === "distraction" ? null : "distraction";
    render();
    return;
  }
  if (ev.altKey && ev.key === "b") {
    settingsView = settingsView === "wellness" ? null : "wellness";
    render();
    return;
  }
  if (state.phase === "start" && ev.key === "Enter") {
    const g = goalInput?.value ?? state.goal;
    state = setPreBreathPending(state, cueBeforeStart(wellness) !== null);
    state = submitGoal(state, g);
    if (state.phase === "session") startTick();
    render();
    syncTray(state);
    ev.preventDefault();
    return;
  }
  if (state.phase === "session") {
    if (ev.key === "p" || ev.key === "P") {
      state = pauseSession(state);
      stopTick();
      render();
      syncTray(state);
    } else if (ev.key === "a" || ev.key === "A") {
      state = finishSession(state);
      stopTick();
      render();
      syncTray(state);
    }
  } else if (state.phase === "mid") {
    if (ev.key === "1") {
      state = midResponse(state, "sim");
      clearJuCalling();
      render();
      syncTray(state);
    } else if (ev.key === "2") {
      state = midResponse(state, "mudei");
      clearJuCalling();
      stopTick();
      render();
      syncTray(state);
    } else if (ev.key === "3") {
      state = midResponse(state, "pausar");
      clearJuCalling();
      stopTick();
      render();
      syncTray(state);
    }
  } else if (state.phase === "paused" && (ev.key === "r" || ev.key === "R")) {
    state = resumeSession(state);
    startTick();
    render();
    syncTray(state);
  } else if (state.phase === "end") {
    if (ev.key === "1") {
      state = setOutcome(state, "sim");
      render();
    } else if (ev.key === "2") {
      state = setOutcome(state, "parcial");
      render();
    } else if (ev.key === "3") {
      state = setOutcome(state, "nao");
      render();
    }
  }
}

document.addEventListener("keydown", onKeyDown);

export function __applyEngineEvent(ev: {
  olvt?: boolean;
  ollama?: boolean;
  loading?: boolean;
  loadPercent?: number;
  micDenied?: boolean;
}): void {
  if (ev.olvt !== undefined) engineStatus.olvtOk = ev.olvt;
  if (ev.ollama !== undefined) engineStatus.ollamaOk = ev.ollama;
  engineStatus.juntoOk = true;
  const missing = !engineStatus.olvtOk || !engineStatus.ollamaOk;
  if (ev.loading) {
    loadStartedAt = loadStartedAt ?? Date.now();
    loadPercent = ev.loadPercent ?? loadPercent;
    if (loadStartedAt && Date.now() - loadStartedAt > LOAD_TIMEOUT_MS) {
      loadError = "Passou de 2 minutos. Tente de novo.";
      state = setEngineFlags(state, { engineLoading: false, engineMissing: true });
    } else {
      state = setEngineFlags(state, { engineLoading: true, engineMissing: false });
    }
  } else if (missing) {
    state = setEngineFlags(state, { engineMissing: true, engineLoading: false });
  } else {
    loadStartedAt = null;
    loadError = null;
    state = setEngineFlags(state, { engineMissing: false, engineLoading: false });
  }
  if (ev.micDenied !== undefined) {
    state = setEngineFlags(state, { micDenied: ev.micDenied });
  }
  render();
  syncTray(state);
}

export function __applyPresence(ev: {
  meeting: boolean;
  focus: boolean;
  activeApp: string;
}): void {
  presence = ev;
}

export function __applyDistraction(ev: { choice: string }): void {
  if (ev.choice === "pause") {
    state = pauseSession(state);
    stopTick();
    render();
    syncTray(state);
  }
  clearJuCalling();
}

async function bootstrapTauri(): Promise<void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const { invoke } = await import("@tauri-apps/api/core");
    await listen<typeof presence>("junto-presence", (ev) => {
      __applyPresence(ev.payload);
    });
    await listen<{
      olvt?: boolean;
      ollama?: boolean;
      loading?: boolean;
      loadPercent?: number;
    }>("junto-engine", (ev) => {
      __applyEngineEvent({
        olvt: ev.payload.olvt,
        ollama: ev.payload.ollama,
        loading: ev.payload.loading,
        loadPercent: ev.payload.loadPercent,
      });
    });
    await listen<{ distraction?: string }>("ju-action", (ev) => {
      if (ev.payload.distraction) {
        __applyDistraction({ choice: ev.payload.distraction });
      }
    });
    await listen<{ message?: string }>("automation-permission", (ev) => {
      distractionWarn = ev.payload.message;
      render();
    });
    const prefs = (await invoke("get_pet_prefs")) as {
      distractionEnabled?: boolean;
    };
    distractionEnabled = prefs.distractionEnabled ?? false;
    wellness = loadWellnessToggles(null);
    const engine = (await invoke("engine_status")) as {
      olvt: boolean;
      ollama: boolean;
    };
    __applyEngineEvent({
      olvt: engine.olvt,
      ollama: engine.ollama,
      loading: !engine.olvt,
      loadPercent: engine.olvt ? 100 : 20,
    });
  } catch {
    state = setEngineFlags(state, { engineMissing: true, engineLoading: false });
    engineStatus = { juntoOk: true, olvtOk: false, ollamaOk: false };
    render();
    syncTray(state);
  }
}

void bootstrapTauri();
render();
syncTray(state);