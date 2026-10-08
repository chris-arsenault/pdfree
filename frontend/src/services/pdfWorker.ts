import { importPdf } from "../core/importPdf";
import { exportPdf } from "../core/exportPdf";
import { type FontData } from "../core/drawObjects";
import { type EditorDocument } from "../core/model";
import { writeProject, readProject } from "../core/projects";
import { imagePdf } from "../core/imagePdf";
import { exportSplitArchive } from "../core/exportBatch";
import { commentView } from "../core/commentView";
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
  if (request.kind === "import") return importPdf(request.bytes, request.name);
  if (request.kind === "project-save") return writeProject(request.document);
  if (request.kind === "project-open") return readProject(request.bytes);
  if (request.kind === "comment-view") return commentView(request.bytes);
  if (request.kind === "image-pdf") return imagePdf(request.bytes, request.name, request.mime);
  if (request.kind === "split")
    return exportSplitArchive(
      request.document,
      request.groups,
      request.name,
      request.flatten,
      request.fonts
    );
  return exportPdf(request.document, request.flatten, request.pageIds, request.fonts);
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
