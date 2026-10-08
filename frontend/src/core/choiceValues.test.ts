import { describe, expect, it } from "vitest";
import { PDFDocument, PDFHexString, PDFName } from "pdf-lib";
import { importPdf, appendSource } from "./importPdf";
import { emptyDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { choiceFixture } from "../../tooling/choiceFixture";
import { writeProject, readProject } from "./projects";

async function choiceDocument(kind: "dropdown" | "list", multiSelect = false) {
  return appendSource(
    emptyDocument(),
    await importPdf(await choiceFixture(kind, multiSelect), "states.pdf")
  );
}

describe("choice export values and display labels", () => {
  for (const kind of ["dropdown", "list"] as const) {
    it(`${kind} imports export values separately from their labels`, async () => {
      const doc = await choiceDocument(kind),
        field = doc.sources[0].fields[0];
      expect(field.options).toEqual(["CA", "NY"]);
      expect(field.choiceOptions).toEqual([
        { value: "CA", label: "California" },
        { value: "NY", label: "New York" },
      ]);
      expect(doc.values[field.id]).toEqual(["CA"]);
    });
    for (const extract of [false, true]) {
      it(`${kind} preserves values and flags on ${extract ? "composed" : "complete"} export`, async () => {
        const doc = await choiceDocument(kind),
          field = doc.sources[0].fields[0];
        if (extract) doc.pages.push({ ...doc.pages[0], id: "duplicate" });
        const saved = await PDFDocument.load(await exportPdf(doc));
        const name = extract ? `${doc.sources[0].id}_state` : "state";
        const choice =
          kind === "dropdown"
            ? saved.getForm().getDropdown(name)
            : saved.getForm().getOptionList(name);
        expect(choice.getSelected()).toEqual(["CA"]);
        expect(choice.acroField.getFlags()).toBe(kind === "dropdown" ? 131072 : 0);
        doc.values[field.id] = ["NY"];
        const edited = await PDFDocument.load(await exportPdf(doc));
        const editedChoice = edited.getForm().getFields()[0];
        expect(editedChoice.acroField.dict.lookup(PDFName.of("V"), PDFHexString).decodeText()).toBe(
          "NY"
        );
      });
    }
    it(`${kind} rejects multiple selections without changing single-select flags`, async () => {
      const doc = await choiceDocument(kind);
      doc.values[doc.sources[0].fields[0].id] = ["CA", "NY"];
      await expect(exportPdf(doc)).rejects.toThrow("only one");
    });
    it(`${kind} retains selected indices for multiple export values`, async () => {
      const doc = await choiceDocument(kind, true);
      doc.values[doc.sources[0].fields[0].id] = ["NY", "CA"];
      const saved = await PDFDocument.load(await exportPdf(doc));
      expect(saved.getForm().getFields()[0].getName()).toBe("state");
      const selected =
        kind === "dropdown"
          ? saved.getForm().getDropdown("state").getSelected()
          : saved.getForm().getOptionList("state").getSelected();
      expect(selected).toEqual(["CA", "NY"]);
      expect(saved.getForm().getFields()[0].acroField.dict.get(PDFName.of("I"))?.toString()).toBe(
        "[ 0 1 ]"
      );
    });
  }
});

it("rederives choice labels and preserves selected export values when reopening a project", async () => {
  const doc = await choiceDocument("dropdown");
  doc.values[doc.sources[0].fields[0].id] = ["NY"];
  const restored = await readProject(writeProject(doc));
  expect(restored.sources[0].fields[0].choiceOptions).toEqual([
    { value: "CA", label: "California" },
    { value: "NY", label: "New York" },
  ]);
  expect(restored.values).toEqual(doc.values);
});

it("preserves custom editable-dropdown values without adding options or changing flags", async () => {
  const pdf = await PDFDocument.create(),
    page = pdf.addPage();
  const field = pdf.getForm().createDropdown("custom");
  field.addOptions(["One", "Two"]);
  field.enableEditing();
  field.select("Custom");
  field.addToPage(page);
  const doc = appendSource(emptyDocument(), await importPdf(await pdf.save(), "editable.pdf"));
  const saved = await PDFDocument.load(await exportPdf(doc));
  expect(saved.getForm().getDropdown("custom").getSelected()).toEqual(["Custom"]);
  expect(saved.getForm().getDropdown("custom").getOptions()).toEqual(["One", "Two"]);
  expect(saved.getForm().getDropdown("custom").acroField.getFlags()).toBe(
    field.acroField.getFlags()
  );
});

it("rejects unknown export values in a closed dropdown without silently enabling editing", async () => {
  const doc = await choiceDocument("dropdown");
  doc.values[doc.sources[0].fields[0].id] = ["California"];
  await expect(exportPdf(doc)).rejects.toThrow("not one of its options");
});
