import { describe, expect, it, vi } from "vitest";
import { thumbAlreadyLoaded, wireThumbImageLoad, type ThumbImageLike } from "./thumb-image";

function fakeImg(loaded: boolean): ThumbImageLike & {
  src: string;
  fireLoad: () => void;
} {
  let loadFn: (() => void) | null = null;
  return {
    complete: loaded,
    naturalWidth: loaded ? 10 : 0,
    src: "",
    addEventListener(type, fn) {
      if (type === "load") loadFn = fn;
    },
    fireLoad() {
      loadFn?.();
    },
  };
}

describe("wireThumbImageLoad", () => {
  it("chama onLoad se a imagem já estava em cache", () => {
    const img = fakeImg(true);
    const onLoad = vi.fn();
    wireThumbImageLoad(img, onLoad, vi.fn());
    img.src = "https://example.com/a.jpg";
    expect(thumbAlreadyLoaded(img)).toBe(true);
    if (thumbAlreadyLoaded(img)) onLoad();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("remove skeleton no load após re-render simulado", () => {
    const img = fakeImg(false);
    const onLoad = vi.fn();
    wireThumbImageLoad(img, onLoad, vi.fn());
    img.src = "https://example.com/b.jpg";
    expect(onLoad).not.toHaveBeenCalled();
    (img as unknown as { complete: boolean; naturalWidth: number }).complete = true;
    (img as unknown as { naturalWidth: number }).naturalWidth = 100;
    img.fireLoad();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});