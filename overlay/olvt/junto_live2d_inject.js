/**
 * Injetado na página OLVT v1.2.1 (sem alterar o submodule).
 * Escuta mensagens WebSocket junto-motion* e aciona o modelo via getLAppAdapter().
 * Lógica espelha src/pet/olvt-inject-dispatch.ts
 */
(function () {
  const NativeWS = window.WebSocket;
  const pending = [];
  const POLL_MS = 100;
  const MAX_POLL_ATTEMPTS = 120;
  const OLVT_PRIORITY_IDLE = 1;
  const OLVT_PRIORITY_NORMAL = 2;
  let drainTimer = null;
  let drainAttempts = 0;

  function tryCustomPlay() {
    if (typeof window.__JUNTO_LIVE2D_PLAY__ === "function") {
      return window.__JUNTO_LIVE2D_PLAY__;
    }
    return null;
  }

  function getOlvtAdapter() {
    if (typeof window.getLAppAdapter !== "function") return null;
    try {
      return window.getLAppAdapter();
    } catch (_e) {
      return null;
    }
  }

  function adapterReady(adapter) {
    if (!adapter || typeof adapter.getModel !== "function") return false;
    try {
      return !!adapter.getModel();
    } catch (_e) {
      return false;
    }
  }

  function dispatchViaAdapter(adapter, data) {
    if (!data || typeof data !== "object") return "ignored";
    if (data.type !== "junto-motion" && data.type !== "junto-motion-idle") {
      return "ignored";
    }
    if (!adapterReady(adapter)) return "not-ready";

    if (data.type === "junto-motion-idle") {
      adapter.startMotion(data.group, 0, OLVT_PRIORITY_IDLE, null);
    } else if (data.group) {
      adapter.startMotion(data.group, data.index ?? 0, OLVT_PRIORITY_NORMAL, null);
    } else {
      return "ignored";
    }
    if (data.expression != null && typeof adapter.setExpression === "function") {
      adapter.setExpression(String(data.expression));
    }
    return "ok";
  }

  function playWithCustom(custom, data) {
    if (data.type === "junto-motion") {
      custom(data.group, data.index ?? 0, false);
    } else if (data.type === "junto-motion-idle") {
      custom(data.group, 0, true);
    }
  }

  function enqueuePending(data) {
    pending.push(data);
    if (pending.length > 32) pending.shift();
  }

  function drainPending() {
    if (!pending.length) return;
    const adapter = getOlvtAdapter();
    if (!adapterReady(adapter)) return;
    const rest = [];
    for (const item of pending) {
      const result = dispatchViaAdapter(adapter, item);
      if (result === "not-ready") rest.push(item);
    }
    pending.length = 0;
    pending.push(...rest);
  }

  function scheduleDrain() {
    if (drainTimer) return;
    drainAttempts = 0;
    const tick = () => {
      drainPending();
      if (!pending.length) {
        drainTimer = null;
        return;
      }
      drainAttempts += 1;
      if (drainAttempts >= MAX_POLL_ATTEMPTS) {
        drainTimer = null;
        return;
      }
      drainTimer = setTimeout(tick, POLL_MS);
    };
    drainTimer = setTimeout(tick, POLL_MS);
  }

  function handlePayload(data) {
    if (!data || typeof data !== "object") return;
    const custom = tryCustomPlay();
    if (custom) {
      playWithCustom(custom, data);
      return;
    }

    const adapter = getOlvtAdapter();
    const result = dispatchViaAdapter(adapter, data);
    if (result === "ok" || result === "ignored") return;

    enqueuePending(data);
    scheduleDrain();
  }

  function patchOnMessage(ws) {
    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        handlePayload(data);
      } catch (_e) {
        /* noop */
      }
    });
  }

  window.WebSocket = function (url, protocols) {
    const ws = protocols ? new NativeWS(url, protocols) : new NativeWS(url);
    patchOnMessage(ws);
    return ws;
  };
  window.WebSocket.prototype = NativeWS.prototype;
  Object.assign(window.WebSocket, NativeWS);

  window.__JUNTO_REGISTER_LIVE2D_PLAY__ = function (fn) {
    window.__JUNTO_LIVE2D_PLAY__ = fn;
    drainPending();
    while (pending.length) {
      const item = pending.shift();
      playWithCustom(fn, item);
    }
  };

  window.addEventListener("message", (ev) => {
    if (ev.origin !== "http://127.0.0.1:12393") return;
    if (ev.data?.source === "junto" && ev.data.payload) {
      handlePayload(ev.data.payload);
    }
  });
})();