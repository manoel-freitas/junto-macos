import type { CatalogEntry } from "./catalog";

export class UseInstalled {
  static shouldDownloadBeforeUse(
    entry: CatalogEntry,
    installedIds: ReadonlySet<string>,
  ): boolean {
    if (installedIds.has(entry.id)) return false;
    return entry.zipPath !== null;
  }
}