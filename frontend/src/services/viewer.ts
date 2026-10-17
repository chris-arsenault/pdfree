import { failure } from "../i18n/messages";
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
import { cachedDocument, adjusted, trimAdjusted, evict } from "./viewerCache";
export { releaseViewers, releaseSources } from "./viewerCache";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
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
  return cachedDocument(source.id, () =>
    runPdfWorker<Uint8Array>({
      kind: "comment-view",
      bytes: sourceBytes(source).slice(),
    }).then(localPdf)
  );
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
export function viewedPage(document: EditorDocument, page: Page) {
  const source = document.sources.find((source) => source.id === page.sourceId);
  if (!source) throw failure("errors.sourcePage");
  return sourcePage(source, page, document.assets);
}
