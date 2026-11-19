"""Leitura de aparencia.json compartilhada entre apply_config e run_junto."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "vendor" / "Open-LLM-VTuber"

JU_TO_GESTURE_KEY = {
    "idle": "parada",
    "working": "parada",
    "calling": "chamando",
    "pause": "pausa",
    "done": "acabou",
    "needs-adjustment": "ajuste",
}


def aparencia_path() -> Path:
    if os.environ.get("JUNTO_APARENCIA"):
        return Path(os.environ["JUNTO_APARENCIA"])
    if sys.platform == "darwin":
        home = os.environ.get("HOME")
        if home:
            return Path(home) / "Library/Application Support/com.manoelfreitas.junto/aparencia.json"
    return ROOT / "run" / "aparencia.json"


def load_aparencia() -> dict[str, Any]:
    path = aparencia_path()
    if not path.is_file():
        return {"activeId": "mao", "installed": {}, "licenseAccepted": []}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"activeId": "mao", "installed": {}, "licenseAccepted": []}


def active_model_row() -> tuple[str, dict[str, Any]]:
    data = load_aparencia()
    active = data.get("activeId", "mao")
    installed = data.get("installed", {})
    row = installed.get(active) or {
        "olvtName": "mao_pro",
        "gestures": {},
        "modelDict": {},
    }
    return active, row


def resolve_gesture(ju_state: str) -> dict[str, Any]:
    """Retorna payload WS: junto-motion ou junto-motion-idle."""
    _active, row = active_model_row()
    gestures = row.get("gestures") or {}
    key = JU_TO_GESTURE_KEY.get(ju_state, "parada")
    ref = gestures.get(key)
    model_dict = row.get("modelDict") or {}
    idle_group = model_dict.get("idleMotionGroupName") or "Idle"

    if ref and ref.get("group") is not None:
        return {
            "type": "junto-motion",
            "group": ref["group"],
            "index": int(ref.get("index", 0)),
        }
    parada = gestures.get("parada")
    group = (parada or {}).get("group") or idle_group or "Idle"
    return {"type": "junto-motion-idle", "group": group}