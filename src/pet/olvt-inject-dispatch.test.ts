import { describe, expect, it, vi } from "vitest";
import {
  dispatchJuntoPayload,
  OLVT_PRIORITY_IDLE,
  OLVT_PRIORITY_NORMAL,
  type OlvtAdapterLike,
} from "./olvt-inject-dispatch";

function mockAdapter(ready = true): OlvtAdapterLike & {
  startMotion: ReturnType<typeof vi.fn>;
  setExpression: ReturnType<typeof vi.fn>;
} {
  const startMotion = vi.fn();
  const setExpression = vi.fn();
  return {
    getModel: () => (ready ? {} : null),
    startMotion,
    setExpression,
  };
}

describe("dispatchJuntoPayload", () => {
  it("plays motion with normal priority", () => {
    const adapter = mockAdapter();
    expect(
      dispatchJuntoPayload(adapter, {
        type: "junto-motion",
        group: "Wave",
        index: 2,
      }),
    ).toBe("ok");
    expect(adapter.startMotion).toHaveBeenCalledWith(
      "Wave",
      2,
      OLVT_PRIORITY_NORMAL,
      null,
    );
  });

  it("plays idle at index 0 with idle priority", () => {
    const adapter = mockAdapter();
    expect(
      dispatchJuntoPayload(adapter, {
        type: "junto-motion-idle",
        group: "Idle",
      }),
    ).toBe("ok");
    expect(adapter.startMotion).toHaveBeenCalledWith(
      "Idle",
      0,
      OLVT_PRIORITY_IDLE,
      null,
    );
  });

  it("returns not-ready without model", () => {
    const adapter = mockAdapter(false);
    expect(
      dispatchJuntoPayload(adapter, {
        type: "junto-motion",
        group: "Wave",
        index: 0,
      }),
    ).toBe("not-ready");
    expect(adapter.startMotion).not.toHaveBeenCalled();
  });

  it("calls setExpression when provided", () => {
    const adapter = mockAdapter();
    dispatchJuntoPayload(adapter, {
      type: "junto-motion",
      group: "Talk",
      index: 0,
      expression: "happy",
    });
    expect(adapter.setExpression).toHaveBeenCalledWith("happy");
  });

  it("ignores invalid payload", () => {
    const adapter = mockAdapter();
    expect(dispatchJuntoPayload(adapter, null)).toBe("ignored");
    expect(dispatchJuntoPayload(adapter, { type: "other" })).toBe("ignored");
  });
});