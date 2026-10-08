import { describe, expect, it } from "vitest";
import { type Page, emptyDocument, defaultObject } from "./model";
import { historyReducer, type History } from "./history";
import { toDisplay, toPdf, displaySize } from "./coordinates";
import { parsePageRange, splitGroups, outputName } from "./pageRanges";
import { duplicateObjects, moveObjects, removeObjects, alignObjects } from "./objectOperations";

function page(rotation = 0): Page {
  return {
    id: "page",
    sourceId: "",
    sourceIndex: 0,
    rotation,
    box: { x: 20, y: 30, width: 200, height: 300 },
    objects: [],
  };
}
describe("PDF coordinate contracts", () => {
  it.each([
    [0, { x: 20, y: 330 }, { x: 0, y: 0 }],
    [0, { x: 220, y: 30 }, { x: 200, y: 300 }],
    [90, { x: 20, y: 30 }, { x: 0, y: 0 }],
    [90, { x: 220, y: 330 }, { x: 300, y: 200 }],
    [180, { x: 220, y: 30 }, { x: 0, y: 0 }],
    [180, { x: 20, y: 330 }, { x: 200, y: 300 }],
    [270, { x: 220, y: 330 }, { x: 0, y: 0 }],
    [270, { x: 20, y: 30 }, { x: 300, y: 200 }],
  ] as const)("maps known crop corners at %s degrees: %j", (rotation, pdf, display) => {
    expect(toDisplay(pdf, page(rotation))).toEqual(display);
    expect(toPdf(display, page(rotation))).toEqual(pdf);
  });
  it.each([0, 90, 180, 270])("uses the visible dimensions at %s degrees", (rotation) => {
    expect(displaySize(page(rotation))).toEqual(
      rotation % 180 ? { width: 300, height: 200 } : { width: 200, height: 300 }
    );
  });
});

describe("physical page range contracts", () => {
  it.each([
    [" 1 - 3 , 5 ", [1, 2, 3, 5]],
    ["3,1", [3, 1]],
    ["2-END", [2, 3, 4, 5]],
    ["even", [2, 4]],
    ["odd", [1, 3, 5]],
  ] as const)("parses %s without changing intentional order", (input, expected) => {
    expect(parsePageRange(input, 5)).toEqual(expected);
  });
  it.each(["1,", "1,,2", "1.5", "-1", "1-6", "end", "odd,1", "even,2"])(
    "rejects ambiguous or invalid range %s",
    (input) => expect(() => parsePageRange(input, 5)).toThrow()
  );
  it("sorts split boundaries while preserving every page exactly once", () => {
    expect(splitGroups("after", "4,2", 5)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("retains a final short group", () => {
    expect(splitGroups("every", "2", 5)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("allows explicit outputs to overlap without duplicating pages within an output", () => {
    expect(splitGroups("ranges", "1-2;2-3", 5)).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });
  it("sanitizes path characters while preserving Unicode names", () => {
    expect(outputName("α/../report.PDF", 9)).toBe("α____report-10.pdf");
  });
});

describe("history durability", () => {
  const initial = (): History => ({ present: emptyDocument(), past: [], future: [], revision: 0 });
  it("bounds retained snapshots after many commits", () => {
    let state = initial();
    for (let index = 0; index < 80; index++)
      state = historyReducer(state, {
        type: "commit",
        document: { ...state.present, name: `${index}.pdf` },
      });
    expect(state.past).toHaveLength(50);
    expect(state.past[0].name).toBe("29.pdf");
    expect(state.revision).toBe(80);
  });
  it("does not manufacture undo entries for the identical document", () => {
    const state = initial();
    expect(historyReducer(state, { type: "commit", document: state.present })).toBe(state);
  });
  it("leaves empty undo and redo unchanged", () => {
    const state = initial();
    expect(historyReducer(state, { type: "undo" })).toBe(state);
    expect(historyReducer(state, { type: "redo" })).toBe(state);
  });
  it("clears both histories during document replacement and advances revision", () => {
    const first = initial(),
      edited = historyReducer(first, {
        type: "commit",
        document: { ...first.present, name: "old" },
      });
    const undone = historyReducer(edited, { type: "undo" }),
      next = emptyDocument();
    expect(historyReducer(undone, { type: "reset", document: next })).toEqual({
      past: [],
      present: next,
      future: [],
      revision: 3,
    });
  });
});

describe("placed object editing", () => {
  function fixture() {
    const first = { ...defaultObject("field", { x: 30, y: 40 }), fieldName: "original" },
      second = defaultObject("text", { x: 70, y: 80 }),
      p = { ...page(), objects: [first, second] };
    return { p, first, second, document: { ...emptyDocument(), pages: [p] } };
  }
  it("duplicates fields with fresh object and field identities", () => {
    const { document, p, first } = fixture(),
      result = duplicateObjects(document, p, [first.id]),
      copy = result.document.pages[0].objects[2];
    expect(copy.id).not.toBe(first.id);
    expect(copy.fieldName).not.toBe(first.fieldName);
    expect(copy.x).toBe(42);
    expect(copy.y).toBe(28);
    expect(p.objects).toHaveLength(2);
  });
  it("moves only selected objects without mutating the old snapshot", () => {
    const { document, p, first, second } = fixture(),
      result = moveObjects(document, p, [first.id], -10, 20);
    expect(result.pages[0].objects[0]).toMatchObject({ x: 20, y: 60 });
    expect(result.pages[0].objects[1]).toBe(second);
    expect(first.x).toBe(30);
  });
  it("removes selected objects while preserving unrelated objects", () => {
    const { document, p, first, second } = fixture();
    expect(removeObjects(document, p, [first.id]).pages[0].objects).toEqual([second]);
    expect(p.objects).toEqual([first, second]);
  });
  it("aligns selected origins without changing the other axis", () => {
    const { document, p, first, second } = fixture();
    const result = alignObjects(document, p, [first.id, second.id], "x");
    expect(result.pages[0].objects.map((object) => [object.x, object.y])).toEqual([
      [30, 40],
      [30, 80],
    ]);
  });
});
