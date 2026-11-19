"""Testes puros do resolve_gesture (pytest)."""
from __future__ import annotations

from aparencia_io import resolve_gesture


def test_resolve_motion_when_mapped(monkeypatch):
    import aparencia_io as aio

    def fake_row():
        return "mao", {
            "gestures": {
                "chamando": {"group": "Tap", "index": 1},
                "parada": {"group": "Idle", "index": 0},
            },
            "modelDict": {"idleMotionGroupName": "Idle"},
        }

    monkeypatch.setattr(aio, "active_model_row", fake_row)
    out = resolve_gesture("calling")
    assert out["type"] == "junto-motion"
    assert out["group"] == "Tap"


def test_resolve_idle_fallback(monkeypatch):
    import aparencia_io as aio

    def fake_row():
        return "mao", {
            "gestures": {"parada": {"group": "Idle", "index": 0}},
            "modelDict": {"idleMotionGroupName": "Idle"},
        }

    monkeypatch.setattr(aio, "active_model_row", fake_row)
    out = resolve_gesture("pause")
    assert out["type"] == "junto-motion-idle"
    assert out["group"] == "Idle"