import { importPdf } from "./importPdf";
import {
  fieldKey,
  type Source,
  type Page,
  type PdfComment,
  type Bookmark,
  type Destination,
} from "./model";
import { duplicateComments } from "./comments";

// Source-derived descriptors are regenerated when opening archives and older
// drafts. Stored page IDs, object PDF coordinates and edited values stay intact.
export async function refreshSources(
  stored: Pick<Source, "id" | "name" | "bytes" | "decryptedBytes" | "encryption">[],
  pages: (Omit<Page, "comments"> & { comments?: PdfComment[] })[],
  preserveGeometry = true
) {
  const sources: Source[] = [],
    boxes = new Map<string, Page[]>();
  const bookmarks: Bookmark[] = [];
  const remap = (destination: Destination, sourceId: string, imported: Page[]) => {
    const index = imported.find((page) => page.id === destination.pageId)?.sourceIndex;
    const target = pages.find((page) => page.sourceId === sourceId && page.sourceIndex === index);
    return target ? { ...destination, pageId: target.id } : null;
  };
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
    for (const bookmark of imported.bookmarks) {
      const destination = remap(bookmark.destination, item.id, imported.pages);
      if (destination) bookmarks.push({ ...bookmark, destination });
    }
  }
  return {
    sources,
    bookmarks: bookmarks.map((bookmark) => ({
      ...bookmark,
      parentId: bookmarks.some((item) => item.id === bookmark.parentId) ? bookmark.parentId : null,
    })),
    pages: pages.map((page) => {
      const original = boxes.get(page.sourceId)?.[page.sourceIndex];
      if (original) validateOriginalPage(page, original);
      return original
        ? {
            ...page,
            box: preserveGeometry ? page.box : original.box,
            comments: page.comments ?? duplicateComments(original.comments),
            links:
              page.links ??
              (original.links ?? []).flatMap((link) => {
                const destination = remap(
                  link.destination,
                  page.sourceId,
                  boxes.get(page.sourceId)!
                );
                return [{ ...link, destination: destination ?? link.destination }];
              }),
          }
        : { ...page, comments: page.comments ?? [] };
    }),
  };
}
function validateOriginalPage(
  page: { comments?: PdfComment[]; links?: Page["links"] },
  original: Page
) {
  if (page.comments) validateOriginalComments(page.comments, original.comments);
  if (
    page.links?.some(
      (link) => !original.links?.some((item) => item.annotationIndex === link.annotationIndex)
    )
  )
    throw new Error("This project refers to an unsupported source link.");
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
