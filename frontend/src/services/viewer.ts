import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  type Source,
  type Page,
  type Asset,
  type EditorDocument,
  sourceBytes,
} from "../core/model";
import { runPdfWorker } from "./workerClient";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const documents = new Map<string, Promise<pdfjs.PDFDocumentProxy>>();
type AdjustedView = { pdf: Promise<pdfjs.PDFDocumentProxy>; users: number; evicted: boolean };
const adjusted = new Map<string, AdjustedView>();
export function localPdf(bytes: Uint8Array) {
  const base = `${import.meta.env.BASE_URL}pdfjs/`;
  return pdfjs.getDocument({
    data: bytes,
    useSystemFonts: false,
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
    wasmUrl: `${base}wasm/`,
    iccUrl: `${base}iccs/`,
  }).promise;
}
export function sourcePdf(source: Source) {
  let document = documents.get(source.id);
  if (!document) {
    document = runPdfWorker<Uint8Array>({
      kind: "comment-view",
      bytes: sourceBytes(source).slice(),
    }).then(localPdf);
    documents.set(source.id, document);
  }
  return document;
}
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
export async function sourcePage(source: Source, page: Page, assets: Asset[] = []) {
  const original = await (await sourcePdf(source)).getPage(page.sourceIndex + 1);
  const [left, bottom, right, top] = original.view;
  if (
    !page.scan &&
    page.box.x === left &&
    page.box.y === bottom &&
    page.box.width === right - left &&
    page.box.height === top - bottom
  )
    return { page: original, release: () => {} };
  const key = `${source.id}:${page.id}:${JSON.stringify([page.box, page.scan])}`;
  let entry = adjusted.get(key);
  if (!entry) {
    const pdf = runPdfWorker<Uint8Array>({
      kind: "page-view",
      bytes: sourceBytes(source).slice(),
      page,
      assets,
    }).then(localPdf);
    entry = { pdf, users: 0, evicted: false };
    adjusted.set(key, entry);
  }
  const view = entry;
  view.users++;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    view.users--;
    if (view.evicted) evict(view);
  };
  trimAdjusted();
  try {
    return { page: await (await view.pdf).getPage(page.sourceIndex + 1), release };
  } catch (error) {
    release();
    throw error;
  }
}
function evict(view: AdjustedView) {
  view.evicted = true;
  // Mounted canvases/text layers and OCR own leases. Eviction removes cache
  // membership immediately, but destruction waits for the last owner to finish.
  if (!view.users) view.pdf.then((document) => document.destroy()).catch(() => {});
}
function trimAdjusted() {
  while (adjusted.size > 8) {
    const oldest = adjusted.keys().next().value!;
    const released = adjusted.get(oldest)!;
    adjusted.delete(oldest);
    evict(released);
  }
}
export function viewedPage(document: EditorDocument, page: Page) {
  const source = document.sources.find((source) => source.id === page.sourceId);
  if (!source) throw new Error("Missing source page.");
  return sourcePage(source, page, document.assets);
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
