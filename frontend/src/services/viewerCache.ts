import { type PDFDocumentProxy } from "pdfjs-dist";
// Cache ownership and release do not require loading the rendering engine.
const documents = new Map<string, Promise<PDFDocumentProxy>>();
export function cachedDocument(id: string, load: () => Promise<PDFDocumentProxy>) {
  let pdf = documents.get(id);
  if (!pdf) {
    pdf = load();
    documents.set(id, pdf);
  }
  return pdf;
}
export type AdjustedView = { pdf: Promise<PDFDocumentProxy>; users: number; evicted: boolean };
export const adjusted = new Map<string, AdjustedView>();
export function releaseViewers(sourceIds: string[]) {
  for (const [key, entry] of adjusted) {
    if (!sourceIds.some((id) => key.startsWith(id + ":"))) {
      evict(entry);
      adjusted.delete(key);
    }
  }
  for (const [id, pdf] of documents) {
    if (!sourceIds.includes(id)) {
      pdf
        .then((document) => document.destroy())
        .catch((error: Error) => console.error(error.message));
      documents.delete(id);
    }
  }
}
export function evict(view: AdjustedView) {
  view.evicted = true;
  // Mounted canvases/text layers and OCR own leases. Destruction waits for them.
  if (!view.users) view.pdf.then((document) => document.destroy()).catch(() => {});
}
export function trimAdjusted() {
  while (adjusted.size > 8) {
    const oldest = adjusted.keys().next().value!;
    const released = adjusted.get(oldest)!;
    adjusted.delete(oldest);
    evict(released);
  }
}
export function releaseSources(ids: string[]) {
  for (const id of ids) {
    const pdf = documents.get(id);
    documents.delete(id);
    pdf?.then((document) => document.destroy()).catch(() => {});
    for (const [key, adjustment] of adjusted)
      if (key.startsWith(id + ":")) {
        adjusted.delete(key);
        evict(adjustment);
      }
  }
}
