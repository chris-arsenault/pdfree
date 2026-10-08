import { beforeAll, describe, expect, it } from "vitest";
import { strToU8, unzipSync, zipSync, strFromU8 } from "fflate";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, defaultObject, type EditorDocument } from "./model";
import { formFixture } from "./fixtures";
import { readProject, writeProject } from "./projects";
import { projectLimits } from "./projectLimits";

let original: EditorDocument;
beforeAll(async () => {
  original = appendSource(emptyDocument(), await importPdf(await formFixture(), "form.pdf"));
});
const fresh = () => structuredClone(original);

describe("project save/open integrity", () => {
  it("refuses oversized saves and imports before archive encoding or PDF parsing", async () => {
    const doc = fresh(),
      oversized = new Uint8Array(projectLimits.archiveBytes + 1);
    doc.sources[0].bytes = oversized;
    expect(() => writeProject(doc)).toThrow("256 MB archive limit");
    await expect(readProject(oversized)).rejects.toThrow("256 MB archive limit");
  });
  it.each([
    [
      "missing source",
      (doc: EditorDocument) => {
        doc.pages[0].sourceId = "absent";
      },
      "missing PDF page",
    ],
    [
      "page past source end",
      (doc: EditorDocument) => {
        doc.pages[0].sourceIndex = 999;
      },
      "missing PDF page",
    ],
    [
      "duplicate pages",
      (doc: EditorDocument) => {
        doc.pages[1].id = doc.pages[0].id;
      },
      "duplicate object",
    ],
    [
      "cross-kind identities",
      (doc: EditorDocument) => {
        doc.pages[0].id = doc.sources[0].id;
      },
      "duplicate object",
    ],
    [
      "missing image",
      (doc: EditorDocument) => {
        doc.pages[0].objects = [
          { ...defaultObject("image", { x: 20, y: 20 }), assetId: "missing" },
        ];
      },
      "missing image",
    ],
    [
      "orphan field value",
      (doc: EditorDocument) => {
        doc.values.absent = "value";
      },
      "missing form field",
    ],
    [
      "invalid text value",
      (doc: EditorDocument) => {
        doc.values[doc.sources[0].fields.find((field) => field.name === "name")!.id] = false;
      },
      "must be text",
    ],
    [
      "invalid checkbox value",
      (doc: EditorDocument) => {
        doc.values[doc.sources[0].fields.find((field) => field.name === "agree")!.id] = "true";
      },
      "checked or unchecked",
    ],
  ] as const)("rejects %s before writing an archive", (_, change, message) => {
    const doc = fresh();
    change(doc);
    expect(() => writeProject(doc)).toThrow(message);
  });
  it.each([
    [
      "blank name",
      (doc: EditorDocument) => {
        doc.name = "";
      },
    ],
    [
      "whitespace name",
      (doc: EditorDocument) => {
        doc.name = "   ";
      },
    ],
    [
      "long name",
      (doc: EditorDocument) => {
        doc.name = "n".repeat(256);
      },
    ],
    [
      "negative page index",
      (doc: EditorDocument) => {
        doc.pages[0].sourceIndex = -1;
      },
    ],
    [
      "nonfinite geometry",
      (doc: EditorDocument) => {
        doc.pages[0].box.width = Infinity;
      },
    ],
    [
      "zero geometry",
      (doc: EditorDocument) => {
        doc.pages[0].box.height = 0;
      },
    ],
  ] as const)("gives a readable save error for %s", (_, change) => {
    const doc = fresh();
    change(doc);
    expect(() => writeProject(doc)).toThrow("Cannot save this editing project:");
  });
  it("checks the same references when reopening an externally changed manifest", async () => {
    const files = unzipSync(writeProject(fresh()));
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    manifest.pages[0].sourceIndex = 999;
    files["manifest.json"] = strToU8(JSON.stringify(manifest));
    await expect(readProject(zipSync(files))).rejects.toThrow("missing PDF page");
  });
  it("does not mutate source bytes, geometry, or values while saving", async () => {
    const doc = fresh(),
      snapshot = structuredClone(doc);
    const reopened = await readProject(writeProject(doc));
    expect(doc).toEqual(snapshot);
    expect(reopened.pages).toEqual(doc.pages);
    expect(reopened.values).toEqual(doc.values);
  });
  it("rejects malformed manifest JSON with a readable message", async () => {
    await expect(readProject(zipSync({ "manifest.json": strToU8("{") }))).rejects.toThrow(
      "not valid JSON"
    );
  });
  it("rejects a missing source entry", async () => {
    const files = unzipSync(writeProject(fresh()));
    delete files["sources/0.pdf"];
    await expect(readProject(zipSync(files))).rejects.toThrow("missing sources/0.pdf");
  });
  it("keeps an unused source available for undo and project recovery", async () => {
    const doc = fresh();
    doc.pages = [doc.pages[0]];
    const restored = await readProject(writeProject(doc));
    expect(restored.sources[0].pageCount).toBe(3);
    expect(restored.pages).toHaveLength(1);
  });
});
