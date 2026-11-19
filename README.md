# Junto (macOS)

Companion de foco na barra de menu — **uso pessoal**. Se você um dia publicar na App Store ou Mac App Store, **renomeie o app**: já existe um aplicativo chamado [Junto](https://apps.apple.com) na loja da Apple.

Repositório: [github.com/manoel-freitas/junto-macos](https://github.com/manoel-freitas/junto-macos)

## O que é

App **sem janela principal**: popover de **320 px** sob o ícone da barra + **Ju**, pet de desktop sempre visível (janela Tauri transparente, always-on-top). Exatamente **três check-ins** por sessão (meta no início, meio da sessão, fim). Pausa mostra só **"Pausado. Sem pressa."** — sem streak nem bronca.

- **Accessory** + `LSUIElement`: não aparece no Dock; check-in automático não rouba foco do editor.
- **Ju** fica no canto da tela com Live2D do [Open-LLM-VTuber-Web](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web) **v1.2.1** (`build:web`), via sidecar — **sem Electron**.
- Cliques passam pela janela da Ju exceto no corpo (arraste para mover). **⌥⌘J** mostra/oculta; tamanhos P/M/G no menu da barra.
- Estados de sistema (motor ausente, carregando, microfone) **nunca impedem** de começar — só texto/teclado.

## Arquitetura

```text
Barra (tray) → popover 320px (8 telas + ajustes)
            → janela Ju 96–160px (OLVT :12393 + balão HTML)
Rust        → presença (reunião), pet, Automation opcional, log
Sidecar     → Open-LLM-VTuber v1.2.1 (submodule pinado)
```

Wireframes: `design/telas.html`, `design/personagem.html`, `design/bemestar.html`. Tokens: `design/base.css` / `src/styles/tokens.css`.

## Open-LLM-VTuber (submodule + sidecar)

Pin **v1.2.1** — SHA `3afa41014b4548a0842e9ee2f576f4b164b48886`:

1. **Submodule** `vendor/Open-LLM-VTuber` — gitlink fixo.
2. **Sidecar** — `scripts/olvt.sh` sobe o servidor (`uv run`) em **:12393**.
3. **Overlay** `overlay/olvt/` — prompt em português, Edge TTS `pt-BR-FranciscaNeural`, `mao_pro`.
4. **Frontend Ju** — `scripts/build-ju-web.sh` faz checkout da tag **v1.2.1** e `npm run build:web` no frontend OLVT.

O prompt de sistema (overlay) é **exatamente**:

```
Você é meu parceiro de foco numa chamada de vídeo. Fale em português, frases curtas.
1. Ao começar, pergunte só: "O que você vai terminar agora?" Se a meta for vaga, peça o primeiro passo concreto.
2. Depois fique em silêncio, trabalhando no seu canto. Não puxe assunto.
3. Só responda se eu falar com você, em no máximo 1 frase, e volte ao silêncio.
4. Quando eu disser "acabei", pergunte: "Saiu? Sim, parcial ou não?" e encerre com 1 frase gentil, sem cobrança.
```

**Desligado no Junto:** fala proativa fora dos check-ins, câmera, captura de tela. Título/URL de abas **não** vão ao LLM.

## Ju — pet desktop

- Estados: `idle`, `working`, `calling`, `pause`, `done`, `needs-adjustment`.
- Escada de alerta: (1) aceno + balão; (2) após 20 s, pulinho (`prefers-reduced-motion` respeitado); (3) som só se o usuário ativar. **Máx. 1 alerta / 10 min**.
- Some em tela cheia, reunião, compartilhamento (heurística) e modo Foco (best-effort); alertas entram em fila.

## Distração (opcional, OFF por padrão)

Quando você liga em **Perceber distrações** (⌥D no popover para abrir ajustes):

- macOS pede **Automação** (`NSAppleEventsUsageDescription`) para ler **URL da aba ativa** no Chrome ou Safari.
- **Sem** Screen Recording e **sem** Acessibilidade de tela inteira.
- Título e URL ficam só na memória do processo; **nunca** vão ao LLM, nuvem ou disco. O log `distraction_log.json` guarda apenas `{ date, total_ms }` agregado.
- Após ~3 min contínuos num domínio da lista, Ju pergunta **"Ainda em …?"** sem nomear o site. **"É pausa"** entra em pausa sem bronca.
- Erro -1743 (negado): aviso uma vez por navegador + **Abrir Ajustes**; aquele browser fica desligado no sensor.

## Bem-estar (só nas bordas)

Toggles (⌥B no popover): respiração 1 min antes de começar (default off), água ao fim do bloco (on), alongar a cada 2 blocos (on), pausa longa a cada 4 (on). Sem promessa de produtividade; lembretes contam no limite de 1 alerta / 10 min.

## Pré-requisitos (Mac)

- Xcode Command Line Tools
- **Rust 1.90+** (`rust-toolchain.toml`)
- Node.js 20+
- [Ollama](https://ollama.com) (`qwen2.5:latest` ou `OLLAMA_MODEL`)
- [uv](https://docs.astral.sh/uv/) (Python 3.10–3.12 para o OLVT)
- Opcional: `OPENROUTER_API_KEY` para LLM na nuvem

## Como rodar

```bash
git clone https://github.com/manoel-freitas/junto-macos.git
cd junto-macos
./scripts/dev.sh
```

- **macOS:** `dev.sh` → `npm run tauri dev` (barra + popover + Ju).
- **Linux/CI:** `dev.sh` → `npm test` (Rust pet/Automation com stubs).

```bash
npm install
npm test
npm run tauri dev
bash scripts/olvt.sh
bash scripts/build-ju-web.sh   # build OLVT-Web v1.2.1
```

## Privacidade

- Nome do app em primeiro plano (`NSWorkspace`) pode ir ao log de sessão local.
- Automação de browser: só domínio em memória para o sensor; **não** persiste URL/título.
- Sessões: `~/Library/Application Support/com.manoelfreitas.junto/sessions.json`
- Ju: posição/tamanho em `pet.json` no mesmo diretório.

## Foco do macOS e reuniões

Check-in do meio adia em apps de reunião (Zoom, FaceTime, Teams, Webex, Skype). Meet no browser aparece como nome do navegador. Modo Foco é best-effort.

## UI (8 telas do popover)

Ícone da barra: ○○ parado · ●● sessão + tempo · pulso no check-in · ●○ pausa · ●! ajuste (cor nunca é a única pista).

## Licença

MIT — Manoel Freitas.