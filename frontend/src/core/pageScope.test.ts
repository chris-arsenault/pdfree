import { describe, expect, it } from "vitest";
import { emptyDocument, type EditorDocument, type Page } from "./model";
import { scopePageIds, selectionScope } from "./pageScope";

function fixture(): EditorDocument {
  const page = (id: string): Page => ({
    id,
    sourceId: "source",
    sourceIndex: 0,
    comments: [],
    rotation: 0,
    box: { x: 0, y: 0, width: 600, height: 800 },
    objects: [],
  });
  return { ...emptyDocument(), pages: ["a", "b", "c", "d"].map(page) };
}

describe("page scope", () => {
  const document = fixture();
  it("resolves every scope kind in document order", () => {
    const resolve = (kind: "all" | "current" | "selected" | "range", range = "") =>
      scopePageIds(document, { kind, range }, ["d", "b"], "c");
    expect(resolve("all")).toEqual(["a", "b", "c", "d"]);
    expect(resolve("current")).toEqual(["c"]);
    expect(resolve("selected")).toEqual(["b", "d"]);
    expect(resolve("range", "4, 1-2")).toEqual(["a", "b", "d"]);
  });
  it("rejects empty and out-of-bounds ranges with user messages", () => {
    expect(() => scopePageIds(document, { kind: "range", range: " " }, [], "a")).toThrow(
      "Enter pages"
    );
    expect(() => scopePageIds(document, { kind: "range", range: "9" }, [], "a")).toThrow(
      "between 1 and 4"
    );
  });
  it("describes a thumbnail selection as current, selected or all pages", () => {
    expect(selectionScope(document, [])).toBe("current");
    expect(selectionScope(document, ["b", "missing"])).toBe("selected");
    expect(selectionScope(document, ["a", "b", "c", "d"])).toBe("all");
  });
});
