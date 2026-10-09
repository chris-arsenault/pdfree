import { importPdf } from "../core/importPdf";
import { exportPdf } from "../core/exportPdf";
import { type FontData } from "../core/drawObjects";
import { type EditorDocument } from "../core/model";
import { writeProject, readProject } from "../core/projects";
import { imagePdf } from "../core/imagePdf";
import { exportSplitArchive } from "../core/exportBatch";
import { commentView } from "../core/commentView";
import { PDFDocument } from "pdf-lib";
import { applyScan, cleanupPages, scanSupport, type PageCleanup } from "../core/scanCleanup";
import { compressPdf, type CompressionOptions } from "../core/compressPdf";
import { type Page, type Asset, emptyDocument } from "../core/model";
import { nupPdf, type NupOptions } from "../core/nupPdf";
export type WorkerRequest =
  | { id: string; kind: "import"; bytes: Uint8Array; name: string }
  | {
      id: string;
      kind: "export";
      document: EditorDocument;
      flatten: boolean;
      pageIds: string[];
      fonts: FontData;
    }
  | { id: string; kind: "project-save"; document: EditorDocument }
  | { id: string; kind: "project-open"; bytes: Uint8Array }
  | { id: string; kind: "comment-view"; bytes: Uint8Array }
  | { id: string; kind: "page-view"; bytes: Uint8Array; page: Page; assets: Asset[] }
  | { id: string; kind: "compress"; bytes: Uint8Array; options: CompressionOptions }
  | { id: string; kind: "nup"; bytes: Uint8Array; options: NupOptions }
  | {
      id: string;
      kind: "cleanup";
      document: EditorDocument;
      pages: PageCleanup[];
    }
  | { id: string; kind: "scan-support"; document: EditorDocument; pageIds: string[] }
  | { id: string; kind: "image-pdf"; bytes: Uint8Array; name: string; mime: string }
  | {
      id: string;
      kind: "split";
      document: EditorDocument;
      groups: number[][];
      name: string;
      flatten: boolean;
      fonts: FontData;
    };

function processRequest(request: WorkerRequest) {
  const progress = (message: string) => self.postMessage({ id: request.id, progress: message });
  if (request.kind === "import") return importPdf(request.bytes, request.name);
  if (request.kind === "project-save") return writeProject(request.document);
  if (request.kind === "project-open") return readProject(request.bytes);
  if (request.kind === "comment-view") return commentView(request.bytes);
  if (["page-view", "compress", "nup", "cleanup", "scan-support"].includes(request.kind))
    return processUtility(request, progress);
  if (request.kind === "image-pdf") return imagePdf(request.bytes, request.name, request.mime);
  if (request.kind === "split")
    return exportSplitArchive(
      request.document,
      request.groups,
      request.name,
      request.flatten,
      request.fonts
    );
  if (request.kind === "export")
    return exportPdf(request.document, request.flatten, request.pageIds, request.fonts);
  throw new Error("Unknown PDF request.");
}
function processUtility(request: WorkerRequest, progress: (message: string) => void) {
  if (request.kind === "page-view") return pageView(request);
  if (request.kind === "compress") return compressPdf(request.bytes, request.options, progress);
  if (request.kind === "nup") return nupPdf(request.bytes, request.options);
  if (request.kind === "cleanup") return cleanupPages(request.document, request.pages, progress);
  if (request.kind === "scan-support") return scanSupport(request.document, request.pageIds);
  throw new Error("Unknown utility request.");
}

async function pageView(request: Extract<WorkerRequest, { kind: "page-view" }>) {
  const pdf = await PDFDocument.load(await commentView(request.bytes));
  const page = request.page;
  await applyScan(pdf, page.sourceIndex, page, { ...emptyDocument(), assets: request.assets });
  pdf.getPage(page.sourceIndex).setCropBox(page.box.x, page.box.y, page.box.width, page.box.height);
  return pdf.save();
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const result = await processRequest(request);
    if (result instanceof Uint8Array)
      self.postMessage({ id: request.id, result }, { transfer: [result.buffer] });
    else self.postMessage({ id: request.id, result });
  } catch (error) {
    self.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : "PDF processing failed.",
    });
  }
};
