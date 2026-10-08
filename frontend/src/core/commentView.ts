import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { annotationType } from "./importComments";

// Only the rendering copy changes. Notes are drawn by the interactive marker
// layer; all other source markup appearances continue to be rendered by PDF.js.
export async function commentView(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  let changed = false;
  for (const page of pdf.getPages()) {
    const annots = page.node.Annots();
    if (!annots) continue;
    for (let index = annots.size() - 1; index >= 0; index--) {
      const dict = annots.lookup(index, PDFDict);
      const type = annotationType(dict);
      const parent = dict.lookupMaybe(PDFName.of("Parent"), PDFDict);
      if (type === "Text" || (type === "Popup" && parent && annotationType(parent) === "Text")) {
        annots.remove(index);
        changed = true;
      }
    }
  }
  return changed ? pdf.save({ updateFieldAppearances: false }) : bytes;
}
