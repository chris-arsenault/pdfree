import { type EditorDocument } from "./model";
export function pruneNavigation(document: EditorDocument): EditorDocument {
  const ids = new Set(document.pages.map((page) => page.id));
  const bookmarks = (document.bookmarks ?? []).filter((bookmark) =>
    ids.has(bookmark.destination.pageId)
  );
  const retained = new Set(bookmarks.map((bookmark) => bookmark.id));
  return {
    ...document,
    bookmarks: bookmarks.map((bookmark) => ({
      ...bookmark,
      parentId: retained.has(bookmark.parentId ?? "") ? bookmark.parentId : null,
    })),
    rules: (document.rules ?? []).flatMap((rule) => {
      const pageIds = rule.pageIds.filter((id) => ids.has(id));
      return rule.pageIds.length && !pageIds.length ? [] : [{ ...rule, pageIds }];
    }),
    pages: document.pages,
  };
}
