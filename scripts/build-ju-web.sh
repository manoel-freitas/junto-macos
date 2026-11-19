#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT/vendor/Open-LLM-VTuber/frontend"

cd "$ROOT"
git submodule update --init vendor/Open-LLM-VTuber

if [[ ! -d "$WEB_DIR/.git" && ! -f "$WEB_DIR/package.json" ]]; then
  echo "Clonando Open-LLM-VTuber-Web como frontend do OLVT…"
  git submodule update --init --recursive
fi

if [[ ! -f "$WEB_DIR/package.json" ]]; then
  echo "Aviso: frontend OLVT não encontrado em $WEB_DIR — pule build:web e use o servidor em :12393."
  exit 0
fi

cd "$WEB_DIR"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --tags 2>/dev/null || true
  git checkout v1.2.1 2>/dev/null || git checkout 3afa41014b4548a0842e9ee2f576f4b164b48886
fi

npm ci
npm run build:web

echo "OLVT-Web build:web concluído em $WEB_DIR"