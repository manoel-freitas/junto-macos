import "../styles/tokens.css";
import "./shell.css";
import { mountBalloon } from "../ju/balloon";
import { juCssClass, type JuVisualState } from "../ju/state";
import {
  clearAlertTimers,
  escalateToLevel2,
  initialAlertGate,
  type AlertGate,
} from "../ju/alerts";

const OLVT_ORIGIN = "http://127.0.0.1:12393";

const shell = document.querySelector("#ju-shell") as HTMLElement;
const hit = document.querySelector("#ju-body-hit") as HTMLElement;
const balloonHost = document.querySelector("#ju-balloon-host") as HTMLElement;

let alertGate: AlertGate = initialAlertGate();
let dismissBalloon: (() => void) | null = null;
let juVisible = true;
let soundEnabled = false;

function setJuState(state: JuVisualState, level?: number): void {
  shell.className = `ju-shell ${juCssClass(state)}`;
  if (level && level >= 2) shell.classList.add("ju--level-2");
}

async function startDrag(ev: MouseEvent): Promise<void> {
  if (ev.button !== 0) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch {
    /* browser dev */
  }
}

hit.addEventListener("mousedown", (ev) => {
  void startDrag(ev);
});

async function reportHitRegion(): Promise<void> {
  const rect = hit.getBoundingClientRect();
  const w = shell.clientWidth;
  const h = shell.clientHeight;
  const payload = {
    xPct: rect.left / w,
    yPct: rect.top / h,
    wPct: rect.width / w,
    hPct: rect.height / h,
  };
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("ju_hit_region", { region: payload });
  } catch {
    /* stub */
  }
}

function showBalloon(
  text: string,
  opts?: { actions?: { label: string; key?: string; onClick: () => void }[]; ms?: number },
): void {
  dismissBalloon?.();
  dismissBalloon = mountBalloon(balloonHost, {
    text,
    ariaLive: "assertive",
    actions: opts?.actions,
    autoDismissMs: opts?.ms,
  });
}

async function bootstrap(): Promise<void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const { invoke } = await import("@tauri-apps/api/core");

    await listen<{
      juState: JuVisualState;
      balloon?: string;
      alert?: boolean;
      level?: number;
      proactiveInvite?: boolean;
    }>("ju-state", (ev) => {
      const { juState, balloon, alert, level, proactiveInvite } = ev.payload;
      setJuState(juState, level);
      if (balloon && proactiveInvite) {
        showBalloon(balloon, {
          ms: 60_000,
          actions: [
            {
              label: "Começar",
              key: "1",
              onClick: () => void invoke("invite_response", { choice: "start" }),
            },
            {
              label: "Daqui a 15 min",
              key: "2",
              onClick: () => void invoke("invite_response", { choice: "snooze15" }),
            },
            {
              label: "Hoje não",
              key: "3",
              onClick: () => void invoke("invite_response", { choice: "not_today" }),
            },
          ],
        });
      } else if (balloon) {
        showBalloon(balloon, { ms: juState === "pause" ? 10_000 : undefined });
      } else if (!balloon) {
        dismissBalloon?.();
        dismissBalloon = null;
      }
      if (alert) {
        alertGate = clearAlertTimers(alertGate);
        alertGate = {
          ...alertGate,
          level: 1,
          lastAlertAt: Date.now(),
          level2Timer: setTimeout(() => {
            alertGate = escalateToLevel2(alertGate);
            setJuState(juState, 2);
            if (soundEnabled) {
              try {
                const a = new Audio();
                a.src =
                  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
                void a.play();
              } catch {
                /* noop */
              }
            }
          }, 20_000),
        };
      }
    });

    await listen<{ visible: boolean }>("ju-visibility", (ev) => {
      juVisible = ev.payload.visible;
      shell.style.opacity = juVisible ? "1" : "0";
      shell.style.pointerEvents = juVisible ? "auto" : "none";
    });

  await listen("distraction-detected", (ev) => {
      const p = ev.payload as { meta?: string };
      const meta = p.meta ?? "isso";
      showBalloon(`Ainda em ${meta}?`, {
        actions: [
          {
            label: "Voltando",
            onClick: () => {
              void invoke("distraction_response", { choice: "back" });
            },
          },
          {
            label: "É pausa",
            onClick: () => {
              void invoke("distraction_response", { choice: "pause" });
            },
          },
        ],
      });
    });

    void invoke("ju_pet_ready");
    void reportHitRegion();
    new ResizeObserver(() => void reportHitRegion()).observe(shell);
  } catch {
    setJuState("idle");
  }
}

const olvt = document.querySelector("#ju-olvt") as HTMLIFrameElement;
olvt.addEventListener("error", () => {
  setJuState("needs-adjustment");
  showBalloon("Motor de voz ainda carregando…");
});
olvt.src = OLVT_ORIGIN;

void bootstrap();