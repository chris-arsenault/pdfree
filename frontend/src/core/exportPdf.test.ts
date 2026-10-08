import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { importPdf, appendSource } from "./importPdf";
import { emptyDocument, fieldKey, newId, defaultObject } from "./model";
import { exportPdf } from "./exportPdf";
import { formFixture } from "./fixtures";

describe("PDF form and page round trips", () => {
  it("retains a combined field/widget dictionary and discovers its page without a P entry", async () => {
    const original = await PDFDocument.load(await formFixture()),
      field = original.getForm().getCheckBox("agree");
    const widget = field.acroField.getWidgets()[0],
      annotations = original.getPage(0).node.Annots()!;
    for (let index = 0; index < annotations.size(); index++)
      if (annotations.lookup(index, PDFDict) === widget.dict) annotations.set(index, field.ref);
    for (const [key, value] of widget.dict.entries())
      if (key !== PDFName.of("Parent")) field.acroField.dict.set(key, value);
    field.acroField.dict.delete(PDFName.of("Kids"));
    field.acroField.dict.delete(PDFName.of("P"));
    const imported = await importPdf(await original.save(), "combined.pdf"),
      doc = appendSource(emptyDocument(), imported);
    expect(imported.source.fields.find((item) => item.name === "agree")?.widgets[0].pageIndex).toBe(
      0
    );
    doc.values[fieldKey(imported.source.id, "agree")] = true;
    const saved = await PDFDocument.load(await exportPdf(doc, false, [doc.pages[0].id]));
    expect(saved.getForm().getCheckBox(`${imported.source.id}_agree`).isChecked()).toBe(true);
  });
  it("retains values and shared widgets after reordering and rotation", async () => {
    const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "form.pdf"));
    doc.values[fieldKey(doc.sources[0].id, "name")] = "Ada";
    doc.pages.reverse();
    doc.pages[1].rotation = 180;
    const saved = await PDFDocument.load(await exportPdf(doc));
    expect(saved.getForm().getTextField("name").getText()).toBe("Ada");
    expect(saved.getForm().getTextField("name").acroField.getWidgets()).toHaveLength(2);
    expect(saved.getPage(1).getRotation().angle).toBe(180);
  });
  it("grafts fields on extracted and duplicated pages", async () => {
    const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "form.pdf"));
    doc.pages = [doc.pages[0], { ...doc.pages[0], id: newId() }];
    doc.values[fieldKey(doc.sources[0].id, "name")] = "Duplicate";
    const saved = await PDFDocument.load(await exportPdf(doc));
    expect(saved.getPageCount()).toBe(2);
    const field = saved.getForm().getTextField(`${doc.sources[0].id}_name`);
    expect(field.getText()).toBe("Duplicate");
    expect(field.acroField.getWidgets()).toHaveLength(2);
    expect(field.acroField.getWidgets().map((w) => w.P()?.toString())).toEqual(
      saved.getPages().map((p) => p.ref.toString())
    );
  });
  it("merges fields with identical names without sharing values", async () => {
    let doc = appendSource(emptyDocument(), await importPdf(await formFixture("One"), "one.pdf"));
    doc = appendSource(doc, await importPdf(await formFixture("Two"), "two.pdf"));
    doc.values[fieldKey(doc.sources[0].id, "name")] = "One";
    doc.values[fieldKey(doc.sources[1].id, "name")] = "Two";
    const saved = await PDFDocument.load(await exportPdf(doc));
    expect(saved.getPageCount()).toBe(6);
    expect(saved.getForm().getTextField(`${doc.sources[0].id}_name`).getText()).toBe("One");
    expect(saved.getForm().getTextField(`${doc.sources[1].id}_name`).getText()).toBe("Two");
  });
  it("flattens fields into page content", async () => {
    const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "form.pdf"));
    const saved = await PDFDocument.load(await exportPdf(doc, true));
    expect(saved.getForm().getFields()).toHaveLength(0);
    expect(saved.getPageCount()).toBe(3);
  });
});
it("creates genuine text, checkbox, radio and dropdown fields with initial values", async () => {
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "new-fields.pdf"));
  doc.pages[0].objects.push({
    ...defaultObject("field", { x: 40, y: 200 }),
    fieldName: "new_text",
    text: "Editable",
    required: true,
  });
  doc.pages[0].objects.push({
    ...defaultObject("field", { x: 40, y: 150 }),
    fieldName: "new_check",
    fieldKind: "checkbox",
    text: "true",
    width: 20,
    height: 20,
  });
  doc.pages[1].objects.push({
    ...defaultObject("field", { x: 40, y: 200 }),
    fieldName: "new_choice",
    fieldKind: "dropdown",
    options: ["One", "Two"],
    text: "Two",
  });
  doc.pages[1].objects.push({
    ...defaultObject("field", { x: 40, y: 100 }),
    fieldName: "new_radio",
    fieldKind: "radio",
    options: ["One", "Two"],
    text: "One",
    height: 60,
  });
  const saved = await PDFDocument.load(await exportPdf(doc));
  expect(saved.getForm().getTextField("new_text").getText()).toBe("Editable");
  expect(saved.getForm().getTextField("new_text").isRequired()).toBe(true);
  expect(saved.getForm().getCheckBox("new_check").isChecked()).toBe(true);
  expect(saved.getForm().getDropdown("new_choice").getSelected()).toEqual(["Two"]);
  expect(saved.getForm().getRadioGroup("new_radio").getSelected()).toBe("One");
  expect(
    (await importPdf(await saved.save(), "reopened.pdf")).source.fields.find(
      (field) => field.name === "new_text"
    )?.widgets[0].pageIndex
  ).toBe(0);
});
it("rejects duplicate new field names and text that would be clipped or lose glyphs", async () => {
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "bad.pdf"));
  doc.pages[0].objects.push({ ...defaultObject("field", { x: 40, y: 100 }), fieldName: "name" });
  await expect(exportPdf(doc)).rejects.toThrow("already exists");
  doc.pages[0].objects = [
    { ...defaultObject("text", { x: 40, y: 100 }), text: "This is much too long", width: 12 },
  ];
  await expect(exportPdf(doc)).rejects.toThrow("does not fit");
  doc.pages[0].objects[0].text = "漢";
  await expect(exportPdf(doc)).rejects.toThrow("cannot export");
});
