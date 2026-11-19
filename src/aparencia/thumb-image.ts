export interface ThumbMountOptions {
  url: string;
  label: string;
  skeleton?: boolean;
  imgClass?: string;
  skeletonHeight?: string;
}

/** Usado em testes: cobre imagem já em cache (load antes do listener). */
export interface ThumbImageLike {
  complete: boolean;
  naturalWidth: number;
  addEventListener(type: "load" | "error", fn: () => void): void;
  src: string;
}

export function wireThumbImageLoad(
  img: ThumbImageLike,
  onLoad: () => void,
  onError: () => void,
): void {
  img.addEventListener("load", onLoad);
  img.addEventListener("error", onError);
}

export function thumbAlreadyLoaded(img: ThumbImageLike): boolean {
  return img.complete && img.naturalWidth > 0;
}

function showInitialPlaceholder(
  container: HTMLElement,
  label: string,
  boxClass: string,
): void {
  const ph = document.createElement("div");
  ph.className = `aparencia-thumb-ph ${boxClass}`;
  ph.textContent = label.trim().charAt(0).toUpperCase() || "?";
  container.appendChild(ph);
}

function mountThumbWithSkeleton(
  container: HTMLElement,
  opts: ThumbMountOptions,
  placeholderClass: string,
  skeletonHeight?: string,
): void {
  container.replaceChildren();
  const sk = document.createElement("div");
  sk.className = "aparencia-sk";
  if (skeletonHeight) sk.style.height = skeletonHeight;
  const img = document.createElement("img") as ThumbImageLike & HTMLImageElement;
  img.alt = opts.label;
  img.decoding = "async";

  const onLoad = () => {
    sk.remove();
  };
  const onError = () => {
    container.replaceChildren();
    showInitialPlaceholder(container, opts.label, placeholderClass);
  };

  container.append(sk, img);
  wireThumbImageLoad(img, onLoad, onError);
  img.src = opts.url;
  if (thumbAlreadyLoaded(img)) onLoad();
}

/** Cartão da grade: skeleton global (demo) ou por cartão. */
export function mountCardThumb(container: HTMLElement, opts: ThumbMountOptions): void {
  container.replaceChildren();
  if (opts.skeleton) {
    container.className = "aparencia-sk";
    if (opts.skeletonHeight) container.style.height = opts.skeletonHeight;
    return;
  }
  container.className = "aparencia-im";
  mountThumbWithSkeleton(container, opts, "aparencia-thumb-ph--card", opts.skeletonHeight ?? "96px");
}

/** Prévia grande ou avatar no canto. */
export function mountPreviewThumb(container: HTMLElement, opts: ThumbMountOptions): void {
  container.className = container.className || "aparencia-big";
  mountThumbWithSkeleton(
    container,
    opts,
    opts.imgClass ?? "aparencia-thumb-ph--big",
    opts.skeletonHeight,
  );
}