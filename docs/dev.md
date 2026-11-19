# Para desenvolvedores

```bash
npm install
npm test          # Vitest (máquina de sessão, convites, well-being)
npm run tauri dev # macOS
```

Arquitetura resumida:

```text
Barra (tray) → popover (Vite/TS)
            → Ju (pet.html + OLVT :12393)
Rust         → presença, pet, autostart, atalhos globais, sidecar
```

## Testes de convites

`src/invites/machine.ts` — regras puras; `src/invites/invite.test.ts`.

## Documentação

```bash
pip install mkdocs-material
mkdocs serve
```

Deploy: workflow `.github/workflows/docs.yml` em push na `main`.

## Submodule OLVT

Pin v1.2.1 — veja `README.md` e `scripts/build-ju-web.sh`.

## Aparência (Live2D)

- Estado: `~/Library/Application Support/com.manoelfreitas.junto/aparencia.json` (dev Linux: `run/aparencia.json`).
- Modelos: `vendor/Open-LLM-VTuber/live2d-models/`.
- Troca em runtime: `POST http://127.0.0.1:12393/junto/live2d` com `{"modelName":"..."}` (hook em `overlay/olvt/run_junto.py`), depois o pet recarrega o iframe — **sem** `switch-config` do OLVT (não atualiza o cache de sessão do pet sozinho).
- Não use `switch-config` para a Ju: só afeta o cliente que enviou o WebSocket.

UI no navegador (mock Tauri): `npm run dev` → [http://localhost:1420/aparencia.html](http://localhost:1420/aparencia.html). Query `?estado=carregando|baixando|falha|licenca` para screenshot de estados.

## Gestos da Ju (gap 1)

1. Popover/sessão emite `ju-state` → pet chama `aparencia_trigger_gesture` (Rust) → `POST /junto/gesture` com `juState`.
2. `overlay/olvt/aparencia_io.py` resolve gesto a partir de `aparencia.json` do modelo **ativo** (`parada`, `chamando`, etc.).
3. OLVT faz broadcast WebSocket `junto-motion` ou `junto-motion-idle` para todos os clientes.
4. `junto_live2d_inject.js` (injetado no `index.html` do OLVT via `run_junto.py`) intercepta o WebSocket e chama `__JUNTO_REGISTER_LIVE2D_PLAY__` quando o frontend OLVT-Web v1.2.1 expuser o player.

Sem gesto mapeado → `junto-motion-idle` com `idleMotionGroupName` do `model_dict` / gesto `parada`.