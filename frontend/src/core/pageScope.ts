import { type EditorDocument } from "./model";
import { parsePageRange } from "./pageRanges";

export type PageScopeKind = "all" | "current" | "selected" | "range";
export type PageScope = { kind: PageScopeKind; range: string };

/** Resolves a scope to page ids in document order; throws with a user message for invalid ranges. */
export function scopePageIds(
  document: EditorDocument,
  scope: PageScope,
  selectedIds: string[],
  activeId: string
) {
  const pages = document.pages;
  if (scope.kind === "all") return pages.map((page) => page.id);
  if (scope.kind === "current") return pages.some((page) => page.id === activeId) ? [activeId] : [];
  if (scope.kind === "selected")
    return pages.filter((page) => selectedIds.includes(page.id)).map((page) => page.id);
  if (!scope.range.trim()) throw new Error("Enter pages such as 1-3, 5.");
  const numbers = new Set(parsePageRange(scope.range, pages.length));
  return pages.filter((_, index) => numbers.has(index + 1)).map((page) => page.id);
}

/** Scope describing an existing thumbnail selection: none means current, every page means all. */
export function selectionScope(document: EditorDocument, selectedIds: string[]): PageScopeKind {
  const selected = document.pages.filter((page) => selectedIds.includes(page.id)).length;
  if (!selected) return "current";
  return selected === document.pages.length ? "all" : "selected";
}
