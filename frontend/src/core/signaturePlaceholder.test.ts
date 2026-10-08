import { expect, it } from "vitest";
import { PDFDocument, PDFHexString, PDFName, PDFNull, PDFDict, PDFArray } from "pdf-lib";
import { signaturePlaceholder } from "./signaturePlaceholder";
import { importPdf } from "./importPdf";

const signing = {
  certificate: new Uint8Array([1]),
  password: "",
  certification: 0 as const,
  reason: "Approved",
  location: "Montréal",
};
it.each([false, true])(
  "serializes a page-linked invisible widget for an existing field: %s",
  async (reuse) => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    if (reuse) {
      const field = pdf.context.obj({ FT: "Sig", T: PDFHexString.fromText("Approval"), Kids: [] });
      pdf.getForm().acroForm.addField(pdf.context.register(field));
    }
    const saved = await PDFDocument.load(
      (await signaturePlaceholder(await pdf.save(), signing, "Signer", 1024)).bytes
    );
    const field = saved.getForm().getFields()[0];
    const annotations = saved.getPage(0).node.Annots();
    expect(annotations?.size()).toBe(1);
    const widget = annotations!.lookup(0, PDFDict);
    expect(widget.get(PDFName.of("Subtype"))).toEqual(PDFName.of("Widget"));
    expect(widget.lookup(PDFName.of("Rect"), PDFArray).asRectangle()).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    expect(annotations!.get(0)).toEqual(field.ref);
    expect(widget.get(PDFName.of("Parent"))).toBeUndefined();
    expect(widget.get(PDFName.of("FT"))).toEqual(PDFName.of("Sig"));
    expect(widget.get(PDFName.of("P"))).toEqual(saved.getPage(0).ref);
    expect(field.acroField.getWidgets()).toHaveLength(1);
  }
);
it.each([false, true])(
  "preserves an existing signature widget's page and geometry when merged: %s",
  async (merged) => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const page = pdf.addPage();
    const field = pdf.context.obj({ FT: "Sig", T: PDFHexString.fromText("Visible approval") });
    const reference = pdf.context.register(field);
    const widget = pdf.context.obj({
      Type: "Annot",
      Subtype: "Widget",
      Rect: [40, 50, 140, 80],
      P: page.ref,
    });
    if (merged) {
      for (const [key, value] of widget.entries()) field.set(key, value);
      page.node.addAnnot(reference);
    } else {
      widget.set(PDFName.of("Parent"), reference);
      const widgetReference = pdf.context.register(widget);
      field.set(PDFName.of("Kids"), pdf.context.obj([widgetReference]));
      page.node.addAnnot(widgetReference);
    }
    pdf.getForm().acroForm.addField(reference);
    const saved = await PDFDocument.load(
      (await signaturePlaceholder(await pdf.save(), signing, "Signer", 1024)).bytes
    );
    expect(saved.getPage(0).node.Annots()?.size() ?? 0).toBe(0);
    expect(saved.getPage(1).node.Annots()?.size()).toBe(1);
    const savedField = saved.getForm().getFields()[0];
    expect(savedField.getName()).toBe("Visible approval");
    expect(savedField.acroField.getWidgets()).toHaveLength(1);
    expect(savedField.acroField.getWidgets()[0].getRectangle()).toEqual({
      x: 40,
      y: 50,
      width: 100,
      height: 30,
    });
    expect(savedField.acroField.getWidgets()[0].P()).toEqual(saved.getPage(1).ref);
  }
);
it("accepts explicitly null signature values and preserves their existing field name", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const field = pdf.context.obj({ FT: "Sig", T: PDFHexString.fromText("Approval"), V: PDFNull });
  pdf.getForm().acroForm.addField(pdf.context.register(field));
  const bytes = await pdf.save();
  expect((await importPdf(bytes, "unsigned.pdf")).source.fields).toHaveLength(0);
  const saved = await PDFDocument.load(
    (await signaturePlaceholder(bytes, signing, "Signer", 1024)).bytes
  );
  expect(
    saved
      .getForm()
      .getFields()
      .map((item) => item.getName())
  ).toEqual(["Approval"]);
  const signature = saved.getForm().getFields()[0].acroField.dict.lookup(PDFName.of("V"), PDFDict);
  expect(signature.lookup(PDFName.of("Location"), PDFHexString).decodeText()).toBe("Montréal");
});
it.each(["SV", "Lock"])("rejects an existing field's unsupported %s requirements", async (key) => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const field = pdf.context.obj({
    FT: "Sig",
    T: PDFHexString.fromText("Required approval"),
    [key]: {},
  });
  pdf.getForm().acroForm.addField(pdf.context.register(field));
  await expect(signaturePlaceholder(await pdf.save(), signing, "Signer", 1024)).rejects.toThrow(
    "cannot safely honor"
  );
});
it("rejects certification metadata even if its signature field is missing", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.catalog.set(
    PDFName.of("Perms"),
    pdf.context.obj({ DocMDP: pdf.context.register(pdf.context.obj({ Type: "Sig" })) })
  );
  const bytes = await pdf.save();
  await expect(importPdf(bytes, "certified.pdf")).rejects.toThrow("Editing could invalidate");
  await expect(signaturePlaceholder(bytes, signing, "Signer", 1024)).rejects.toThrow(
    "unsigned PDF"
  );
});
it("accepts an unrelated empty permissions dictionary", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.catalog.set(PDFName.of("Perms"), pdf.context.obj({}));
  expect((await importPdf(await pdf.save(), "unsigned.pdf")).pages).toHaveLength(1);
});
