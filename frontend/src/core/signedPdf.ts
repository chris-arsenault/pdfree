import { PDFDocument, PDFDict, PDFName, PDFNull, PDFSignature } from "pdf-lib";

export function signatureFields(pdf: PDFDocument) {
  return pdf
    .getForm()
    .getFields()
    .filter((field): field is PDFSignature => field instanceof PDFSignature);
}

export function hasCertificateSignature(pdf: PDFDocument) {
  return (
    !!pdf.catalog.lookupMaybe(PDFName.of("Perms"), PDFDict)?.has(PDFName.of("DocMDP")) ||
    signatureFields(pdf).some((field) => {
      const value = field.acroField.getInheritableAttribute(PDFName.of("V"));
      return value !== undefined && pdf.context.lookup(value) !== PDFNull;
    })
  );
}
