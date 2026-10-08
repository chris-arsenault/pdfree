import { describe, expect, it } from "vitest";
import { emptyDocument, defaultObject, type EditorDocument, type Page } from "./model";
import {
  selectedPageIds,
  updatePlacedObject,
  hasPlacementAsset,
  canCopyObjects,
  copyObjects,
  pasteObjects,
  emptyClipboard,
} from "./editorOperations";

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
  const object = { ...defaultObject("text", { x: 10, y: 20 }), id: "text", text: "Original" };
  return {
    ...emptyDocument(),
    pages: [{ ...page("first"), objects: [object] }, page("second"), page("third")],
    assets: [{ id: "image", name: "Image", mime: "image/png", data: new Uint8Array([1, 2, 3]) }],
  };
}

describe("checkbox page selection", () => {
  it("uses current document order instead of checkbox click order", () =>
    expect(selectedPageIds(fixture(), ["third", "first"], "second")).toEqual(["first", "third"]));
  it("deduplicates repeated checkbox identities", () =>
    expect(selectedPageIds(fixture(), ["first", "first"], "second")).toEqual(["first"]));
  it("drops removed pages from a selection", () =>
    expect(selectedPageIds(fixture(), ["gone", "third"], "first")).toEqual(["third"]));
  it("falls back to the active page with no checkboxes", () =>
    expect(selectedPageIds(fixture(), [], "second")).toEqual(["second"]));
  it("falls back after every checked page is removed", () =>
    expect(selectedPageIds(fixture(), ["gone"], "third")).toEqual(["third"]));
  it("does not export an obsolete active page", () =>
    expect(selectedPageIds(fixture(), [], "gone")).toEqual([]));
  it("uses new page order after reordering", () => {
    const doc = fixture();
    doc.pages.reverse();
    expect(selectedPageIds(doc, ["first", "third"], "second")).toEqual(["third", "first"]);
  });
});

describe("object updates", () => {
  it("changes the targeted object without mutating the source snapshot", () => {
    const doc = fixture();
    const next = updatePlacedObject(doc, "text", { text: "Changed" });
    expect(next.pages[0].objects[0].text).toBe("Changed");
    expect(doc.pages[0].objects[0].text).toBe("Original");
  });
  it("preserves every untouched page identity", () => {
    const doc = fixture();
    const next = updatePlacedObject(doc, "text", { x: 22 });
    expect(next.pages[1]).toBe(doc.pages[1]);
    expect(next.pages[2]).toBe(doc.pages[2]);
  });
  it("preserves unrelated object identities on the edited page", () => {
    const doc = fixture();
    const other = defaultObject("check", { x: 0, y: 0 });
    doc.pages[0].objects.push(other);
    expect(updatePlacedObject(doc, "text", { text: "Changed" }).pages[0].objects[1]).toBe(other);
  });
  it("preserves immutable source and asset collections", () => {
    const doc = fixture();
    const next = updatePlacedObject(doc, "text", { opacity: 0.5 });
    expect(next.sources).toBe(doc.sources);
    expect(next.assets).toBe(doc.assets);
  });
  it("does not add history snapshots for an unchanged value", () => {
    const doc = fixture();
    expect(updatePlacedObject(doc, "text", { text: "Original" })).toBe(doc);
  });
  it("does not add history snapshots for an empty update", () => {
    const doc = fixture();
    expect(updatePlacedObject(doc, "text", {})).toBe(doc);
  });
  it("ignores object identities absent from the current document", () => {
    const doc = fixture();
    expect(updatePlacedObject(doc, "gone", { text: "Changed" })).toBe(doc);
  });
  it("applies geometry and appearance changes atomically", () => {
    const doc = fixture();
    const object = updatePlacedObject(doc, "text", { x: 42, width: 75, color: "#ff0000" }).pages[0]
      .objects[0];
    expect(object).toMatchObject({ x: 42, width: 75, color: "#ff0000", text: "Original" });
  });
});

describe("placement and copying boundaries", () => {
  it("rejects a missing placement asset", () =>
    expect(hasPlacementAsset(fixture(), { assetId: "gone" })).toBe(false));
  it("rejects an unprepared image", () => expect(hasPlacementAsset(fixture(), {})).toBe(false));
  it("accepts a placement asset in the current document", () =>
    expect(hasPlacementAsset(fixture(), { assetId: "image" })).toBe(true));
  it("preserves the browser copy command for selected PDF text", () =>
    expect(canCopyObjects(fixture().pages[0].objects, "PDF text")).toBe(false));
  it("does not intercept copy with no object selection", () =>
    expect(canCopyObjects([], "")).toBe(false));
  it("copies selected objects when no PDF text is selected", () =>
    expect(canCopyObjects(fixture().pages[0].objects, "")).toBe(true));
});

describe("object clipboard", () => {
  it("captures only selected objects from the specified page", () => {
    const doc = fixture();
    expect(copyObjects(doc, "first", ["text", "gone"]).objects).toEqual([doc.pages[0].objects[0]]);
  });
  it("does not copy an object from another page", () =>
    expect(copyObjects(fixture(), "second", ["text"]).objects).toEqual([]));
  it("keeps referenced image bytes in the clipboard", () => {
    const doc = fixture();
    doc.pages[0].objects[0] = { ...doc.pages[0].objects[0], kind: "image", assetId: "image" };
    expect(copyObjects(doc, "first", ["text"]).assets).toEqual(doc.assets);
  });
  it("does not retain unrelated images when copying text", () =>
    expect(copyObjects(fixture(), "first", ["text"]).assets).toEqual([]));
  it("creates fresh object identities and offsets pasted geometry", () => {
    const doc = fixture();
    const result = pasteObjects(doc, "second", copyObjects(doc, "first", ["text"]));
    const pasted = result.document.pages[1].objects[0];
    expect(pasted.id).not.toBe("text");
    expect(pasted).toMatchObject({ x: 22, y: 8, text: "Original" });
    expect(result.ids).toEqual([pasted.id]);
  });
  it("restores an image asset removed by undo before pasting", () => {
    const doc = fixture();
    doc.pages[0].objects[0] = { ...doc.pages[0].objects[0], kind: "image", assetId: "image" };
    const copied = copyObjects(doc, "first", ["text"]);
    const result = pasteObjects({ ...doc, assets: [] }, "second", copied);
    expect(result.document.assets).toEqual(doc.assets);
    expect(result.document.pages[1].objects[0].assetId).toBe("image");
  });
  it("deduplicates an image already present in the target document", () => {
    const doc = fixture();
    doc.pages[0].objects[0] = { ...doc.pages[0].objects[0], kind: "image", assetId: "image" };
    expect(
      pasteObjects(doc, "second", copyObjects(doc, "first", ["text"])).document.assets
    ).toHaveLength(1);
  });
  it("gives pasted authored fields independent names", () => {
    const doc = fixture();
    doc.pages[0].objects[0] = {
      ...doc.pages[0].objects[0],
      kind: "field",
      fieldName: "First name",
    };
    const result = pasteObjects(doc, "second", copyObjects(doc, "first", ["text"]));
    expect(result.document.pages[1].objects[0].fieldName).toMatch(/^First name_/);
  });
  it("does not alter normal object field-name metadata", () => {
    const doc = fixture();
    expect(
      pasteObjects(doc, "second", copyObjects(doc, "first", ["text"])).document.pages[1].objects[0]
        .fieldName
    ).toBe("");
  });
  it("preserves untouched page identities when pasting", () => {
    const doc = fixture();
    const result = pasteObjects(doc, "second", copyObjects(doc, "first", ["text"]));
    expect(result.document.pages[0]).toBe(doc.pages[0]);
    expect(result.document.pages[2]).toBe(doc.pages[2]);
  });
  it("does not mutate the source page when pasting", () => {
    const doc = fixture();
    pasteObjects(doc, "second", copyObjects(doc, "first", ["text"]));
    expect(doc.pages[1].objects).toEqual([]);
  });
  it("ignores a destination removed after copying", () => {
    const doc = fixture();
    expect(pasteObjects(doc, "gone", copyObjects(doc, "first", ["text"]))).toEqual({
      document: doc,
      ids: [],
    });
  });
  it("ignores an empty clipboard", () => {
    const doc = fixture();
    expect(pasteObjects(doc, "first", emptyClipboard())).toEqual({ document: doc, ids: [] });
  });
});
