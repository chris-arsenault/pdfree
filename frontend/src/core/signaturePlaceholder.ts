import {
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
  PDFArray,
  PDFDict,
  PDFRef,
} from "pdf-lib";
import { type PdfSigning } from "./pdfSecurity";
import { hasCertificateSignature, signatureFields } from "./signedPdf";

function addInvisibleWidget(pdf: PDFDocument, field: PDFDict, reference: PDFRef) {
  if (field.has(PDFName.of("Subtype")) || field.lookupMaybe(PDFName.of("Kids"), PDFArray)?.size())
    return;
  const page = pdf.getPage(0);
  // A combined field/widget also exposes the signature value to older readers.
  field.delete(PDFName.of("Kids"));
  field.set(PDFName.of("Type"), PDFName.of("Annot"));
  field.set(PDFName.of("Subtype"), PDFName.of("Widget"));
  field.set(PDFName.of("Rect"), pdf.context.obj([0, 0, 0, 0]));
  field.set(PDFName.of("P"), page.ref);
  page.node.addAnnot(reference);
}

function signingField(pdf: PDFDocument, marker: string) {
  const existing = signatureFields(pdf)[0];
  if (existing) {
    if (
      existing.acroField.dict.has(PDFName.of("SV")) ||
      existing.acroField.dict.has(PDFName.of("Lock"))
    )
      throw new Error(
        "This signature field requires seed values or field locks that PDFree cannot safely honor. Use a copy without those requirements."
      );
    addInvisibleWidget(pdf, existing.acroField.dict, existing.ref);
    return existing.acroField.dict;
  }
  const field = pdf.context.obj({
    FT: "Sig",
    T: PDFHexString.fromText(`PDFree signature ${marker}`),
  });
  const reference = pdf.context.register(field);
  pdf.getForm().acroForm.addField(reference);
  addInvisibleWidget(pdf, field, reference);
  return field;
}

export async function signaturePlaceholder(
  bytes: Uint8Array,
  options: PdfSigning,
  name: string,
  reservedBytes: number
) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = pdf.getForm();
  if (hasCertificateSignature(pdf))
    throw new Error("Use an unsigned PDF when adding a PDFree signature or certification.");
  const marker = `PDFree${crypto.randomUUID().replaceAll("-", "")}`;
  const dictionary = pdf.context.obj({
    Type: "Sig",
    Filter: "Adobe.PPKLite",
    SubFilter: "adbe.pkcs7.detached",
    ByteRange: [0, PDFName.of(`${marker}A`), PDFName.of(`${marker}B`), PDFName.of(`${marker}C`)],
    Contents: PDFHexString.of("0".repeat(reservedBytes * 2)),
    M: PDFString.fromDate(new Date()),
    Name: PDFHexString.fromText(name),
    Reason: PDFHexString.fromText(options.reason),
    Location: PDFHexString.fromText(options.location),
  });
  const reference = pdf.context.register(dictionary);
  const field = signingField(pdf, marker);
  field.set(PDFName.of("V"), reference);
  const flags = field.lookupMaybe(PDFName.of("Ff"), PDFNumber)?.asNumber() ?? 0;
  field.set(PDFName.of("Ff"), PDFNumber.of(flags | 1));
  if (options.certification) {
    const catalogRef = pdf.context.getObjectRef(pdf.catalog);
    if (!catalogRef) throw new Error("The PDF catalog reference is missing.");
    dictionary.set(
      PDFName.of("Reference"),
      pdf.context.obj([
        {
          Type: "SigRef",
          TransformMethod: "DocMDP",
          Data: catalogRef,
          TransformParams: { Type: "TransformParams", P: options.certification, V: "1.2" },
        },
      ])
    );
    pdf.catalog.set(PDFName.of("Perms"), pdf.context.obj({ DocMDP: reference }));
    if (options.certification === 1)
      field.set(PDFName.of("Lock"), pdf.context.obj({ Type: "SigFieldLock", Action: "All" }));
  }
  form.acroForm.dict.set(PDFName.of("SigFlags"), PDFNumber.of(3));
  return {
    bytes: await pdf.save({ useObjectStreams: false, updateFieldAppearances: false }),
    marker,
  };
}
