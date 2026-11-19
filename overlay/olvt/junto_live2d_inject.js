/**
 * Injetado na página OLVT v1.2.1 (sem alterar o submodule).
 * Escuta mensagens WebSocket junto-motion* e aciona o modelo Live2D interno.
 */
(function () {
  const NativeWS = window.WebSocket;
  const pending = [];
  let playMotionRef = null;

  function tryFindPlayer() {
    if (playMotionRef) return playMotionRef;
    if (typeof window.__JUNTO_LIVE2D_PLAY__ === "function") {
      playMotionRef = window.__JUNTO_LIVE2D_PLAY__;
      return playMotionRef;
    }
    return null;
  }

  function handlePayload(data) {
    if (!data || typeof data !== "object") return;
    const play = tryFindPlayer();
    if (!play) {
      pending.push(data);
      if (pending.length > 32) pending.shift();
      return;
    }
    if (data.type === "junto-motion") {
      play(data.group, data.index, false);
    } else if (data.type === "junto-motion-idle") {
      play(data.group, 0, true);
    }
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
    while (pending.length) {
      handlePayload(pending.shift());
    }
  };

  window.addEventListener("message", (ev) => {
    if (ev.origin !== "http://127.0.0.1:12393") return;
    if (ev.data?.source === "junto" && ev.data.payload) {
      handlePayload(ev.data.payload);
    }
  });
})();