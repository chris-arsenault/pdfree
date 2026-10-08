import { PDFDocument, degrees, PDFName, PDFRadioGroup, PDFRef } from "pdf-lib";
import { type EditorDocument, type Page, fieldKey, sourceBytes } from "./model";
import { copyPagesWithForms, removeOrphanWidgets } from "./copyForms";
import { writeValue } from "./nativeFields";
import { drawObjects, embedFonts, type FontData } from "./drawObjects";
import { addAuthoredFields } from "./authoredFields";
import { validateText } from "./textValidation";
import { updateChoiceAppearances } from "./choiceFields";
import { writeComments } from "./exportComments";

export function canPreserveCatalog(document: EditorDocument, pages: Page[]) {
  const source = preservedSource(document, pages);
  return source !== undefined;
}
function preservedSource(document: EditorDocument, pages: Page[]) {
  const source = document.sources.find((candidate) => candidate.id === pages[0]?.sourceId);
  if (!source) return undefined;
  return pages.length === source.pageCount &&
    pages.every((p) => p.sourceId === source.id) &&
    new Set(pages.map((p) => p.sourceIndex)).size === source.pageCount
    ? source
    : undefined;
}
async function preserveDocument(document: EditorDocument, pages: Page[]) {
  const source = preservedSource(document, pages)!;
  const pdf = await PDFDocument.load(sourceBytes(source), { updateMetadata: false });
  const originalPages = pdf.getPages();
  for (let i = pdf.getPageCount() - 1; i >= 0; i--) pdf.removePage(i);
  for (const page of pages) {
    const original = originalPages[page.sourceIndex];
    original.setRotation(degrees(page.rotation));
    pdf.addPage(original);
  }
  for (const field of pdf.getForm().getFields()) {
    const value = document.values[fieldKey(source.id, field.getName())];
    if (value !== undefined) writeValue(field, value);
  }
  pdf.catalog.delete(PDFName.of("OpenAction"));
  return pdf;
}
async function composeDocument(
  document: EditorDocument,
  pages: Page[],
  sourceCache: Map<string, PDFDocument>
) {
  const pdf = await PDFDocument.create();
  const loaded = new Map<string, PDFDocument>();
  for (const source of document.sources) {
    if (!pages.some((page) => page.sourceId === source.id)) continue;
    if (source.structuralWarnings.length)
      throw new Error(
        `Page extraction/merge would discard ${source.structuralWarnings.join(", ")} in ${source.name}. Export the complete original document instead.`
      );
    let original = sourceCache.get(source.id);
    if (!original) {
      original = await PDFDocument.load(sourceBytes(source));
      sourceCache.set(source.id, original);
    }
    loaded.set(source.id, original);
  }
  // Graft each source once, then reorder the copied pages to the requested order.
  const positions = new Map<string, number>();
  for (const [sourceId, source] of loaded) {
    const selected = pages.filter((page) => page.sourceId === sourceId);
    const offset = pdf.getPageCount();
    const { mapping } = await copyPagesWithForms(pdf, source, selected, sourceId);
    selected.forEach((page, index) => positions.set(page.id, offset + index));
    writeMappedValues(pdf, sourceId, mapping, document);
  }
  const copied = pdf.getPages();
  for (let i = pdf.getPageCount() - 1; i >= 0; i--) pdf.removePage(i);
  for (const page of pages) {
    const position = positions.get(page.id);
    if (position === undefined) {
      const blank = pdf.addPage([page.box.width, page.box.height]);
      blank.setRotation(degrees(page.rotation));
      blank.setMediaBox(page.box.x, page.box.y, page.box.width, page.box.height);
      blank.setCropBox(page.box.x, page.box.y, page.box.width, page.box.height);
    } else pdf.addPage(copied[position]);
  }
  pdf.setTitle(document.name.replace(/\.pdf$/i, ""));
  pdf.setCreator("PDFree · Ahara");
  return pdf;
}
function writeMappedValues(
  pdf: PDFDocument,
  sourceId: string,
  mapping: Map<string, string>,
  document: EditorDocument
) {
  for (const [name, copiedName] of mapping) {
    const value = document.values[fieldKey(sourceId, name)];
    if (value === undefined) continue;
    const field = pdf.getForm().getField(copiedName);
    if (
      field instanceof PDFRadioGroup &&
      typeof value === "string" &&
      value &&
      !field.getOptions().includes(value)
    ) {
      const original = document.sources
        .find((source) => source.id === sourceId)
        ?.fields.find((candidate) => candidate.name === name);
      if (!original?.options.includes(value))
        throw new Error(`The value of ${name} is not one of its options.`);
      field.clear();
    } else writeValue(field, value);
  }
}
export async function prepareExport(
  document: EditorDocument,
  selectedIds: string[] = [],
  sourceCache = new Map<string, PDFDocument>()
) {
  const pages = selectedIds.length
    ? selectedIds.map((id) => {
        const page = document.pages.find((candidate) => candidate.id === id);
        if (!page) throw new Error("An export page no longer exists.");
        return page;
      })
    : document.pages;
  if (new Set(pages.map((page) => page.id)).size !== pages.length)
    throw new Error("Choose each export page only once.");
  if (!pages.length) throw new Error("Choose at least one page to export.");
  const pdf = canPreserveCatalog(document, pages)
    ? await preserveDocument(document, pages)
    : await composeDocument(document, pages, sourceCache);
  writeComments(pdf, pages);
  removeOrphanWidgets(pdf);
  return { pdf, pages };
}
function flattenFields(pdf: PDFDocument) {
  const form = pdf.getForm();
  const widgets = new Set(
    form
      .getFields()
      .flatMap((field) =>
        field.acroField.getWidgets().map((widget) => pdf.context.getObjectRef(widget.dict))
      )
  );
  form.flatten();
  // pdf-lib removes widget dictionaries but leaves some page annotation references.
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    if (!annotations) continue;
    for (let index = annotations.size() - 1; index >= 0; index--) {
      const annotation = annotations.get(index);
      if (annotation instanceof PDFRef && widgets.has(annotation)) annotations.remove(index);
    }
  }
}
export async function exportPdf(
  document: EditorDocument,
  flatten = false,
  selectedIds: string[] = [],
  fontData: FontData | null = null,
  sourceCache = new Map<string, PDFDocument>()
) {
  const { pdf, pages } = await prepareExport(document, selectedIds, sourceCache);
  const fonts = await embedFonts(pdf, fontData);
  validateText(document, pages, fonts);
  addAuthoredFields(pdf, pages, fonts);
  await drawObjects(pdf, pages, document, fonts);
  updateChoiceAppearances(pdf, fonts.sans);
  pdf.getForm().updateFieldAppearances(fonts.sans);
  if (flatten) flattenFields(pdf);
  return pdf.save();
}
