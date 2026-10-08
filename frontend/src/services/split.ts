import { type EditorDocument } from "../core/model";
import { runPdfWorker } from "./workerClient";
import { fontData } from "./resources";

export async function createSplitArchive(
  document: EditorDocument,
  groups: number[][],
  name: string,
  flatten: boolean
) {
  return runPdfWorker<Uint8Array>({
    kind: "split",
    document,
    groups,
    name,
    flatten,
    fonts: await fontData(),
  });
}
