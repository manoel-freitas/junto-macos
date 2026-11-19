#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor/Open-LLM-VTuber"

if [[ ! -d "$VENDOR" ]]; then
  echo "Submodule ausente. Rode: git submodule update --init" >&2
  exit 1
fi

cd "$VENDOR"
EXPECTED="3afa41014b4548a0842e9ee2f576f4b164b48886"
ACTUAL="$(git rev-parse HEAD)"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "Open-LLM-VTuber deve estar em $EXPECTED (v1.2.1), está em $ACTUAL" >&2
  exit 1
fi

if command -v uv >/dev/null 2>&1; then
  (cd "$VENDOR" && uv run python "$ROOT/overlay/olvt/apply_config.py")
else
  python3 "$ROOT/overlay/olvt/apply_config.py"
fi

export HF_HOME="$VENDOR/models"
export MODELSCOPE_CACHE="$VENDOR/models"

cd "$VENDOR"
if command -v uv >/dev/null 2>&1; then
  exec uv run python "$ROOT/overlay/olvt/run_junto.py"
else
  echo "uv não encontrado; instale https://docs.astral.sh/uv/" >&2
  exit 1
fi