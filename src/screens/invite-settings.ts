import type { WorkHoursConfig } from "../invites/work-hours";
import { el } from "./util";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function renderInviteSettings(
  root: HTMLElement,
  workHours: WorkHoursConfig,
  autostart: boolean,
  autostartBusy: boolean,
  onWorkHours: (cfg: WorkHoursConfig) => void,
  onAutostart: (on: boolean) => void,
): void {
  root.replaceChildren();
  root.appendChild(el("h2", undefined, "Convites e início"));
  root.appendChild(
    el(
      "p",
      "muted",
      "Ju convida só no horário de trabalho, fora de reunião e tela cheia. Ignorar não é punido.",
    ),
  );

  const autoLabel = document.createElement("label");
  autoLabel.className = "toggle-row";
  const autoInput = document.createElement("input");
  autoInput.type = "checkbox";
  autoInput.checked = autostart;
  autoInput.disabled = autostartBusy;
  autoInput.addEventListener("change", () => onAutostart(autoInput.checked));
  autoLabel.append(autoInput, document.createTextNode(" Abrir Junto ao iniciar sessão (login)"));
  root.appendChild(autoLabel);

  root.appendChild(el("h3", undefined, "Horário de trabalho"));
  const daysRow = document.createElement("div");
  daysRow.className = "btn-row";
  for (let d = 0; d < 7; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = workHours.weekdays.includes(d) ? "btn pri" : "btn";
    btn.textContent = DAY_LABELS[d]!;
    btn.addEventListener("click", () => {
      const set = new Set(workHours.weekdays);
      if (set.has(d)) set.delete(d);
      else set.add(d);
      onWorkHours({
        ...workHours,
        weekdays: [...set].sort((a, b) => a - b),
      });
    });
    daysRow.appendChild(btn);
  }
  root.appendChild(daysRow);

  const hoursRow = document.createElement("div");
  hoursRow.className = "toggle-row";
  const start = document.createElement("input");
  start.type = "number";
  start.min = "0";
  start.max = "23";
  start.value = String(workHours.startHour);
  const end = document.createElement("input");
  end.type = "number";
  end.min = "1";
  end.max = "24";
  end.value = String(workHours.endHour);
  const applyHours = () => {
    onWorkHours({
      ...workHours,
      startHour: Number(start.value),
      endHour: Number(end.value),
    });
  };
  start.addEventListener("change", applyHours);
  end.addEventListener("change", applyHours);
  hoursRow.append(
    document.createTextNode("Das "),
    start,
    document.createTextNode("h às "),
    end,
    document.createTextNode("h"),
  );
  root.appendChild(hoursRow);

  root.appendChild(
    el(
      "p",
      "muted",
      "Modo Foco do macOS: Plan B — quieto por reunião/tela cheia ou ⌥⌘M (silenciar Ju 1h).",
    ),
  );
}