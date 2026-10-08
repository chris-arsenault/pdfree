import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFObject,
  PDFPage,
  PDFRef,
} from "pdf-lib";
import { type Page, type PdfComment } from "./model";
import { annotationText, annotationType, commentReadOnly } from "./importComments";

const name = PDFName.of;
type Annotation = { dict: PDFDict; ref: PDFObject };
type LiveAnnotation = { dict: PDFDict; ref: PDFRef };
function pdfDate(value: string) {
  if (value.startsWith("D:")) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? `D:${date.toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z`
    : "";
}
function writeText(dict: PDFDict, comment: PdfComment) {
  if (annotationText(dict, "Contents") !== comment.text) {
    dict.set(name("Contents"), PDFHexString.fromText(comment.text));
    dict.delete(name("RC"));
    dict.set(name("M"), PDFHexString.fromText(pdfDate(comment.modifiedAt)));
  }
}
function newAnnotation(pdf: PDFDocument, page: PDFPage, comment: PdfComment) {
  const dict = pdf.context.obj({
    Type: "Annot",
    Subtype: "Text",
    Name: "Comment",
    P: page.ref,
    Rect: [comment.x, comment.y, comment.x + comment.width, comment.y + comment.height],
    Contents: PDFHexString.fromText(comment.text),
    T: PDFHexString.fromText(comment.author),
    CreationDate: PDFHexString.fromText(pdfDate(comment.createdAt)),
    M: PDFHexString.fromText(pdfDate(comment.modifiedAt)),
    F: 4,
    C: [0.15, 0.46, 0.39],
    Open: false,
  });
  const appearance = pdf.context.flateStream(
    "q 0.15 0.46 0.39 rg 1 5 m 23 5 l 23 23 l 1 23 l h f 5 5 m 5 0 l 11 5 l h f 1 1 1 RG 1.5 w 5 17 m 19 17 l S 5 12 m 16 12 l S Q",
    { Type: "XObject", Subtype: "Form", BBox: [0, 0, 24, 24], Resources: {} }
  );
  dict.set(name("AP"), pdf.context.obj({ N: pdf.context.register(appearance) }));
  const ref = pdf.context.register(dict);
  page.node.addAnnot(ref);
  return { dict, ref };
}

export function writeComments(pdf: PDFDocument, pages: Page[]) {
  pages.forEach((page, index) => writePageComments(pdf, pdf.getPage(index), page));
}
function writePageComments(pdf: PDFDocument, output: PDFPage, page: Page) {
  if (!page.comments) return;
  const annots = output.node.Annots();
  const originals = Array.from({ length: annots?.size() ?? 0 }, (_, index) => ({
    dict: annots!.lookup(index, PDFDict),
    ref: annots!.get(index),
  }));
  removeDeletedNotes(annots, originals, page.comments);
  const live = new Map<string, LiveAnnotation>();
  for (const comment of page.comments)
    live.set(comment.id, writeComment(pdf, output, comment, originals));
  for (const comment of page.comments) writeReply(comment, live);
}
function removeDeletedNotes(
  annots: PDFArray | undefined,
  originals: Annotation[],
  comments: PdfComment[]
) {
  const kept = new Set(comments.map((comment) => comment.annotationIndex));
  const removed = new Set(
    originals
      .filter((item, index) => !commentReadOnly(item.dict) && !kept.has(index))
      .map((item) => item.dict)
  );
  for (let index = originals.length - 1; index >= 0; index--) {
    const dict = originals[index].dict;
    if (
      removed.has(dict) ||
      (annotationType(dict) === "Popup" && removed.has(dict.lookupMaybe(name("Parent"), PDFDict)!))
    )
      annots!.remove(index);
  }
}
function writeComment(
  pdf: PDFDocument,
  output: PDFPage,
  comment: PdfComment,
  originals: Annotation[]
): LiveAnnotation {
  const existing =
    comment.annotationIndex === null ? undefined : originals[comment.annotationIndex];
  if (comment.annotationIndex !== null && !existing)
    throw new Error("This comment refers to a missing PDF annotation.");
  if (existing && commentReadOnly(existing.dict) && !comment.readOnly)
    throw new Error("This PDF comment is read-only.");
  const item = annotationFor(pdf, output, comment, existing);
  if (!comment.readOnly && annotationType(item.dict) !== "Text")
    throw new Error("This markup comment cannot be edited.");
  if (!comment.readOnly) {
    writeText(item.dict, comment);
    item.dict.set(name("NM"), PDFHexString.fromText(comment.id));
  }
  item.dict.set(name("P"), output.ref);
  return item;
}
function annotationFor(
  pdf: PDFDocument,
  output: PDFPage,
  comment: PdfComment,
  existing: Annotation | undefined
) {
  if (!existing) return newAnnotation(pdf, output, comment);
  return {
    dict: existing.dict,
    ref: existing.ref instanceof PDFRef ? existing.ref : pdf.context.register(existing.dict),
  };
}
function writeReply(comment: PdfComment, live: Map<string, LiveAnnotation>) {
  if (comment.readOnly) return;
  const dict = live.get(comment.id)!.dict;
  if (!comment.parentId) {
    dict.delete(name("IRT"));
    dict.delete(name("RT"));
    return;
  }
  const parent = live.get(comment.parentId);
  if (!parent) throw new Error("This comment refers to a missing reply thread.");
  dict.set(name("IRT"), parent.ref);
  dict.set(name("RT"), name("R"));
}
