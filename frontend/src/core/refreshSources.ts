import { importPdf } from "./importPdf";
import { fieldKey, type Source, type Page, type PdfComment } from "./model";
import { duplicateComments } from "./comments";

// Source-derived descriptors are regenerated when opening archives and older
// drafts. Stored page IDs, object PDF coordinates and edited values stay intact.
export async function refreshSources(
  stored: Pick<Source, "id" | "name" | "bytes" | "decryptedBytes" | "encryption">[],
  pages: (Omit<Page, "comments"> & { comments?: PdfComment[] })[]
) {
  const sources: Source[] = [],
    boxes = new Map<string, Page[]>();
  for (const item of stored) {
    const imported = await importPdf(item.decryptedBytes ?? item.bytes, item.name);
    sources.push({
      ...imported.source,
      id: item.id,
      bytes: item.bytes,
      decryptedBytes: item.decryptedBytes ?? null,
      encryption: item.encryption ?? null,
      fields: imported.source.fields.map((field) => ({
        ...field,
        id: fieldKey(item.id, field.name),
      })),
    });
    boxes.set(item.id, imported.pages);
  }
  return {
    sources,
    pages: pages.map((page) => {
      const original = boxes.get(page.sourceId)?.[page.sourceIndex];
      if (page.comments && original) validateOriginalComments(page.comments, original.comments);
      return original
        ? {
            ...page,
            box: original.box,
            comments: page.comments ?? duplicateComments(original.comments),
          }
        : { ...page, comments: page.comments ?? [] };
    }),
  };
}
function validateOriginalComments(comments: PdfComment[], originals: PdfComment[]) {
  const byIndex = new Map(originals.map((comment) => [comment.annotationIndex, comment]));
  for (const comment of comments) {
    if (comment.annotationIndex === null) continue;
    const original = byIndex.get(comment.annotationIndex);
    if (!original) throw new Error("This project refers to a missing PDF comment.");
    if (original.readOnly && (!comment.readOnly || comment.text !== original.text))
      throw new Error("This project changes a read-only PDF comment.");
    if (
      [comment.x, comment.y, comment.width, comment.height, comment.author, comment.createdAt].some(
        (value, index) =>
          value !==
          [
            original.x,
            original.y,
            original.width,
            original.height,
            original.author,
            original.createdAt,
          ][index]
      )
    )
      throw new Error("This project changes unsupported source comment properties.");
  }
}
