# Instalação no Mac

## Pré-requisitos

- Xcode Command Line Tools
- Rust 1.90+ (`rust-toolchain.toml`)
- Node.js 20+
- [Ollama](https://ollama.com) com `qwen2.5:latest` (ou `OLLAMA_MODEL`)
- [uv](https://docs.astral.sh/uv/) para o sidecar Open-LLM-VTuber
- Opcional: `OPENROUTER_API_KEY` para LLM na nuvem

## Clonar e rodar

```bash
git clone https://github.com/manoel-freitas/junto-macos.git
cd junto-macos
./scripts/dev.sh
```

Em macOS, `dev.sh` chama `npm run tauri dev` (barra, popover, Ju). Em Linux/CI, roda só os testes Vitest.

Build da web da Ju (pin v1.2.1):

```bash
bash scripts/build-ju-web.sh
bash scripts/olvt.sh
```

## Autostart

Na primeira execução, o Junto ativa abrir ao login via `tauri-plugin-autostart` (LaunchAgent). Você pode desligar em **⌥I** → Convites e início.

Ju abre no canto em modo repouso (`idle`) após o login.