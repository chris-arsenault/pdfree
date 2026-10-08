import { importPdf } from "./importPdf";
import { fieldKey, type Source, type Page } from "./model";

// Source-derived descriptors are regenerated when opening archives and older
// drafts. Stored page IDs, object PDF coordinates and edited values stay intact.
export async function refreshSources(
  stored: Pick<Source, "id" | "name" | "bytes" | "decryptedBytes" | "encryption">[],
  pages: Page[]
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
      return original ? { ...page, box: original.box } : page;
    }),
  };
}
