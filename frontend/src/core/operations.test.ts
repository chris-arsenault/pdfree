import { describe, expect, it } from "vitest";
import { toDisplay, toPdf } from "./coordinates";
import { parsePageRange, splitGroups } from "./pageRanges";
import { type Page, emptyDocument } from "./model";
import { historyReducer } from "./history";
import { defaultObject } from "./model";
import { resizeObject } from "./resizeObject";

describe("coordinates", () => {
  for (const rotation of [0, 90, 180, 270])
    it(`round trips a cropped page at ${rotation} degrees`, () => {
      const page: Page = {
        id: "p",
        sourceId: "s",
        sourceIndex: 0,
        comments: [],
        rotation,
        box: { x: 12, y: 30, width: 500, height: 700 },
        objects: [],
      };
      const original = { x: 84, y: 123 };
      expect(toPdf(toDisplay(original, page), page)).toEqual(original);
    });
});
it("resizes a rotated object with its displayed top-left anchor fixed", () => {
  const object = {
    ...defaultObject("text", { x: 100, y: 200 }),
    rotation: 90,
    width: 100,
    height: 50,
  };
  const resized = resizeObject(object, 10, 20, false);
  expect(resized.width).toBe(120);
  expect(resized.height).toBe(60);
  expect(resized.x - resized.height).toBeCloseTo(object.x - object.height);
  expect(resized.y).toBeCloseTo(object.y);
});
describe("page selection", () => {
  it("splits after physical pages 3 and 7", () =>
    expect(splitGroups("after", "3,7", 10)).toEqual([
      [1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10],
    ]));
  it("supports explicit output ranges and odd pages", () => {
    expect(splitGroups("ranges", "1-3;5-end", 7)).toEqual([
      [1, 2, 3],
      [5, 6, 7],
    ]);
    expect(parsePageRange("odd", 6)).toEqual([1, 3, 5]);
  });
  it("rejects reversed, empty, duplicate and out of bounds ranges", () => {
    for (const range of ["3-1", "", "1-3,2", "0", "8"])
      expect(() => parsePageRange(range, 7)).toThrow();
  });
  it("rejects fractional chunk sizes", () =>
    expect(() => splitGroups("every", "2.5", 7)).toThrow());
});
it("undo and redo preserve source document state and clear redo after a new change", () => {
  const initial = { past: [], present: emptyDocument(), future: [], revision: 0 };
  const edited = { ...initial.present, name: "Edited.pdf" };
  const next = historyReducer(initial, { type: "commit", document: edited });
  const undone = historyReducer(next, { type: "undo" });
  expect(undone.present.name).toBe("Untitled.pdf");
  expect(historyReducer(undone, { type: "redo" }).present).toBe(edited);
  expect(
    historyReducer(undone, { type: "commit", document: { ...edited, name: "Other.pdf" } }).future
  ).toHaveLength(0);
});
