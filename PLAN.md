# Plano de implementação do Junto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o companion macOS de menu bar Junto, uso pessoal, com popover de 320px, exatamente 3 check-ins, e o motor Open-LLM-VTuber preso em v1.2.1.

**Architecture:** O app Tauri 2 é só a casca (ícone, popover, sessão, log). O avatar e a voz vivem num processo à parte: o checkout pinado de Open-LLM-VTuber, subido por script e falado por HTTP/WebSocket. A máquina de sessão é TypeScript puro e testável no Linux; NSWorkspace e o painel que não rouba foco só compilam de verdade no Mac.

**Tech Stack:** Tauri 2, TypeScript, Vite, Vitest, Rust (`ActivationPolicy::Accessory`), Open-LLM-VTuber v1.2.1 (`3afa41014b4548a0842e9ee2f576f4b164b48886`), Ollama local, Edge TTS `pt-BR-FranciscaNeural`, Live2D `mao_pro`.

## Restrições globais

- Fonte da verdade: [BRIEF.md](BRIEF.md). Visual: [design/base.css](design/base.css), [design/telas.html](design/telas.html), [design/identidade.html](design/identidade.html). Não editar `design/` nem o BRIEF.
- SHA obrigatório: `3afa41014b4548a0842e9ee2f576f4b164b48886` (tag `v1.2.1`). v1 é só bugfix. Não usar API de v2.
- Prompt de sistema, byte a byte, no overlay do personagem:

```
Você é meu parceiro de foco numa chamada de vídeo. Fale em português, frases curtas.
1. Ao começar, pergunte só: "O que você vai terminar agora?" Se a meta for vaga, peça o primeiro passo concreto.
2. Depois fique em silêncio, trabalhando no seu canto. Não puxe assunto.
3. Só responda se eu falar com você, em no máximo 1 frase, e volte ao silêncio.
4. Quando eu disser "acabei", pergunte: "Saiu? Sim, parcial ou não?" e encerre com 1 frase gentil, sem cobrança.
```

- Voz: Edge TTS, voz `pt-BR-FranciscaNeural`. Fala proativa desligada. Câmera desligada. Tela desligada. Live2D ocioso (`mao_pro`; `shizuku` fica documentado como troca do mesmo campo).
- Popover 320px. Accessory + `LSUIElement`. Avatar só no check-in do meio ou sob demanda. Check-in automático não vira key window.
- Exatamente 3 check-ins: início, um meio, fim. Pausa mostra só `Pausado. Sem pressa.` O timer para. Não existe sequência nem bronca.
- Estados de sistema (telas 6–8) não bloqueiam Começar.
- Leitor grava e expõe só o nome localizado do app ativo. Log só no Mac.
- Commits: `git -c user.name="Manoel Freitas" -c user.email="manoel.josefneto@gmail.com"` (não alterar `git config`). Push `origin main`. Não tocar DevSpace, `tdah-body-double`, `foco-menu-bar`.
- Fora de escopo: notarização, Windows/Linux como produto, Trello, avatares pagos. Neste Linux, `npm test` é a verificação; `tauri dev` fica para o Mac.

## Por que submodule + sidecar

O pin é o gitlink do submodule em `vendor/Open-LLM-VTuber`, sem `branch` em `.gitmodules`, no SHA acima. `git submodule status` mostra o commit. O processo sobe com `uv` como o upstream espera e o Junto só usa a API HTTP/WebSocket (porta lida do `conf` desse pin; o default histórico é `127.0.0.1:12393`). O overlay mora fora do submodule, em `overlay/olvt/`, para o checkout upstream não ficar sujo. Não empacotar o Python como `externalBin`: neste tag o runner é `uv run`.

## Árvore a criar

- [package.json](package.json), [vite.config.ts](vite.config.ts), [tsconfig.json](tsconfig.json), [index.html](index.html)
- [src/main.ts](src/main.ts), [src/styles/tokens.css](src/styles/tokens.css), [src/styles/popover.css](src/styles/popover.css)
- [src/session/machine.ts](src/session/machine.ts), [src/session/summary.ts](src/session/summary.ts), [src/session/machine.test.ts](src/session/machine.test.ts)
- [src/screens/start.ts](src/screens/start.ts), [src/screens/session.ts](src/screens/session.ts), [src/screens/mid.ts](src/screens/mid.ts), [src/screens/end.ts](src/screens/end.ts), [src/screens/paused.ts](src/screens/paused.ts), [src/screens/missing.ts](src/screens/missing.ts), [src/screens/loading.ts](src/screens/loading.ts), [src/screens/mic.ts](src/screens/mic.ts), [src/ui/iconState.ts](src/ui/iconState.ts)
- [src-tauri/Cargo.toml](src-tauri/Cargo.toml), [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json), [src-tauri/Info.plist](src-tauri/Info.plist), [src-tauri/capabilities/default.json](src-tauri/capabilities/default.json)
- [src-tauri/src/lib.rs](src-tauri/src/lib.rs), [src-tauri/src/panel.rs](src-tauri/src/panel.rs), [src-tauri/src/tray.rs](src-tauri/src/tray.rs), [src-tauri/src/presence.rs](src-tauri/src/presence.rs), [src-tauri/src/logstore.rs](src-tauri/src/logstore.rs), [src-tauri/src/sidecar.rs](src-tauri/src/sidecar.rs)
- [src-tauri/icons/tray/](src-tauri/icons/tray/) — SVG + PNG 32px: idle template, sessão, pulso, pausa, ajuste
- [overlay/olvt/junto.yaml](overlay/olvt/junto.yaml), [scripts/olvt.sh](scripts/olvt.sh), [scripts/dev.sh](scripts/dev.sh)
- [vendor/Open-LLM-VTuber](vendor/Open-LLM-VTuber) — submodule
- [.gitignore](.gitignore), [LICENSE](LICENSE), [README.md](README.md)
- Manter [design/](design/) e [BRIEF.md](BRIEF.md)

Contrato da sessão (os testes e as telas usam estes nomes):

```ts
export type DurationChoice = "25" | "50" | "livre";
export type Phase = "start" | "session" | "mid" | "paused" | "end";
export type Outcome = "sim" | "parcial" | "nao";
export interface SessionState {
  phase: Phase;
  goal: string;
  duration: DurationChoice;
  elapsedMs: number;
  midFired: boolean;
  midDeferred: boolean;
  askConcreteStep: boolean;
  outcome: Outcome | null;
  textOnly: boolean;
  summonAvatar: boolean;
  engineMissing: boolean;
  engineLoading: boolean;
  micDenied: boolean;
}
```

`midAtMs`: 25 → 750000, 50 → 1500000, livre → 1500000. Meta vaga = menos de 3 palavras, ou uma destas sozinhas: trabalhar, estudar, focar, foco, coisas, tarefas, email, emails. Pergunta na tela: `Qual é o primeiro passo concreto?`

## Passos

### 1. Pin do Open-LLM-VTuber

- [ ] `git submodule add https://github.com/Open-LLM-VTuber/Open-LLM-VTuber.git vendor/Open-LLM-VTuber` e em seguida `git -C vendor/Open-LLM-VTuber checkout 3afa41014b4548a0842e9ee2f576f4b164b48886`.
- [ ] Tirar qualquer `branch =` de `.gitmodules`. O gitlink é o pin.
- [ ] Confirmar `git -C vendor/Open-LLM-VTuber rev-parse HEAD` igual ao SHA. Não commitar alteração dentro do submodule.
- [ ] No README (passo 8), explicar em pt-BR: o gitlink reproduz v1.2.1; o sidecar é o processo `uv` porque a fronteira suportada é HTTP/WebSocket; o overlay fica fora do vendor.

### 2. Shell: menu bar, 320px, sem roubar foco

Arquivos: `src-tauri/tauri.conf.json` (`productName` Junto, identifier `com.manoelfreitas.junto`, janela `popover` 320×420, `visible: false`, `decorations: false`, `resizable: false`, `transparent: true`, `shadow: true`, `skipTaskbar: true`), `src-tauri/Info.plist` com `LSUIElement` true, `src-tauri/src/lib.rs`, `panel.rs`, `tray.rs`.

- [ ] No setup, `app.set_activation_policy(Accessory)` em `target_os = "macos"`. Ligar o plist no campo `bundle.macOS` que o schema do Tauri 2 deste CLI aceitar.
- [ ] `panel.rs`: popover como NSPanel nonactivating (`becomesKeyOnlyIfNeeded`). Check-in automático chama mostrar sem ativar o app. Clique no ícone da barra é o único caminho que torna o painel key, para o teclado.
- [ ] Não registrar atalhos globais `1`/`2`/`3` (isso comeria teclas no editor). Com o painel key: Enter começa; P pausa; A acabei; 1/2/3 respondem; R retoma; V mostra o avatar; Escape esconde o avatar.
- [ ] Ícone 16pt, dois pontos lado a lado. Idle é template monocromático. Nos outros estados, PNG colorido mais texto na barra, porque cor sozinha não basta:
  - ○○ idle, título vazio
  - ●● `junto` #2E7D5B + tempo `m:ss`
  - check-in: um pulso; com Reduzir movimento, estático
  - ●○ `pausa` #E0A030 + título `pausa`
  - ●! `ajuste` #C2410C + título `!`

### 3. Três check-ins e a pausa

Arquivos: `src/session/machine.ts`, `src/session/machine.test.ts`. Vitest. Escrever o teste, vê-lo falhar, implementar, vê-lo passar.

- [ ] Início: fase `start`. Enter com meta concreta vai para `session` (`midFired` false). Meta vaga liga `askConcreteStep` e fica em `start`. Isso é o check-in 1.
- [ ] Meio: um único `tick` em que `elapsedMs >= midAtMs` e `midFired` é false. Se `meeting` ou `focus` no evento, fica `midDeferred` em `session`. Quando os dois são false, abre `mid` uma vez. `midFired = true` impede outro. Timeout de 20s = resposta `sim`. `mudei` pede o passo concreto e volta ao silêncio sem novo check-in. `pausar` vai para `paused`.
- [ ] Fim: `acabei`, ou o timer de 25/50 chegou a zero. `livre` só termina com Acabei ou Encerrar. Uma fase `end`, uma vez.
- [ ] Pausa: fase `paused`, `elapsedMs` congelado, texto fixo `Pausado. Sem pressa.` Retomar volta para `session`. Não há campo de sequência, notificação nem frase de culpa.
- [ ] Avatar: visível só com fase `mid`, ou `summonAvatar` (tecla V na sessão). Início, sessão, pausa, fim e telas de sistema não desenham avatar.

### 4. Oito telas, tokens, estados de ícone

Tokens em `src/styles/tokens.css` (não importar o CSS da página de wireframe, que é um board de 1400px):

- `--ink:#1B1B1F` `--papel:#FBF8F3` `--junto:#2E7D5B` `--junto-50:#DDEFE5` `--pausa:#E0A030` `--ajuste:#C2410C`
- Dark mode troca só ink e papel.
- Fonte: `-apple-system, "SF Pro", Inter`. Corpo 14px, título 16px semibold, timer 40px `font-variant-numeric: tabular-nums`.
- Botão raio 9px, popover 14px, espaço múltiplo de 4, sem `box-shadow` (sombra é a da janela nativa).
- Alvos com mínimo 24px. Contraste do texto ink/papel. `prefers-reduced-motion` corta o pulso. `aria-live` na meta e no tempo.

Telas, cada uma num arquivo, dentro dos 320px, cópia do wireframe:

1. `start.ts` — `O que você vai terminar agora?`, chips 25 / 50 / livre (25 ligado), `Começar`.
2. `session.ts` — meta, timer, barra, `Pausar` (P), `Acabei` (A). Sem notificação até o check-in. Linha `Check-in em …`.
3. `mid.ts` — avatar, `Ainda em {meta}?`, Sim (1) Mudei (2) Pausar (3), some em 20s = sim.
4. `end.ts` — `Saiu?` Sim (1) Parcial (2) Não (3), resumo de 3 linhas, `Outra sessão`.
5. `paused.ts` — `Pausado. Sem pressa.`, timer em âmbar, `Retomar` (R), `Encerrar`.
6. `missing.ts` — o que falta (Junto / Open-LLM-VTuber / Ollama), `Instalar e verificar`, `Usar só texto`.
7. `loading.ts` — `Preparando sua dupla`, progresso real por marcos (processo, porta, WebSocket), `Começar mesmo assim`. Mais de 120s sem pronto → erro e `Tentar de novo`.
8. `mic.ts` — `Sem acesso ao microfone`, `Abrir Ajustes do Sistema`, `Seguir no teclado`.

`iconState.ts` mapeia a fase para um destes ids: `idle`, `session`, `checkin`, `paused`, `ajuste`. O Rust troca o PNG e o título.

### 5. Estados de sistema não bloqueiam a sessão

- [ ] `submitGoal` ignora `engineMissing`, `engineLoading` e `micDenied`. Teste: com os três true, meta concreta ainda vai para `session` e `textOnly` pode ser true.
- [ ] `Usar só texto` e `Começar mesmo assim` e `Seguir no teclado` entram na sessão sem voz. O strip das telas 6–8 aparece em cima do início; Começar continua na tela.
- [ ] Microfone: não chamar `requestAccess` na abertura. Só o botão abre Ajustes (`x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Microphone`). Perguntar de novo só se a pessoa pedir.
- [ ] Ícone `ajuste` quando faltar motor ou o load passar de 2 min. Some quando a sessão começa em modo texto ou o motor fica pronto.

### 6. Overlay do motor: prompt, Edge TTS, flags off

Arquivos: `overlay/olvt/junto.yaml`, `scripts/olvt.sh`, `src-tauri/src/sidecar.rs`.

- [ ] Abrir o `conf` default e os modelos em `vendor/Open-LLM-VTuber` nesse SHA. Encaixar o YAML no formato real desse pin. Não inventar chave se o nome divergir: o texto do prompt e a voz `pt-BR-FranciscaNeural` ficam iguais.
- [ ] Campos a gravar: `persona_prompt` com o bloco exato; `tts_model: edge_tts`; voz pt-BR; `live2d_model_name: mao_pro`; agente `basic_memory_agent`; `llm_provider: ollama_llm` em `http://127.0.0.1:11434/v1`; modelo via `OLLAMA_MODEL` (documentar um exemplo, não fingir que o BRIEF escolheu um). `use_mcpp: false`.
- [ ] Toda chave desse pin que ligue fala proativa, câmera, visão ou captura de tela fica false. O cliente Junto não abre câmera e não manda frame de tela.
- [ ] Se `OPENROUTER_API_KEY` existir, o script troca para `openai_compatible_llm` com `https://openrouter.ai/api/v1`. Sem a variável, Ollama.
- [ ] `scripts/olvt.sh` gera o `conf.yaml` que o servidor desse pin lê (argumento `--config`/env se existir; senão o `conf.yaml` já gitignored na raiz do vendor). Recusar seguir se o arquivo gerado fosse trackeado. `sidecar.rs` sobe o script, faz health da porta, e mata o processo ao sair.

### 7. Nome do app ativo, log local, README, dev.sh

- [ ] `presence.rs`: `NSWorkspace` frontmost `localizedName` para o log e para a UI. O bundle id fica só em memória, para a lista de reunião (Zoom, FaceTime, Teams, Webex, Skype). Não ler título de janela, árvore de acessibilidade, nem pixels. Não pedir permissão de Acessibilidade. Foco do macOS: tentativa best-effort; se a API pública não responder, `focus: false`.
- [ ] `logstore.rs`: `~/Library/Application Support/com.manoelfreitas.junto/sessions.json` com meta, duração, início, fim, pausas, desfecho, nome do app. `summary.ts` monta as 3 linhas no formato do wireframe (`N sessões, … de foco` / `N metas concluídas, N parciais` / `Mais longa: …`). Sem linha de culpa para desfecho `nao`.
- [ ] [.gitignore](.gitignore): `node_modules`, `dist`, `src-tauri/target`, `run/`, `.DS_Store`. Não ignorar o gitlink do submodule.
- [ ] [LICENSE](LICENSE): MIT, Manoel Freitas.
- [ ] [README.md](README.md) em pt-BR, com: nota de renomear se publicar (já existe Junto na App Store); por que submodule+sidecar e o SHA; pré-requisitos (Xcode CLT, Rust, Node, Ollama, uv/Python); `scripts/dev.sh` e `npm run tauri dev` / `cargo tauri dev` no Mac; OpenRouter opcional; 3 check-ins e a frase de pausa; 8 telas e os 5 estados do ícone; avatar só no check-in ou sob demanda, sem roubar foco; privacidade; Acessibilidade não solicitada; limite de Foco/reunião (Meet dentro do navegador aparece como o nome do browser); uso pessoal.
- [ ] [scripts/dev.sh](scripts/dev.sh): `set -euo pipefail`, `git submodule update --init`, checkout do SHA, `npm install`. Fora do Darwin: avisa e roda `npm test`. No Mac: `npm run tauri dev`.

### 8. Commits e push

Seis commits, nesta ordem, cada um com `git -c user.name="Manoel Freitas" -c user.email="manoel.josefneto@gmail.com" commit`. Incluir `design/` e `BRIEF.md` no primeiro. Não usar `--no-verify`. Não dar `git config`.

1. `chore: esqueleto Tauri 2, licença e design`
2. `feat: popover de 320px com as oito telas`
3. `feat: três check-ins e pausa sem bronca`
4. `feat: fixar Open-LLM-VTuber v1.2.1 no sidecar`
5. `feat: nome do app ativo e log só no Mac`
6. `docs: README em português e script de desenvolvimento`

- [ ] `git status` dentro de `vendor/Open-LLM-VTuber` limpo (gitlink só no pai).
- [ ] `npm test` verde neste Linux.
- [ ] `git push -u origin main` para `https://github.com/manoel-freitas/junto-macos`. Sem force. Se a autenticação falhar, parar e reportar. Não criar outro remoto e não abrir os outros repositórios.
