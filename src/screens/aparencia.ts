import {
  Catalog,
  LICENSE_URL,
  type BadgeKind,
  type CatalogEntry,
  type FilterKind,
} from "../aparencia/catalog";
import { GestureMap } from "../aparencia/gestures";
import type { AparenciaMachineState } from "../aparencia/machine";
import { mountCardThumb, mountPreviewThumb } from "../aparencia/thumb-image";

export interface AparenciaViewCtx {
  state: AparenciaMachineState;
  installedIds: Set<string>;
  licenseAccepted: Set<string>;
  selectedModel3: import("../aparencia/gestures").Model3Shape | null;
  onSelect: (id: string) => void;
  onFilter: (f: FilterKind) => void;
  onQuery: (q: string) => void;
  onUse: () => void;
  onTest: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onAcceptLicense: () => void;
  onShowReason: () => void;
  imagesLoaded: boolean;
}

export class AparenciaScreen {
  static render(root: HTMLElement, ctx: AparenciaViewCtx): void {
    root.replaceChildren();
    const win = document.createElement("div");
    win.className = "aparencia-win";

    const tb = document.createElement("div");
    tb.className = "aparencia-tb";
    tb.innerHTML =
      '<span class="aparencia-dot"></span><span class="aparencia-dot y"></span><span class="aparencia-dot g"></span><span style="margin-left:10px">Junto, Ajustes</span>';
    win.appendChild(tb);

    const side = document.createElement("div");
    side.className = "aparencia-side";
    for (const label of ["Geral", "Aparência", "Lembretes", "Distrações", "Horário", "Atalhos"]) {
      const d = document.createElement("div");
      d.textContent = label;
      if (label === "Aparência") d.className = "on";
      side.appendChild(d);
    }
    win.appendChild(side);

    const main = document.createElement("div");
    main.className = "aparencia-main";
    main.appendChild(AparenciaScreen.h2("Aparência da Ju"));
    const sub = document.createElement("p");
    sub.className = "aparencia-muted";
    sub.textContent =
      "Escolha quem fica com você no canto da tela. Dá para trocar quando quiser.";
    main.appendChild(sub);
    main.appendChild(AparenciaScreen.chips(ctx));
    if (ctx.state.phase === "baixando" || ctx.state.phase === "falha" || ctx.state.phase === "licenca") {
      main.appendChild(AparenciaScreen.overlay(ctx));
    }
    main.appendChild(AparenciaScreen.grid(ctx));
    win.appendChild(main);
    win.appendChild(AparenciaScreen.preview(ctx));
    root.appendChild(win);
  }

  private static h2(text: string): HTMLElement {
    const h = document.createElement("h2");
    h.textContent = text;
    return h;
  }

  private static chips(ctx: AparenciaViewCtx): HTMLElement {
    const row = document.createElement("div");
    row.className = "aparencia-chips";
    const counts = Catalog.counts(ctx.installedIds);
    const defs: { f: FilterKind; label: string }[] = [
      { f: "todas", label: `Todas (${counts.todas})` },
      { f: "pessoas", label: `Pessoas (${counts.pessoas})` },
      { f: "bichinhos", label: `Bichinhos (${counts.bichinhos})` },
      { f: "chibi", label: `Chibi (${counts.chibi})` },
      { f: "instaladas", label: `Instaladas (${counts.instaladas})` },
    ];
    for (const d of defs) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `aparencia-chip${ctx.state.filter === d.f ? " on" : ""}`;
      b.textContent = d.label;
      b.addEventListener("click", () => ctx.onFilter(d.f));
      row.appendChild(b);
    }
    const search = document.createElement("input");
    search.className = "aparencia-search";
    search.placeholder = "Buscar pelo nome";
    search.value = ctx.state.query;
    search.addEventListener("input", () => ctx.onQuery(search.value));
    row.appendChild(search);
    return row;
  }

  private static grid(ctx: AparenciaViewCtx): HTMLElement {
    const grid = document.createElement("div");
    grid.className = "aparencia-grid";
    const entries = Catalog.filter(
      Catalog.all,
      ctx.state.filter,
      ctx.installedIds,
      ctx.state.query,
    );
    const loading = !ctx.imagesLoaded && ctx.state.phase === "carregando";
    for (const entry of entries) {
      grid.appendChild(AparenciaScreen.card(entry, ctx, loading));
    }
    return grid;
  }

  private static card(entry: CatalogEntry, ctx: AparenciaViewCtx, loading: boolean): HTMLElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `aparencia-card${ctx.state.selectedId === entry.id ? " sel" : ""}`;
    if (ctx.state.activeId === entry.id && ctx.state.selectedId === entry.id) {
      const chk = document.createElement("div");
      chk.className = "aparencia-chk";
      chk.textContent = "✓";
      card.appendChild(chk);
    }
    const im = document.createElement("div");
    mountCardThumb(im, {
      url: entry.thumbUrl,
      label: entry.displayName,
      skeleton: loading,
      skeletonHeight: "96px",
    });
    card.appendChild(im);
    const nm = document.createElement("div");
    nm.className = "aparencia-nm";
    nm.textContent = entry.displayName;
    card.appendChild(nm);
    const meta = document.createElement("div");
    meta.className = "aparencia-meta";
    const cat = document.createElement("span");
    cat.className = "aparencia-cat";
    cat.textContent = Catalog.categoryLabel(entry.category);
    const badge = document.createElement("span");
    badge.className = `aparencia-b ${AparenciaScreen.badgeClass(Catalog.badge(entry, ctx.installedIds))}`;
    badge.textContent = AparenciaScreen.badgeLabel(Catalog.badge(entry, ctx.installedIds));
    meta.append(cat, badge);
    card.appendChild(meta);
    card.addEventListener("click", () => ctx.onSelect(entry.id));
    return card;
  }

  private static badgeClass(b: BadgeKind): string {
    if (b === "instalada") return "inst";
    if (b === "licenca") return "lic";
    return "dl";
  }

  private static badgeLabel(b: BadgeKind): string {
    if (b === "instalada") return "Já instalada";
    if (b === "licenca") return "Outra licença";
    return "Baixar";
  }

  private static preview(ctx: AparenciaViewCtx): HTMLElement {
    const prev = document.createElement("div");
    prev.className = "aparencia-prev";
    const entry = Catalog.getById(ctx.state.selectedId) ?? Catalog.getById("mao")!;
    const activeEntry = Catalog.getById(ctx.state.activeId) ?? entry;
    const capPrev = document.createElement("div");
    capPrev.className = "aparencia-cap";
    capPrev.textContent = "Prévia";
    prev.appendChild(capPrev);

    const big = document.createElement("div");
    big.className = "aparencia-big";
    mountPreviewThumb(big, {
      url: entry.thumbUrl,
      label: entry.displayName,
      skeletonHeight: "190px",
      imgClass: "aparencia-thumb-ph--big",
    });
    prev.appendChild(big);

    const title = document.createElement("div");
    title.style.fontSize = "16px";
    title.style.fontWeight = "800";
    title.style.marginTop = "10px";
    title.textContent = entry.displayName;
    prev.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "aparencia-muted";
    const badge = Catalog.badge(entry, ctx.installedIds);
    meta.textContent = `${Catalog.categoryLabel(entry.category).slice(0, -1)} · ${
      badge === "instalada" ? "já instalada" : badge === "licenca" ? "outra licença" : "baixar"
    } · animação ao vivo`;
    prev.appendChild(meta);

    const capDesk = document.createElement("div");
    capDesk.className = "aparencia-cap";
    capDesk.style.marginTop = "12px";
    capDesk.textContent = "No canto da sua tela";
    prev.appendChild(capDesk);

    const desk = document.createElement("div");
    desk.className = "aparencia-desk";
    const wnd = document.createElement("div");
    wnd.className = "wnd";
    const ju = document.createElement("div");
    ju.className = "ju";
    mountPreviewThumb(ju, {
      url: activeEntry.thumbUrl,
      label: activeEntry.displayName,
      skeletonHeight: "62px",
      imgClass: "aparencia-thumb-ph--ju",
    });
    desk.append(wnd, ju);
    prev.appendChild(desk);

    const capGest = document.createElement("div");
    capGest.className = "aparencia-cap";
    capGest.style.marginTop = "10px";
    capGest.textContent = "Gestos para os estados da Ju";
    prev.appendChild(capGest);

    const gest = document.createElement("div");
    gest.className = "aparencia-gest";
    const model3 = ctx.selectedModel3;
    const gestures = model3 ? GestureMap.fromModel3(model3) : null;
    const chips = model3 && gestures ? GestureMap.previewChips(model3, gestures) : [];
    for (const c of chips) {
      const s = document.createElement("span");
      s.textContent = `${c.ok ? "✓" : "?"} ${c.label}`;
      gest.appendChild(s);
    }
    if (!chips.length) {
      gest.appendChild(document.createTextNode("Carregue o modelo para ver os gestos."));
    }
    prev.appendChild(gest);

    const note = document.createElement("div");
    note.className = "aparencia-muted";
    note.style.marginTop = "8px";
    note.textContent =
      '"?" significa que o Junto confere no arquivo do modelo ao baixar; o que faltar vira o gesto mais próximo.';
    prev.appendChild(note);

    const btnRow = document.createElement("div");
    btnRow.className = "aparencia-btn-row";
    const use = document.createElement("button");
    use.type = "button";
    use.className = "aparencia-btn pri";
    use.textContent =
      entry.id === ctx.state.activeId && ctx.installedIds.has(entry.id)
        ? `Usar a ${entry.displayName}`
        : entry.id === "mao"
          ? "Usar a Mao"
          : `Usar ${entry.displayName}`;
    use.addEventListener("click", () => ctx.onUse());
    const test = document.createElement("button");
    test.type = "button";
    test.className = "aparencia-btn";
    test.textContent = "Testar 10 s";
    test.addEventListener("click", () => ctx.onTest());
    btnRow.append(use, test);
    prev.appendChild(btnRow);
    return prev;
  }

  private static overlay(ctx: AparenciaViewCtx): HTMLElement {
    const box = document.createElement("div");
    box.className = "aparencia-overlay";
    const entry = Catalog.getById(ctx.state.downloadId ?? ctx.state.selectedId);
    if (ctx.state.phase === "baixando") {
      box.appendChild(document.createTextNode("Baixando "));
      const b = document.createElement("b");
      b.textContent = entry?.displayName ?? "";
      box.appendChild(b);
      const pg = document.createElement("div");
      pg.className = "aparencia-pg";
      const i = document.createElement("i");
      const pct =
        ctx.state.progressTotal > 0
          ? (ctx.state.progressReceived / ctx.state.progressTotal) * 100
          : 40;
      i.style.width = `${Math.min(100, pct)}%`;
      pg.appendChild(i);
      box.appendChild(pg);
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "aparencia-btn";
      cancel.textContent = "Cancelar";
      cancel.addEventListener("click", () => ctx.onCancel());
      box.appendChild(cancel);
    } else if (ctx.state.phase === "falha") {
      const p = document.createElement("div");
      p.className = "aparencia-fail";
      p.textContent = `Não deu para baixar a ${ctx.state.failName ?? entry?.displayName ?? "modelo"}.`;
      box.appendChild(p);
      const row = document.createElement("div");
      row.className = "aparencia-btn-row";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "aparencia-btn pri";
      retry.textContent = "Tentar de novo";
      retry.addEventListener("click", () => ctx.onRetry());
      const reason = document.createElement("button");
      reason.type = "button";
      reason.className = "aparencia-btn";
      reason.textContent = "Ver o motivo";
      reason.addEventListener("click", () => ctx.onShowReason());
      row.append(retry, reason);
      box.appendChild(row);
    } else if (ctx.state.phase === "licenca") {
      box.appendChild(
        document.createTextNode(
          "Jin e Tsumiki: sem uso comercial nem alteração. Miku, Unity-chan e Zundamon: termos do dono do personagem.",
        ),
      );
      const link = document.createElement("a");
      link.href = LICENSE_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Termos oficiais da Live2D";
      link.style.display = "block";
      link.style.marginTop = "8px";
      box.appendChild(link);
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "aparencia-btn pri";
      ok.style.marginTop = "10px";
      ok.textContent = "Baixar mesmo assim";
      ok.addEventListener("click", () => ctx.onAcceptLicense());
      box.appendChild(ok);
    }
    return box;
  }
}