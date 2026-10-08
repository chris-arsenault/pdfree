import { expect, it } from "vitest";
import { PDFDocument, PDFHexString, PDFName, PDFNull, PDFDict } from "pdf-lib";
import { signaturePlaceholder } from "./signaturePlaceholder";
import { importPdf } from "./importPdf";

const signing = {
  certificate: new Uint8Array([1]),
  password: "",
  certification: 0 as const,
  reason: "Approved",
  location: "Montréal",
};
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
