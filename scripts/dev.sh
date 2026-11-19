#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git submodule update --init --recursive
git -C vendor/Open-LLM-VTuber checkout 3afa41014b4548a0842e9ee2f576f4b164b48886

npm install

if [[ ! -f vendor/Open-LLM-VTuber/frontend/package.json ]]; then
  bash scripts/build-ju-web.sh || true
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Ambiente não-macOS: rodando testes Vitest. Para o app completo, use um Mac com:"
  echo "  npm run tauri dev"
  npm test
else
  echo "macOS: iniciando Tauri dev (ícone na barra + popover 320px)..."
  npm run tauri dev
fi