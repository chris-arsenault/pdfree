import { expect, it } from "vitest";
import { PDFDocument, PDFName, PDFNumber, PDFHexString } from "pdf-lib";
import { importPdf, appendSource } from "./importPdf";
import { exportPdf } from "./exportPdf";
import { emptyDocument } from "./model";
it("rejects nonstandard units before editing", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage().node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
  await expect(importPdf(await pdf.save(), "units.pdf")).rejects.toThrow("nonstandard page units");
});
it("rejects malformed widget rotation before it can crash the editor", async () => {
  const pdf = await PDFDocument.create(),
    page = pdf.addPage();
  const field = pdf.getForm().createTextField("rotated");
  field.addToPage(page);
  field.acroField
    .getWidgets()[0]
    .getAppearanceCharacteristics()!
    .dict.set(PDFName.of("R"), PDFNumber.of(45));
  await expect(importPdf(await pdf.save(), "widget.pdf")).rejects.toThrow(
    "widget with unsupported rotation"
  );
});
it("preserves explicit export range order and rejects duplicate pages", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([100, 200]);
  pdf.addPage([300, 400]);
  const document = appendSource(emptyDocument(), await importPdf(await pdf.save(), "order.pdf"));
  const ids = document.pages.map((page) => page.id).reverse();
  const saved = await PDFDocument.load(await exportPdf(document, false, ids));
  expect(saved.getPages().map((page) => page.getWidth())).toEqual([300, 100]);
  await expect(exportPdf(document, false, [ids[0], ids[0]])).rejects.toThrow("only once");
});
it("rejects XFA and signed certificate fields without deleting them, accepting empty signature fields", async () => {
  const xfa = await PDFDocument.create();
  xfa.addPage();
  xfa.getForm().acroForm.dict.set(PDFName.of("XFA"), xfa.context.obj({}));
  const bytes = await xfa.save({ updateFieldAppearances: false });
  expect((await PDFDocument.load(bytes)).catalog.AcroForm()?.has(PDFName.of("XFA"))).toBe(true);
  await expect(importPdf(bytes, "xfa.pdf")).rejects.toThrow("XFA forms");
  const signed = await PDFDocument.create();
  signed.addPage();
  const field = signed.context.obj({ FT: "Sig", T: PDFHexString.fromText("certificate") });
  signed.getForm().acroForm.addField(signed.context.register(field));
  const emptyBytes = await signed.save();
  expect((await importPdf(emptyBytes, "unsigned.pdf")).pages).toHaveLength(1);
  field.set(PDFName.of("V"), signed.context.register(signed.context.obj({ Type: "Sig" })));
  await expect(importPdf(await signed.save(), "signed.pdf")).rejects.toThrow(
    "certificate signature fields"
  );
});
it("retains catalog structures for complete exports and rejects lossy extraction", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.addPage();
  pdf.catalog.set(PDFName.of("Outlines"), pdf.context.obj({ Type: "Outlines", Count: 0 }));
  const document = appendSource(
    emptyDocument(),
    await importPdf(await pdf.save(), "bookmarks.pdf")
  );
  const saved = await PDFDocument.load(await exportPdf(document));
  expect(saved.catalog.has(PDFName.of("Outlines"))).toBe(true);
  await expect(exportPdf(document, false, [document.pages[0].id])).rejects.toThrow(
    "document bookmarks"
  );
});
