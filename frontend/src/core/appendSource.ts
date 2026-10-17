import { fieldKey, type EditorDocument } from "./model";
import { type importPdf } from "./importPdf";
export function appendSource(
  document: EditorDocument,
  imported: Awaited<ReturnType<typeof importPdf>>
): EditorDocument {
  const values = { ...document.values };
  for (const field of imported.source.fields)
    values[fieldKey(imported.source.id, field.name)] = field.value;
  return {
    ...document,
    name: document.pages.length ? document.name : imported.source.name,
    sources: [...document.sources, imported.source],
    pages: [...document.pages, ...imported.pages],
    values,
    bookmarks: [...(document.bookmarks ?? []), ...(imported.bookmarks ?? [])],
  };
}
