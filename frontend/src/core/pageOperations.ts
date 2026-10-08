import { newId, type EditorDocument, type Page } from "./model";
import { duplicateComments } from "./comments";
import { pruneNavigation } from "./bookmarks";

export function rotatePages(document: EditorDocument, ids: string[], angle = 90) {
  return {
    ...document,
    pages: document.pages.map((page) =>
      ids.includes(page.id) ? { ...page, rotation: (page.rotation + angle + 360) % 360 } : page
    ),
  };
}
export function removePages(document: EditorDocument, ids: string[]) {
  const pages = document.pages.filter((page) => !ids.includes(page.id));
  if (!pages.length) throw new Error("Keep at least one page, or open a new document.");
  return pruneNavigation({ ...document, pages });
}
export function duplicatePages(document: EditorDocument, ids: string[]) {
  const copies = new Map<string, string>();
  ids.forEach((id) => copies.set(id, newId()));
  return {
    ...document,
    rules: (document.rules ?? []).map((rule) => ({
      ...rule,
      pageIds: rule.pageIds.flatMap((id) => (copies.has(id) ? [id, copies.get(id)!] : [id])),
    })),
    pages: document.pages.flatMap((page) =>
      ids.includes(page.id)
        ? [
            page,
            {
              ...page,
              id: copies.get(page.id)!,
              comments: duplicateComments(page.comments),
              objects: page.objects.map((object) => ({
                ...object,
                id: newId(),
                fieldName:
                  object.kind === "field"
                    ? `${object.fieldName}_copy_${newId().slice(0, 6)}`
                    : object.fieldName,
              })),
            },
          ]
        : [page]
    ),
  };
}
export function movePage(document: EditorDocument, id: string, targetIndex: number) {
  const pages = [...document.pages];
  const index = pages.findIndex((page) => page.id === id);
  if (index < 0) return document;
  const [page] = pages.splice(index, 1);
  pages.splice(Math.max(0, Math.min(targetIndex, pages.length)), 0, page);
  return { ...document, pages };
}
export function insertBlank(document: EditorDocument, afterId: string) {
  const index = document.pages.findIndex((page) => page.id === afterId);
  const box = document.pages[index]?.box ?? { x: 0, y: 0, width: 612, height: 792 };
  const page: Page = {
    id: newId(),
    sourceId: "",
    sourceIndex: 0,
    rotation: 0,
    box: { ...box, x: 0, y: 0 },
    objects: [],
    comments: [],
    recognition: null,
    scan: null,
    links: [],
  };
  const pages = [...document.pages];
  pages.splice(index + 1, 0, page);
  return { ...document, pages };
}
