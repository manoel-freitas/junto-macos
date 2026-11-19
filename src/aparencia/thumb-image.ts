export interface ThumbMountOptions {
  url: string;
  label: string;
  skeleton?: boolean;
  imgClass?: string;
  skeletonHeight?: string;
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

/** Cartão da grade: skeleton global ou carregamento por miniatura. */
export function mountCardThumb(container: HTMLElement, opts: ThumbMountOptions): void {
  container.replaceChildren();
  if (opts.skeleton) {
    container.className = "aparencia-sk";
    return;
  }
  container.className = "aparencia-im";
  const sk = document.createElement("div");
  sk.className = "aparencia-sk";
  if (opts.skeletonHeight) sk.style.height = opts.skeletonHeight;
  const img = document.createElement("img");
  img.alt = opts.label;
  img.decoding = "async";
  img.src = opts.url;
  container.append(sk, img);
  img.addEventListener("load", () => {
    sk.remove();
  });
  img.addEventListener("error", () => {
    container.replaceChildren();
    showInitialPlaceholder(container, opts.label, "aparencia-thumb-ph--card");
  });
}

/** Prévia grande ou avatar no canto. */
export function mountPreviewThumb(container: HTMLElement, opts: ThumbMountOptions): void {
  container.replaceChildren();
  const sk = document.createElement("div");
  sk.className = "aparencia-sk";
  if (opts.skeletonHeight) sk.style.height = opts.skeletonHeight;
  const img = document.createElement("img");
  img.alt = opts.label;
  img.decoding = "async";
  img.src = opts.url;
  container.append(sk, img);
  img.addEventListener("load", () => {
    sk.remove();
  });
  img.addEventListener("error", () => {
    container.replaceChildren();
    showInitialPlaceholder(container, opts.label, opts.imgClass ?? "aparencia-thumb-ph--big");
  });
}