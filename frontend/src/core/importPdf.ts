import { failure } from "../i18n/messages";
import {
  PDFDocument,
  PDFName,
  PDFSignature,
  PDFButton,
  PDFDict,
  PDFPage,
  PDFNumber,
} from "pdf-lib";
import { describeFields, fieldKind } from "./nativeFields";
import { newId, type Page, type Source } from "./model";
export { appendSource } from "./appendSource";
import { visiblePageBox } from "./visiblePage";
import { hasCertificateSignature } from "./signedPdf";
import { unlockPdf } from "./unlockPdf";
import { type PdfCredential } from "./pdfCredentials";
import { readComments } from "./importComments";
import { readNavigation } from "./bookmarks";
import { type SourceWarning, type StructuralWarning } from "../i18n/diagnostics";

function validateControls(pdf: PDFDocument) {
  if (pdf.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict)?.has(PDFName.of("XFA")))
    throw failure("errors.xfa");
  const fields = pdf.getForm().getFields();
  if (hasCertificateSignature(pdf)) throw failure("errors.signedInput");
  const unsupported = fields.filter(
    (field) =>
      !(field instanceof PDFSignature) && !(field instanceof PDFButton) && !fieldKind(field)
  );
  if (unsupported.length) throw failure("errors.formControls");
  const invalidRotation = fields.some((field) =>
    field.acroField.getWidgets().some((widget) => {
      const angle = widget.getAppearanceCharacteristics()?.getRotation() ?? 0;
      return !Number.isFinite(angle) || angle % 90 !== 0;
    })
  );
  if (invalidRotation) throw failure("errors.widgetRotation");
  return fields;
}
function pageLinks(pdf: PDFDocument) {
  return pdf.getPages().flatMap(internalPageLinks);
}
function internalPageLinks(page: PDFPage) {
  const warnings: StructuralWarning[] = [];
  const annots = page.node.Annots();
  if (!annots) return warnings;
  for (let i = 0; i < annots.size(); i++) {
    const annot = annots.lookup(i, PDFDict);
    if (annot.has(PDFName.of("Dest"))) warnings.push("links");
    const action = annot.lookupMaybe(PDFName.of("A"), PDFDict);
    if (action?.get(PDFName.of("S"))?.toString() === "/GoTo") warnings.push("links");
  }
  return warnings;
}
function inspect(pdf: PDFDocument) {
  const fields = validateControls(pdf);
  const structuralWarnings: StructuralWarning[] = [];
  if (pdf.catalog.has(PDFName.of("Outlines"))) structuralWarnings.push("bookmarks");
  if (pdf.catalog.has(PDFName.of("Names"))) structuralWarnings.push("destinations");
  if (pdf.catalog.has(PDFName.of("StructTreeRoot"))) structuralWarnings.push("accessibility");
  const scripted = fields.some((field) => field.acroField.dict.has(PDFName.of("AA")));
  const warnings: SourceWarning[] = scripted ? ["scripts"] : [];
  structuralWarnings.push(...pageLinks(pdf));
  return { warnings, structuralWarnings: [...new Set(structuralWarnings)] };
}
export async function importPdf(bytes: Uint8Array, name: string, credential?: PdfCredential) {
  const unlocked = await unlockPdf(bytes, credential);
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(unlocked.bytes, { updateMetadata: false });
  } catch {
    throw failure("errors.pdfUnreadable");
  }
  const id = newId();
  const inspection = inspect(pdf);
  const comments = readComments(pdf);
  inspection.structuralWarnings.push(...comments.warnings);
  if (
    pdf
      .getPages()
      .some(
        (page) => (page.node.lookupMaybe(PDFName.of("UserUnit"), PDFNumber)?.asNumber() ?? 1) !== 1
      )
  )
    throw failure("errors.pageUnits");
  const source: Source = {
    id,
    name,
    bytes,
    decryptedBytes: unlocked.encryption ? unlocked.bytes : null,
    encryption: unlocked.encryption ?? null,
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
    comments: comments.pages[sourceIndex],
    recognition: null,
    scan: null,
    links: [],
  }));
  let bookmarks: ReturnType<typeof readNavigation> = [];
  try {
    bookmarks = readNavigation(pdf, pages);
    source.structuralWarnings = source.structuralWarnings.filter(
      (warning) => !["bookmarks", "links"].includes(warning)
    );
    const names = pdf.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
    if (names && names.keys().every((key) => key.toString() === "/Dests"))
      source.structuralWarnings = source.structuralWarnings.filter(
        (warning) => warning !== "destinations"
      );
  } catch {
    source.warnings.push("navigation");
    pages.forEach((page) => {
      page.links = [];
    });
  }
  return { source, pages, bookmarks };
}
