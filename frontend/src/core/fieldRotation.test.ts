import { expect, it } from "vitest";
import { defaultObject, emptyDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { PDFDocument } from "pdf-lib";
import { objectRotationError } from "./editorValidation";
import { writeProject } from "./projects";

it("rejects unsupported authored-field angles with a clear field-specific error", async () => {
  const doc = emptyDocument();
  doc.pages.push({
    id: "page",
    sourceId: "",
    sourceIndex: 0,
    comments: [],
    rotation: 0,
    box: { x: 0, y: 0, width: 500, height: 700 },
    objects: [{ ...defaultObject("field", { x: 100, y: 200 }), fieldName: "Name", rotation: 30 }],
  });
  await expect(exportPdf(doc)).rejects.toThrow("quarter-turn");
  await expect(exportPdf(doc, true)).rejects.toThrow("quarter-turn");
  expect(() => writeProject(doc)).toThrow("quarter-turn");
});

it.each([0, 90, 180, 270, -90, -360, 360, 450])(
  "exports supported field rotation %s canonically",
  async (rotation) => {
    const doc = emptyDocument();
    doc.pages.push({
      id: "page",
      sourceId: "",
      sourceIndex: 0,
      comments: [],
      rotation: 0,
      box: { x: 0, y: 0, width: 500, height: 700 },
      objects: [{ ...defaultObject("field", { x: 200, y: 300 }), fieldName: "Name", rotation }],
    });
    const saved = await PDFDocument.load(await exportPdf(doc));
    expect(
      saved
        .getForm()
        .getTextField("Name")
        .acroField.getWidgets()[0]
        .getAppearanceCharacteristics()
        ?.getRotation()
    ).toBe(((rotation % 360) + 360) % 360);
  }
);

it("keeps arbitrary rotations for text objects while restricting radio fields", () => {
  const object = defaultObject("text", { x: 20, y: 30 });
  expect(objectRotationError({ ...object, rotation: 30 })).toBe("");
  expect(
    objectRotationError({ ...object, kind: "field", fieldKind: "radio", rotation: 90 })
  ).toContain("Radio groups");
  expect(objectRotationError({ ...object, kind: "field", fieldKind: "radio", rotation: 360 })).toBe(
    ""
  );
});
