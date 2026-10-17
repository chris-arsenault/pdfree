import { failure } from "../i18n/messages";
import { type EditorDocument, type PdfComment, type Point, type Page, newId } from "./model";
import { toDisplay, toPdf } from "./coordinates";

export function createComment(
  point: Point,
  text: string,
  author: string,
  parentId: string | null = null
): PdfComment {
  if (!text.trim()) throw failure("errors.commentRequired");
  if (text.length > 100_000 || author.length > 200) throw failure("errors.commentLength");
  const now = new Date().toISOString();
  return {
    ...point,
    width: 24,
    height: 24,
    id: newId(),
    annotationIndex: null,
    parentId,
    text,
    author: author.trim(),
    createdAt: now,
    modifiedAt: now,
    readOnly: false,
  };
}

export function commentPointAt(point: Point, page: Page): Point {
  const display = toDisplay(point, page);
  const opposite = toPdf({ x: display.x + 24, y: display.y + 24 }, page);
  return {
    x: Math.max(
      page.box.x,
      Math.min(Math.min(point.x, opposite.x), page.box.x + page.box.width - 24)
    ),
    y: Math.max(
      page.box.y,
      Math.min(Math.min(point.y, opposite.y), page.box.y + page.box.height - 24)
    ),
  };
}

export function addComment(document: EditorDocument, pageId: string, comment: PdfComment) {
  const page = document.pages.find((item) => item.id === pageId);
  if (!page) throw failure("errors.commentPageMissing");
  if ((page.comments?.length ?? 0) >= 10_000) throw failure("errors.commentLimit");
  if (comment.parentId && !page.comments?.some((item) => item.id === comment.parentId))
    throw failure("errors.commentThreadMissing");
  return {
    ...document,
    pages: document.pages.map((item) =>
      item.id === pageId ? { ...item, comments: [...(item.comments ?? []), comment] } : item
    ),
  };
}

export function editComment(document: EditorDocument, pageId: string, id: string, text: string) {
  if (!text.trim() || text.length > 100_000) throw failure("errors.commentTextLimit");
  return {
    ...document,
    pages: document.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            comments: page.comments?.map((comment) =>
              comment.id === id && !comment.readOnly
                ? { ...comment, text, modifiedAt: new Date().toISOString() }
                : comment
            ),
          }
        : page
    ),
  };
}

export function removeComment(document: EditorDocument, pageId: string, id: string) {
  return {
    ...document,
    pages: document.pages.map((page) => {
      if (page.id !== pageId || page.comments?.find((item) => item.id === id)?.readOnly)
        return page;
      const removed = commentThread(page.comments, id);
      if (page.comments?.some((item) => item.readOnly && removed.has(item.id)))
        throw failure("errors.commentReadOnlyThread");
      return { ...page, comments: page.comments?.filter((item) => !removed.has(item.id)) };
    }),
  };
}

export function duplicateComments(comments: PdfComment[] = []) {
  const ids = new Map(comments.map((comment) => [comment.id, newId()]));
  return comments.map((comment) => ({
    ...comment,
    id: ids.get(comment.id)!,
    parentId: comment.parentId ? (ids.get(comment.parentId) ?? null) : null,
  }));
}

export function commentThread(comments: PdfComment[], id: string) {
  const members = new Set([id]);
  const children = new Map<string, string[]>();
  for (const comment of comments) {
    if (comment.parentId)
      children.set(comment.parentId, [...(children.get(comment.parentId) ?? []), comment.id]);
  }
  const pending = [id];
  for (let next = pending.pop(); next; next = pending.pop()) {
    for (const child of children.get(next) ?? []) {
      if (members.has(child)) continue;
      members.add(child);
      pending.push(child);
    }
  }
  return members;
}

export function validateCommentThreads(comments: PdfComment[]) {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const checked = new Set<string>();
  for (const comment of comments) {
    const seen = new Set<string>();
    let next: string | null = comment.id;
    while (next && !checked.has(next)) {
      if (seen.has(next)) throw failure("errors.commentCircular");
      const item = byId.get(next);
      if (!item) throw failure("errors.commentMissingThread");
      seen.add(next);
      next = item.parentId;
    }
    for (const id of seen) checked.add(id);
  }
}
