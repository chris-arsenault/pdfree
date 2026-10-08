import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFObjectCopier,
  PDFPage,
  PDFRef,
  PDFRadioGroup,
  PDFField,
  degrees,
} from "pdf-lib";
import { type Page } from "./model";

type CopiedPage = { original: PDFPage; copied: PDFPage };
type CopiedWidget = { ref: PDFRef; originalIndex: number };
const fieldAttributes = ["FT", "Ff", "V", "DV", "DA", "Q", "Opt", "MaxLen", "TU", "TM"];

function widgetsOnPage(pair: CopiedPage, fieldWidgets: PDFDict[]) {
  const original = pair.original.node.Annots();
  const copied = pair.copied.node.Annots();
  const result: CopiedWidget[] = [];
  for (let i = 0; i < (original?.size() ?? 0); i++) {
    const dict = original?.lookup(i, PDFDict);
    if (dict && fieldWidgets.includes(dict) && copied) {
      const ref = copied.get(i);
      if (ref instanceof PDFRef) {
        copied.lookup(i, PDFDict).set(PDFName.of("P"), pair.copied.ref);
        result.push({ ref, originalIndex: fieldWidgets.indexOf(dict) });
      }
    }
  }
  return result;
}
function copyFieldAttributes(
  target: PDFDocument,
  copier: PDFObjectCopier,
  field: PDFField,
  copiedWidgets: CopiedWidget[]
) {
  const dict = target.context.obj({});
  for (const attribute of fieldAttributes) {
    const value = field.acroField.getInheritableAttribute(PDFName.of(attribute));
    if (value) dict.set(PDFName.of(attribute), copier.copy(value));
  }
  if (field instanceof PDFRadioGroup) {
    const choices = field.getOptions();
    dict.set(
      PDFName.of("Opt"),
      target.context.obj(
        copiedWidgets.map((widget) => PDFHexString.fromText(choices[widget.originalIndex]))
      )
    );
  }
  return dict;
}
export async function copyPagesWithForms(
  target: PDFDocument,
  source: PDFDocument,
  pages: Page[],
  sourceId: string
) {
  const pairs: CopiedPage[] = [];
  for (const page of pages) {
    const [copied] = await target.copyPages(source, [page.sourceIndex]);
    copied.setRotation(degrees(page.rotation));
    target.addPage(copied);
    pairs.push({ original: source.getPage(page.sourceIndex), copied });
  }
  const copier = PDFObjectCopier.for(source.context, target.context);
  const form = target.getForm();
  const mapping = new Map<string, string>();
  for (const field of source.getForm().getFields()) {
    const widgets = field.acroField.getWidgets().map((widget) => widget.dict);
    const copiedWidgets = pairs.flatMap((pair) => widgetsOnPage(pair, widgets));
    if (!copiedWidgets.length) continue;
    const kids = copiedWidgets.map((widget) => widget.ref);
    const dict = copyFieldAttributes(target, copier, field, copiedWidgets);
    const name = `${sourceId}_${field.getName()}`;
    dict.set(PDFName.of("T"), PDFHexString.fromText(name));
    dict.set(PDFName.of("Kids"), target.context.obj(kids));
    const ref = target.context.register(dict);
    form.acroForm.addField(ref);
    for (const kid of kids) {
      const widget = target.context.lookup(kid, PDFDict);
      for (const attribute of [...fieldAttributes, "T", "Kids"])
        widget.delete(PDFName.of(attribute));
      widget.set(PDFName.of("Parent"), ref);
    }
    mapping.set(field.getName(), name);
  }
  return { mapping, pairs };
}

export function removeOrphanWidgets(pdf: PDFDocument) {
  const live = new Set(
    pdf
      .getForm()
      .getFields()
      .flatMap((field) => field.acroField.getWidgets().map((w) => w.dict))
  );
  for (const page of pdf.getPages()) {
    const annots = page.node.Annots();
    if (!(annots instanceof PDFArray)) continue;
    for (let i = annots.size() - 1; i >= 0; i--) {
      const annot = annots.lookup(i, PDFDict);
      if (annot.get(PDFName.of("Subtype"))?.toString() === "/Widget" && !live.has(annot))
        annots.remove(i);
    }
  }
}
