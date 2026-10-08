import { type Asset, type EditorDocument, type PlacedObject, newId } from "./model";
import { replaceObjects } from "./objectOperations";

export function selectedPageIds(document: EditorDocument, ids: string[], activeId: string) {
  const selected = document.pages.filter((page) => ids.includes(page.id)).map((page) => page.id);
  if (selected.length) return selected;
  return document.pages.some((page) => page.id === activeId) ? [activeId] : [];
}

export function updatePlacedObject(
  document: EditorDocument,
  id: string,
  change: Partial<PlacedObject>
) {
  let changed = false;
  const pages = document.pages.map((page) => {
    const index = page.objects.findIndex((object) => object.id === id);
    if (index < 0) return page;
    const original = page.objects[index];
    if (
      Object.entries(change).every(([key, value]) => original[key as keyof PlacedObject] === value)
    )
      return page;
    changed = true;
    const objects = [...page.objects];
    objects[index] = { ...original, ...change };
    return { ...page, objects };
  });
  return changed ? { ...document, pages } : document;
}

export function hasPlacementAsset(document: EditorDocument, pending: Partial<PlacedObject>) {
  return Boolean(pending.assetId && document.assets.some((asset) => asset.id === pending.assetId));
}

export function canCopyObjects(objects: PlacedObject[], selectedText: string) {
  return !selectedText && objects.length > 0;
}

export type ObjectClipboard = { objects: PlacedObject[]; assets: Asset[] };
export const emptyClipboard = (): ObjectClipboard => ({ objects: [], assets: [] });
export function copyObjects(document: EditorDocument, pageId: string, ids: string[]) {
  const objects =
    document.pages
      .find((page) => page.id === pageId)
      ?.objects.filter((object) => ids.includes(object.id)) ?? [];
  const assets = document.assets.filter((asset) =>
    objects.some((object) => object.assetId === asset.id)
  );
  return { objects, assets };
}
export function pasteObjects(document: EditorDocument, pageId: string, clipboard: ObjectClipboard) {
  const page = document.pages.find((item) => item.id === pageId);
  if (!page || !clipboard.objects.length) return { document, ids: [] };
  const copies = clipboard.objects.map((object) => ({
    ...object,
    id: newId(),
    x: object.x + 12,
    y: object.y - 12,
    fieldName:
      object.kind === "field" ? `${object.fieldName}_${newId().slice(0, 6)}` : object.fieldName,
  }));
  const assets = [
    ...document.assets,
    ...clipboard.assets.filter((asset) => !document.assets.some((item) => item.id === asset.id)),
  ];
  return {
    document: replaceObjects({ ...document, assets }, pageId, [...page.objects, ...copies]),
    ids: copies.map((object) => object.id),
  };
}
