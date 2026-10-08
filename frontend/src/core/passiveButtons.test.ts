import { expect, it } from "vitest";
import { PDFDocument, PDFButton, PDFName } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, fieldKey } from "./model";
import { exportPdf } from "./exportPdf";
import { formFixture } from "./fixtures";

it.each(["preserve", "compose", "flatten"])(
  "retains passive pushbutton appearance through %s export",
  async (mode) => {
    const original = await PDFDocument.load(await formFixture());
    const button = original.getForm().createButton("passive");
    button.addToPage("Sample button", original.getPage(0), {
      x: 50,
      y: 200,
      width: 150,
      height: 30,
    });
    const doc = appendSource(
      emptyDocument(),
      await importPdf(await original.save(), "buttons.pdf")
    );
    expect(doc.sources[0].fields.some((field) => field.name === "passive")).toBe(false);
    doc.values[fieldKey(doc.sources[0].id, "name")] = "Edited Ada";
    const output = await exportPdf(
      doc,
      mode === "flatten",
      mode === "compose" ? [doc.pages[0].id] : []
    );
    const parsed = await PDFDocument.load(output);
    if (mode === "flatten") expect(parsed.getForm().getFields()).toHaveLength(0);
    else {
      const retained = parsed
        .getForm()
        .getFields()
        .find((field) => field instanceof PDFButton);
      expect(retained?.acroField.getWidgets()).toHaveLength(1);
      expect(retained?.acroField.getWidgets()[0].dict.has(PDFName.of("AP"))).toBe(true);
    }
    const reader = await getDocument({ data: output.slice() }).promise;
    try {
      const page = await reader.getPage(1);
      const text = (await page.getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      if (mode === "flatten") expect(text).toContain("Sample button");
      else
        expect(
          (await page.getAnnotations()).some(
            (field) => field.pushButton && field.fieldName?.endsWith("passive")
          )
        ).toBe(true);
    } finally {
      await reader.destroy();
    }
  }
);
