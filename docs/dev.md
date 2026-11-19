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