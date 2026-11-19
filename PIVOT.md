# PIVOT aprovado por Manu (19/11/2026 04:42 UTC-3) — SUBSTITUI partes do plano antigo

Mesmo repo Junto. Manter: tokens, 8 telas do popover, a11y, pin OLVT v1.2.1, system prompt EXATO, Edge TTS pt-BR, 3 check-ins, estados de sistema que NÃO bloqueiam começar.

## SUBSTITUI
1. "Avatar só no check-in" → **personagem JU sempre visível** (desktop pet).
2. "Ler só nome do app ativo" como sensor de distração → **Apple Events opcional (OFF por padrão)** lendo título+URL da aba; app name ainda pode ajudar fora do browser.

## 1. Personagem JU — pet de desktop sempre visível
- Sempre num canto, always-on-top, frameless, fundo transparente, click-through EXCETO no corpo. Arrastável. Nunca rouba foco/teclado.
- Reconstruir a janela do pet **no próprio Tauri v2** (transparent window, setAlwaysOnTop, setIgnoreCursorEvents, macOSPrivateApi). Usar visuais do **Open-LLM-VTuber-Web v1.2.1** (`build:web`). **NÃO** rodar Electron junto.
- Estados: idle (parada), working (digita + timer), calling (acena + balão 1/2/3), pause (âmbar, café), done (comemora 2s), needs-adjustment (laranja).
- Escada de alerta: (1) aceno+balão; (2) após 20s um pulinho; (3) som só se o usuário ativou. Máx 1 alerta / 10 min. Fala proativa SOMENTE nos check-ins.
- Esconder em fullscreen, calls, screen sharing, macOS Focus; enfileirar alertas. ⌥⌘J toggle; tamanho S/M/L no menu.
- Refs: `design/personagem.html` + `design/personagem.png` (já copiados).

## 2. Sensor de distração — OPCIONAL, OFF por padrão
- Ler título + URL da aba ativa via Automation (Apple Events) por browser (Chrome, Safari). Declarar `NSAppleEventsUsageDescription`. **SEM** Screen Recording.
- Match por domínio. Pedir permissão só quando o usuário liga a feature. Em deny (error -1743): Ju avisa uma vez que não vai sentir distração naquele browser + "Abrir Ajustes"; o resto continua.
- Título/URL ficam só no Mac: **NUNCA** enviados ao LLM/nuvem, **NUNCA** persistidos. Log guarda só o tempo total de distração do dia.
- Lista editável de categorias: short video primeiro (Shorts, Reels, TikTok), depois social/chat, video/streaming, games, betting, shopping, news.
- Após ~3 min contínuos num domínio de distração, Ju para e pergunta "Ainda em X?" **SEM nomear o site**. "É pausa" → pausa, sem bronca.
- Refs: `design/bemestar.html` + `design/bemestar.png`.

## 3. Lembretes de bem-estar — só nas bordas da sessão
- Nunca no meio do foco: respiração opcional de 1 min antes de começar (corpo da Ju cresce/encolhe no ritmo); água no fim do bloco; alongar a cada 2 blocos; pausa longa após 4.
- Ju faz junto. Cada lembrete liga/desliga separado; conta no limite 1 alerta/10 min; sem contadores de streak.
- Cópia de conforto apenas — nunca promete mais produtividade. 25 min é o default do produto, configurável.

## Atualizar
- README: arquitetura do pet Ju no Tauri (não Electron), permissão Automation, toggles de bem-estar, privacidade (título/URL nunca saem do Mac).
- Info.plist / capabilities: NSAppleEventsUsageDescription; macOSPrivateApi para janela transparente.
- Remover/ajustar docs que digam "avatar só no check-in" ou "só nome do app / sem Accessibility" se contradisserem o pivot (Automation é o caminho do browser; sem Screen Recording).
