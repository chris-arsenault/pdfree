import { PDFDocument, PDFName, PDFSignature, PDFDict, PDFPage, PDFNumber } from "pdf-lib";
import { describeFields, fieldKind } from "./nativeFields";
import { newId, fieldKey, type EditorDocument, type Page, type Source } from "./model";
import { visiblePageBox } from "./visiblePage";
import { hasCertificateSignature } from "./signedPdf";

function validateControls(pdf: PDFDocument) {
  if (pdf.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict)?.has(PDFName.of("XFA")))
    throw new Error(
      "This document uses XFA forms, which PDFree cannot safely edit. Open it in an XFA-capable editor."
    );
  const fields = pdf.getForm().getFields();
  if (hasCertificateSignature(pdf))
    throw new Error(
      "This PDF has certificate signature fields. Editing could invalidate signatures; use an unsigned copy."
    );
  const unsupported = fields.filter(
    (field) => !(field instanceof PDFSignature) && !fieldKind(field)
  );
  if (unsupported.length)
    throw new Error(
      "This PDF contains unsupported form controls. Use a copy without those controls."
    );
  const invalidRotation = fields.some((field) =>
    field.acroField.getWidgets().some((widget) => {
      const angle = widget.getAppearanceCharacteristics()?.getRotation() ?? 0;
      return !Number.isFinite(angle) || angle % 90 !== 0;
    })
  );
  if (invalidRotation)
    throw new Error(
      "This PDF contains a form widget with unsupported rotation. Use quarter-turn rotations."
    );
  return fields;
}
function pageLinks(pdf: PDFDocument) {
  return pdf.getPages().flatMap(internalPageLinks);
}
function internalPageLinks(page: PDFPage) {
  const warnings: string[] = [];
  const annots = page.node.Annots();
  if (!annots) return warnings;
  for (let i = 0; i < annots.size(); i++) {
    const annot = annots.lookup(i, PDFDict);
    if (annot.has(PDFName.of("Dest"))) warnings.push("internal page links");
    const action = annot.lookupMaybe(PDFName.of("A"), PDFDict);
    if (action?.get(PDFName.of("S"))?.toString() === "/GoTo") warnings.push("internal page links");
  }
  return warnings;
}
function inspect(pdf: PDFDocument) {
  const fields = validateControls(pdf);
  const structuralWarnings: string[] = [];
  if (pdf.catalog.has(PDFName.of("Outlines"))) structuralWarnings.push("document bookmarks");
  if (pdf.catalog.has(PDFName.of("Names")))
    structuralWarnings.push("named destinations or attachments");
  if (pdf.catalog.has(PDFName.of("StructTreeRoot")))
    structuralWarnings.push("accessibility structure");
  const scripted = fields.some((field) => field.acroField.dict.has(PDFName.of("AA")));
  const warnings = scripted
    ? ["Embedded form scripts are not executed; check calculated values manually."]
    : [];
  structuralWarnings.push(...pageLinks(pdf));
  return { warnings, structuralWarnings: [...new Set(structuralWarnings)] };
}
export async function importPdf(bytes: Uint8Array, name: string) {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (String(error).includes("encrypted"))
      throw new Error(
        "Password-protected PDFs cannot be edited safely here. Open an unencrypted copy."
      );
    throw new Error("This file could not be read as a PDF. It may be damaged or unsupported.");
  }
  const id = newId();
  const inspection = inspect(pdf);
  if (
    pdf
      .getPages()
      .some(
        (page) => (page.node.lookupMaybe(PDFName.of("UserUnit"), PDFNumber)?.asNumber() ?? 1) !== 1
      )
  )
    throw new Error(
      "This PDF uses nonstandard page units. Convert it to standard PDF page units before editing."
    );
  const source: Source = {
    id,
    name,
    bytes,
    pageCount: pdf.getPageCount(),
    fields: describeFields(pdf, id),
    ...inspection,
    title: pdf.getTitle() ?? "",
    author: pdf.getAuthor() ?? "",
  };
  const pages: Page[] = pdf.getPages().map((page, sourceIndex) => ({
    id: newId(),
    sourceId: id,
    sourceIndex,
    rotation: ((page.getRotation().angle % 360) + 360) % 360,
    box: visiblePageBox(page),
    objects: [],
  }));
  return { source, pages };
}
export function appendSource(
  document: EditorDocument,
  imported: Awaited<ReturnType<typeof importPdf>>
): EditorDocument {
  const values = { ...document.values };
  for (const field of imported.source.fields)
    values[fieldKey(imported.source.id, field.name)] = field.value;
  return {
    ...document,
    name: document.pages.length ? document.name : imported.source.name,
    sources: [...document.sources, imported.source],
    pages: [...document.pages, ...imported.pages],
    values,
  };
}
