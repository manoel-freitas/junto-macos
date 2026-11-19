# Brief: Junto (macOS menu-bar ADHD focus companion)

Repo: https://github.com/manoel-freitas/junto-macos (public, empty on main).
Product name: **Junto** — personal use only. README MUST note: if ever published, rename (there is already a macOS App Store app named Junto).
Author commits: Manoel Freitas <manoel.josefneto@gmail.com>
Do NOT touch: DevSpace, Coda-ce/devspace, manoel-freitas/tdah-body-double, manoel-freitas/foco-menu-bar.

Visual source of truth already in `design/`: base.css, identidade.html, identidade.png, telas.html, telas.png. Match tokens/layout. A11y notes in HTML footers.

## Stack
- Tauri 2 macOS menu-bar / accessory app (popover only, no open window).
- Open-LLM-VTuber **pinned to tag v1.2.1** (https://github.com/Open-LLM-VTuber/Open-LLM-VTuber). v1 is bugfix-only; do NOT depend on new upstream / v2 features.
- Integration (EXPLAIN in README): git submodule `vendor/Open-LLM-VTuber` @ v1.2.1 + local server as sidecar; talk via HTTP/WebSocket API.
- LLM: Ollama local by default. Document optional OpenRouter.

## System prompt (EXACT in OLVT character overlay)
```
Você é meu parceiro de foco numa chamada de vídeo. Fale em português, frases curtas.
1. Ao começar, pergunte só: "O que você vai terminar agora?" Se a meta for vaga, peça o primeiro passo concreto.
2. Depois fique em silêncio, trabalhando no seu canto. Não puxe assunto.
3. Só responda se eu falar com você, em no máximo 1 frase, e volte ao silêncio.
4. Quando eu disser "acabei", pergunte: "Saiu? Sim, parcial ou não?" e encerre com 1 frase gentil, sem cobrança.
```
Edge TTS pt-BR. Proactive speak OFF. Camera OFF. Screen OFF. Live2D idle blink/breathe (mao_pro or shizuku).

## TOKENS (authoritative)
- Colors: ink #1B1B1F, papel #FBF8F3, junto #2E7D5B, junto-50 #DDEFE5, pausa #E0A030, ajuste #C2410C. Dark mode inverts ink and papel.
- Type: SF Pro (fallback Inter). Body 14px, titles 16px semibold, timer 40px tabular nums.
- Shape: button radius 9px, popover 14px. Spacing multiples of 4. No shadow beyond native popover.
- Icon: two side-by-side dots, monochrome template 16px. Must work at 16px menu bar.
- Voice: short phrases, no exclamation marks, never blaming. Examples: "O que você vai terminar agora?" / "Pausado. Sem pressa." / "Saiu? Sim, parcial ou não?"
- No urgency red for focus nags. Amber only for pause. ajuste #C2410C only for "needs adjustment".

## SHELL
Menu bar only, no window. Everything in a **320px popover**. Avatar appears ONLY on check-in or when summoned; never steals focus (Accessory / LSUIElement; no bring-to-front over VS Code).

## SCREENS (8) — all in 320px popover
Flow (5):
1. Start: "O que você vai terminar agora?", duration chips 25/50/livre, Enter starts. Vague goal → ask first concrete step.
2. Session: goal, timer, progress; Pausar (P), Acabei (A). No notifications until check-in.
3. Mid check-in: "Ainda em X?" Sim(1) Mudei(2) Pausar(3). Auto-dismiss 20s = sim. Wait if meeting or macOS Focus.
4. End: "Saiu?" Sim(1) Parcial(2) Não(3) + 3-line day summary saved only on Mac.
5. Pause: "Pausado. Sem pressa." Timer stops; no streak to lose / no nagging.

System (3) — **none block starting a session**:
6. VTuber or Ollama missing: show what's missing; "Instalar e verificar" or "Usar só texto".
7. Loading model: real progress, "Começar mesmo assim". >2 min → error + "tentar de novo".
8. Mic denied: open System Settings or continue on keyboard.

Icon states: outline idle (○○); green+time in session (●●); pulse/blink on check-in; amber paused (●○); orange when needs adjustment (●!). Color never the only cue.

Exactly **3 check-ins per session**: start goal, one mid (default 25 min, configurable via duration), end. Pausing must NOT nag/scold.

## A11Y + PRIVACY
Full keyboard; VoiceOver reads goal+time; AA contrast; targets ≥24px; respect Reduce Motion; read ONLY active app name (NSWorkspace/Accessibility), **no screen capture**. Document Accessibility permission. Respect macOS Focus + meeting apps when feasible; document limitations.

## Deliverables
1. Scaffold Tauri 2 menu-bar app matching design tokens and the 8 screens (HTML/CSS/TS frontend in popover).
2. Sidecar scripts for OLVT @ v1.2.1; overlay with exact prompt + PT voice + flags off.
3. Active-app name reader + local session log (JSON/SQLite under Application Support).
4. README pt-BR: architecture choice for OLVT, pin v1.2.1, rename-if-published note, prerequisites (Xcode CLT, Rust, Node, Ollama, uv/Python), how to run on Mac, Focus/meeting limits, privacy, OpenRouter optional, avatar focus policy, 3 check-ins, UI states, permissions.
5. `scripts/dev.sh` + npm/`cargo tauri dev` docs.
6. `.gitignore`, MIT LICENSE, package metadata.
7. Keep `design/` assets in repo.

## Out of scope
Production notarization beyond local `tauri dev`; public deploy; paid avatars; Windows/Linux; Trello; any change to tdah-body-double.

## Process for this agent
Write full scaffold + docs in this empty repo. Prefer valid Tauri project files even if we cannot compile macOS binaries on this Linux box. Add submodule pin for OLVT v1.2.1. Commit on main as Manoel Freitas <manoel.josefneto@gmail.com>. Push origin main.


## PIVOT (obrigatório)
Ver [PIVOT.md](PIVOT.md) — substitui avatar-on-checkin e sensor só-por-app-name. Ju pet sempre visível; distração via Apple Events opcional; bem-estar nas bordas.
