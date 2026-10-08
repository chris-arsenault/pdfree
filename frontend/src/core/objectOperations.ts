import { type EditorDocument, type Page, type PlacedObject, newId } from "./model";
export function replaceObjects(document: EditorDocument, pageId: string, objects: PlacedObject[]) {
  return {
    ...document,
    pages: document.pages.map((page) => (page.id === pageId ? { ...page, objects } : page)),
  };
}
export function removeObjects(document: EditorDocument, page: Page, ids: string[]) {
  return replaceObjects(
    document,
    page.id,
    page.objects.filter((object) => !ids.includes(object.id))
  );
}
export function duplicateObjects(document: EditorDocument, page: Page, ids: string[]) {
  const copies = page.objects
    .filter((object) => ids.includes(object.id))
    .map((object) => ({
      ...object,
      id: newId(),
      x: object.x + 12,
      y: object.y - 12,
      fieldName:
        object.kind === "field"
          ? `${object.fieldName}_copy_${newId().slice(0, 6)}`
          : object.fieldName,
    }));
  return {
    document: replaceObjects(document, page.id, [...page.objects, ...copies]),
    ids: copies.map((object) => object.id),
  };
}
export function moveObjects(
  document: EditorDocument,
  page: Page,
  ids: string[],
  dx: number,
  dy: number
) {
  return replaceObjects(
    document,
    page.id,
    page.objects.map((object) =>
      ids.includes(object.id) ? { ...object, x: object.x + dx, y: object.y + dy } : object
    )
  );
}
export function alignObjects(document: EditorDocument, page: Page, ids: string[], axis: "x" | "y") {
  const selected = page.objects.filter((object) => ids.includes(object.id));
  if (!selected.length) return document;
  const target = Math.min(...selected.map((object) => object[axis]));
  return replaceObjects(
    document,
    page.id,
    page.objects.map((object) => (ids.includes(object.id) ? { ...object, [axis]: target } : object))
  );
}
export function snapPoint(object: PlacedObject, others: PlacedObject[], tolerance: number) {
  let x = object.x,
    y = object.y;
  for (const other of others) {
    if (Math.abs(other.x - x) < tolerance) x = other.x;
    if (Math.abs(other.y - y) < tolerance) y = other.y;
  }
  return { ...object, x, y };
}
