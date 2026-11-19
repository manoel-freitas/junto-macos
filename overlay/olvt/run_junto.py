#!/usr/bin/env python3
"""Sobe o OLVT v1.2.1 com POST /junto/live2d e /junto/gesture (overlay Junto)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import run_server
from fastapi import Request, Response
from fastapi.responses import FileResponse, JSONResponse
from starlette.responses import HTMLResponse

ROOT = Path(__file__).resolve().parents[2]
OVERLAY = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor" / "Open-LLM-VTuber"
sys.path.insert(0, str(VENDOR))
sys.path.insert(0, str(OVERLAY))

from aparencia_io import resolve_gesture  # noqa: E402
from src.open_llm_vtuber.server import WebSocketServer  # noqa: E402

_ws_handler = None
_server: WebSocketServer | None = None


async def _broadcast_json(payload: dict) -> int:
    if _ws_handler is None:
        return 0
    text = json.dumps(payload)
    dead: list[str] = []
    sent = 0
    for uid, ws in list(_ws_handler.client_connections.items()):
        try:
            await ws.send_text(text)
            sent += 1
        except Exception:  # noqa: BLE001
            dead.append(uid)
    for uid in dead:
        _ws_handler.client_connections.pop(uid, None)
    return sent


def _patch_websocket_handler(cls):  # noqa: ANN001
    original_init = cls.__init__

    def __init__(self, default_context_cache, *args, **kwargs):  # noqa: ANN001
        global _ws_handler
        original_init(self, default_context_cache, *args, **kwargs)
        _ws_handler = self

    cls.__init__ = __init__


def _patch_server_init(cls):  # noqa: ANN001
    original_init = cls.__init__

    def __init__(self, config, default_context_cache=None, *args, **kwargs):  # noqa: ANN001
        global _server
        original_init(self, config, default_context_cache, *args, **kwargs)
        _server = self

        inject_path = OVERLAY / "junto_live2d_inject.js"

        @self.app.get("/junto/junto_live2d_inject.js")
        async def serve_inject():
            return FileResponse(
                inject_path,
                media_type="application/javascript",
            )

        @self.app.middleware("http")
        async def inject_html_middleware(request: Request, call_next):
            response = await call_next(request)
            if request.method != "GET":
                return response
            path = request.url.path.rstrip("/") or "/"
            if path not in ("/", "/index.html"):
                return response
            if "text/html" not in response.headers.get("content-type", ""):
                return response
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            try:
                html = body.decode("utf-8", errors="ignore")
            except Exception:  # noqa: BLE001
                return Response(content=body, status_code=response.status_code, headers=dict(response.headers))
            needle = "</body>"
            script = '<script src="/junto/junto_live2d_inject.js"></script>'
            if needle in html and script not in html:
                html = html.replace(needle, f"{script}\n{needle}", 1)
            headers = dict(response.headers)
            headers.pop("content-length", None)
            return HTMLResponse(content=html, status_code=response.status_code, headers=headers)

        @self.app.post("/junto/live2d")
        async def junto_live2d_switch(body: dict):
            model_name = body.get("modelName")
            if not model_name:
                return JSONResponse({"ok": False, "error": "modelName required"}, status_code=400)
            if _server is None or _ws_handler is None:
                return JSONResponse({"ok": False, "error": "server not ready"}, status_code=503)
            cache = _server.default_context_cache
            try:
                cache.live2d_model.set_model(model_name)
            except Exception as exc:  # noqa: BLE001
                return JSONResponse({"ok": False, "error": str(exc)}, status_code=404)
            cache.character_config.live2d_model_name = model_name
            for ctx in _ws_handler.client_contexts.values():
                ctx.character_config.live2d_model_name = model_name
                if ctx.live2d_model is not cache.live2d_model:
                    ctx.live2d_model.set_model(model_name)
            payload = {
                "type": "set-model-and-conf",
                "model_info": cache.live2d_model.model_info,
                "conf_name": cache.character_config.conf_name,
                "conf_uid": cache.character_config.conf_uid,
            }
            await _broadcast_json(payload)
            return JSONResponse({"ok": True, "modelName": model_name})

        @self.app.post("/junto/gesture")
        async def junto_gesture(body: dict):
            ju_state = body.get("juState")
            if not ju_state:
                return JSONResponse({"ok": False, "error": "juState required"}, status_code=400)
            if _ws_handler is None:
                return JSONResponse({"ok": False, "error": "server not ready"}, status_code=503)
            payload = resolve_gesture(str(ju_state))
            n = await _broadcast_json(payload)
            return JSONResponse({"ok": True, "sent": n, "payload": payload})

    cls.__init__ = __init__


def main() -> int:
    from src.open_llm_vtuber import websocket_handler

    _patch_websocket_handler(websocket_handler.WebSocketHandler)
    _patch_server_init(WebSocketServer)
    run_server.run(console_log_level="INFO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())