import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { type Source } from "../core/model";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const documents = new Map<string, Promise<pdfjs.PDFDocumentProxy>>();
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
    document = localPdf(source.bytes.slice());
    documents.set(source.id, document);
  }
  return document;
}
export function releaseViewers(sourceIds: string[]) {
  for (const [id, pdf] of documents) {
    if (!sourceIds.includes(id)) {
      pdf
        .then((document) => document.destroy())
        .catch((error: Error) => console.error(error.message));
      documents.delete(id);
    }
  }
}
