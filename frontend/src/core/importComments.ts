import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
} from "pdf-lib";
import { type PdfComment, newId } from "./model";
import { validateCommentThreads } from "./comments";

const markupTypes = new Set([
  "Text",
  "FreeText",
  "Line",
  "Square",
  "Circle",
  "Polygon",
  "PolyLine",
  "Highlight",
  "Underline",
  "Squiggly",
  "StrikeOut",
  "Stamp",
  "Caret",
  "Ink",
  "FileAttachment",
  "Redact",
]);
export const annotationType = (dict: PDFDict) =>
  dict.get(PDFName.of("Subtype"))?.toString().slice(1) ?? "";
export const commentReadOnly = (dict: PDFDict) =>
  annotationType(dict) !== "Text" ||
  dict.has(PDFName.of("State")) ||
  dict.get(PDFName.of("RT"))?.toString() === "/Group" ||
  ((dict.lookupMaybe(PDFName.of("F"), PDFNumber)?.asNumber() ?? 0) & (64 | 128 | 512)) !== 0;
export function annotationText(dict: PDFDict, key: string) {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFString || value instanceof PDFHexString ? value.decodeText() : "";
}

export function readComments(pdf: PDFDocument) {
  const warnings: string[] = [];
  const records = new Map<PDFDict, PdfComment>();
  const pages = pdf
    .getPages()
    .map((page) => readPageComments(page.node.Annots(), warnings, records));
  for (const [dict, comment] of records) {
    const parent = dict.lookupMaybe(PDFName.of("IRT"), PDFDict);
    if (parent && !comment.parentId) {
      const target = records.get(parent);
      if (target) target.readOnly = true;
    }
  }
  const visible = visibleComments(records);
  return {
    pages: pages.map((page) => page.filter((comment) => visible.has(comment.id))),
    warnings: [...new Set(warnings)],
  };
}
function visibleComments(records: Map<PDFDict, PdfComment>) {
  const visible = new Set<string>();
  for (const [dict, comment] of records) {
    if (annotationType(dict) === "Text" || comment.text.trim() || comment.parentId)
      visible.add(comment.id);
    const parent = dict.lookupMaybe(PDFName.of("IRT"), PDFDict);
    const target = parent ? records.get(parent) : undefined;
    if (target) visible.add(target.id);
  }
  return visible;
}
function describeComment(dict: PDFDict, annotationIndex: number): PdfComment {
  const rect = dict.lookupMaybe(PDFName.of("Rect"), PDFArray);
  const bounds = rect
    ? [0, 1, 2, 3].map((index) => rect.lookup(index, PDFNumber).asNumber())
    : [0, 0, 24, 24];
  const comment = {
    id: newId(),
    annotationIndex,
    parentId: null,
    x: Math.min(bounds[0], bounds[2]),
    y: Math.min(bounds[1], bounds[3]),
    width: Math.abs(bounds[2] - bounds[0]),
    height: Math.abs(bounds[3] - bounds[1]),
    text: annotationText(dict, "Contents"),
    author: annotationText(dict, "T"),
    createdAt: annotationText(dict, "CreationDate"),
    modifiedAt: annotationText(dict, "M"),
    readOnly: commentReadOnly(dict),
  };
  if (
    comment.text.length > 100_000 ||
    comment.author.length > 200 ||
    [comment.x, comment.y, comment.width, comment.height].some(
      (value) => !Number.isFinite(value) || Math.abs(value) > 100_000
    )
  )
    throw new Error("This PDF comment exceeds the supported text or coordinate limits.");
  return comment;
}
function readPageComments(
  annotations: PDFArray | undefined,
  warnings: string[],
  allRecords: Map<PDFDict, PdfComment>
) {
  const records: { dict: PDFDict; comment: PdfComment }[] = [];
  for (let index = 0; index < (annotations?.size() ?? 0); index++) {
    const dict = annotations!.lookup(index, PDFDict);
    if (!markupTypes.has(annotationType(dict))) continue;
    records.push({ dict, comment: describeComment(dict, index) });
    allRecords.set(dict, records[records.length - 1].comment);
    if (records.length > 10_000)
      throw new Error("This PDF contains more than 10,000 comments on a page.");
  }
  const ids = new Map(records.map((item) => [item.dict, item.comment.id]));
  for (const { dict, comment } of records) {
    const parent = dict.lookupMaybe(PDFName.of("IRT"), PDFDict);
    if (!parent) continue;
    comment.parentId = ids.get(parent) ?? null;
    if (!comment.parentId) {
      comment.readOnly = true;
      warnings.push("comment relationships across pages");
    }
  }
  const comments = records.map((item) => item.comment);
  validateCommentThreads(comments);
  return comments;
}
