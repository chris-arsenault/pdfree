import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, fieldKey, newId } from "./model";
import { exportPdf } from "./exportPdf";
import { formFixture } from "./fixtures";

const radioOrders = [
  { name: "first option only", order: [0] },
  { name: "second option only", order: [1] },
  { name: "reversed options", order: [1, 0] },
  { name: "original options", order: [0, 1] },
  { name: "duplicated second option", order: [1, 1] },
  { name: "interleaved duplicate options", order: [1, 0, 1] },
];

describe("radio identity across page composition", () => {
  for (const selection of ["", "A", "B"])
    for (const { name, order } of radioOrders)
      it(`${name} retains widget meanings when ${selection || "nothing"} is selected`, async () => {
        const document = appendSource(
          emptyDocument(),
          await importPdf(await formFixture(), "radio.pdf")
        );
        const source = document.sources[0];
        document.values[fieldKey(source.id, "choice")] = selection;
        document.pages = order.map((index) => ({ ...document.pages[index], id: newId() }));
        const saved = await PDFDocument.load(await exportPdf(document));
        const radio = saved.getForm().getRadioGroup(`${source.id}_choice`);
        const expectedOptions: string[] = order.map((index) => (index === 0 ? "A" : "B"));
        expect(radio.getOptions()).toEqual(expectedOptions);
        const expectedSelection = expectedOptions.includes(selection) ? selection : undefined;
        expect(radio.getSelected()).toBe(expectedSelection);
        radio.acroField.getWidgets().forEach((widget, index) => {
          const meaning = widget.getOnValue()?.toString() === "/0" ? "A" : "B";
          expect(meaning).toBe(expectedOptions[index]);
          expect(widget.getAppearanceState()?.toString()).toBe(
            meaning === expectedSelection ? widget.getOnValue()?.toString() : "/Off"
          );
          expect(widget.P()?.toString()).toBe(saved.getPage(index).ref.toString());
        });
        const reopened = await importPdf(await saved.save(), "reopened.pdf");
        expect(
          reopened.source.fields
            .find((field) => field.kind === "radio")
            ?.widgets.map((widget) => widget.option)
        ).toEqual(expectedOptions);
      });

  for (const index of [0, 1])
    it(`extracts option ${index} when the source uses appearance names without Opt`, async () => {
      const original = await PDFDocument.load(await formFixture());
      const radio = original.getForm().getRadioGroup("choice");
      radio.acroField.dict.delete(PDFName.of("Opt"));
      radio.select(String(index));
      const document = appendSource(
        emptyDocument(),
        await importPdf(await original.save(), "no-opt.pdf")
      );
      const saved = await PDFDocument.load(
        await exportPdf(document, false, [document.pages[index].id])
      );
      expect(saved.getForm().getRadioGroup(`${document.sources[0].id}_choice`).getSelected()).toBe(
        String(index)
      );
    });
});

describe("native choice clearing", () => {
  for (const kind of ["dropdown", "list"] as const)
    for (const value of [[], [""], "", ["One"], ["Two"]])
      it(`${kind} saves ${JSON.stringify(value)} without treating the placeholder as an option`, async () => {
        const original = await PDFDocument.create();
        const page = original.addPage();
        const field =
          kind === "dropdown"
            ? original.getForm().createDropdown("choice")
            : original.getForm().createOptionList("choice");
        field.addOptions(["One", "Two"]);
        field.select("Two");
        field.addToPage(page);
        const document = appendSource(
          emptyDocument(),
          await importPdf(await original.save(), "choice.pdf")
        );
        document.values[fieldKey(document.sources[0].id, "choice")] = value;
        const saved = await PDFDocument.load(await exportPdf(document));
        const savedField =
          kind === "dropdown"
            ? saved.getForm().getDropdown("choice")
            : saved.getForm().getOptionList("choice");
        const expected = Array.isArray(value) ? value.filter(Boolean) : [];
        expect(savedField.getSelected()).toEqual(expected);
      });
});

it("reuses parsed sources without retaining prior output values or page mutations", async () => {
  const document = appendSource(
    emptyDocument(),
    await importPdf(await formFixture(), "cached.pdf")
  );
  const source = document.sources[0];
  const cache = new Map<string, PDFDocument>();
  document.values[fieldKey(source.id, "name")] = "First";
  const first = await PDFDocument.load(
    await exportPdf(document, false, [document.pages[0].id], null, cache)
  );
  document.values[fieldKey(source.id, "name")] = "Second";
  const second = await PDFDocument.load(
    await exportPdf(document, false, [document.pages[1].id], null, cache)
  );
  expect(first.getForm().getTextField(`${source.id}_name`).getText()).toBe("First");
  expect(second.getForm().getTextField(`${source.id}_name`).getText()).toBe("Second");
  expect(cache.size).toBe(1);
  expect(cache.get(source.id)?.getPageCount()).toBe(3);
  expect(cache.get(source.id)?.getForm().getTextField("name").getText()).toBe("Original");
  expect(cache.get(source.id)?.getPage(1).getRotation().angle).toBe(0);
});

it("does not use a stale cached document for complete-original preservation", async () => {
  const document = appendSource(
    emptyDocument(),
    await importPdf(await formFixture(), "cached.pdf")
  );
  const cache = new Map<string, PDFDocument>();
  await exportPdf(document, false, [document.pages[0].id], null, cache);
  document.values[fieldKey(document.sources[0].id, "name")] = "Complete";
  const saved = await PDFDocument.load(await exportPdf(document, false, [], null, cache));
  expect(saved.getForm().getTextField("name").getText()).toBe("Complete");
  expect(cache.get(document.sources[0].id)?.getForm().getTextField("name").getText()).toBe(
    "Original"
  );
});

it("does not accept an invalid radio choice on complete or extracted exports", async () => {
  const document = appendSource(
    emptyDocument(),
    await importPdf(await formFixture(), "invalid.pdf")
  );
  document.values[fieldKey(document.sources[0].id, "choice")] = "Not an option";
  await expect(exportPdf(document)).rejects.toThrow();
  await expect(exportPdf(document, false, [document.pages[0].id])).rejects.toThrow(
    "not one of its options"
  );
});
