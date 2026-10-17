import { type EditorDocument } from "../core/model";
import { runPdfWorker } from "./workerClient";
import { fontData, documentFontOptions } from "./resources";

export async function createSplitArchive(
  document: EditorDocument,
  groups: number[][],
  name: string,
  flatten: boolean
) {
  const selected = new Set(groups.flat());
  const pageIds = document.pages
    .filter((_, index) => selected.has(index + 1))
    .map((page) => page.id);
  return runPdfWorker<Uint8Array>({
    kind: "split",
    document,
    groups,
    name,
    flatten,
    fonts: await fontData(documentFontOptions(document, pageIds)),
  });
}
