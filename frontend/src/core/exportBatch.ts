import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";
import { type EditorDocument } from "./model";
import { type FontData } from "./drawObjects";
import { exportPdf } from "./exportPdf";
import { outputName } from "./pageRanges";

export function splitPageIds(document: EditorDocument, groups: number[][]) {
  if (!groups.length) throw new Error("Choose at least one split output.");
  return groups.map((group) => {
    if (!group.length) throw new Error("Each split output must contain at least one page.");
    if (new Set(group).size !== group.length)
      throw new Error("Choose each page only once per output.");
    return group.map((number) => {
      if (!Number.isInteger(number) || number < 1 || number > document.pages.length)
        throw new Error("A split page is outside the document.");
      return document.pages[number - 1].id;
    });
  });
}

export async function exportSplitArchive(
  document: EditorDocument,
  groups: number[][],
  name: string,
  flatten: boolean,
  fonts: FontData | null
) {
  const ids = splitPageIds(document, groups),
    sources = new Map<string, PDFDocument>(),
    files: Record<string, Uint8Array> = {};
  for (let index = 0; index < ids.length; index++)
    files[outputName(name, index)] = await exportPdf(document, flatten, ids[index], fonts, sources);
  return zipSync(files, { level: 0 });
}
