/** Mirrors OLVT-Web v1.2.1 (06a659b) LAppDefine priorities in main bundle. */
export const OLVT_PRIORITY_IDLE = 1;
export const OLVT_PRIORITY_NORMAL = 2;

export type JuntoMotionPayload =
  | { type: "junto-motion"; group: string; index?: number; expression?: string }
  | { type: "junto-motion-idle"; group: string; expression?: string };

export interface OlvtAdapterLike {
  getModel(): unknown | null;
  startMotion(
    group: string,
    index: number,
    priority: number,
    onFinished?: unknown,
  ): unknown;
  setExpression?(name: string): void;
}

export type DispatchResult = "ok" | "not-ready" | "ignored";

export function dispatchJuntoPayload(
  adapter: OlvtAdapterLike | null | undefined,
  payload: unknown,
): DispatchResult {
  if (!payload || typeof payload !== "object") return "ignored";
  const p = payload as JuntoMotionPayload;
  if (p.type !== "junto-motion" && p.type !== "junto-motion-idle") return "ignored";
  if (!adapter) return "not-ready";
  const model = adapter.getModel();
  if (!model) return "not-ready";

  if (p.type === "junto-motion-idle") {
    adapter.startMotion(p.group, 0, OLVT_PRIORITY_IDLE, null);
  } else if (p.type === "junto-motion" && p.group) {
    adapter.startMotion(p.group, p.index ?? 0, OLVT_PRIORITY_NORMAL, null);
  } else {
    return "ignored";
  }

  if (p.expression != null && adapter.setExpression) {
    adapter.setExpression(String(p.expression));
  }
  return "ok";
}