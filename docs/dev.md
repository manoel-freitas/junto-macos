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