import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFStream,
  concatTransformationMatrix,
  degrees,
  drawObject,
  popGraphicsState,
  pushGraphicsState,
} from "pdf-lib";
import { visiblePageBox } from "./visiblePage";
import { transformedBounds, type Matrix } from "./affine";
import { z } from "zod";
const nupSchema = z.object({
  count: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(6)]),
  paper: z.enum(["letter", "a4", "legal"]),
  landscape: z.boolean(),
  order: z.enum(["rows", "columns"]),
  margin: z.number().finite().min(0).max(100),
});
export type NupOptions = {
  count: 1 | 2 | 4 | 6;
  paper: "letter" | "a4" | "legal";
  landscape: boolean;
  order: "rows" | "columns";
  margin: number;
};
export const defaultNup: NupOptions = {
  count: 1,
  paper: "letter",
  landscape: false,
  order: "rows",
  margin: 18,
};
function numbers(array: PDFArray | undefined, fallback: number[]) {
  return array
    ? Array.from({ length: array.size() }, (_, index) => array.lookup(index, PDFNumber).asNumber())
    : fallback;
}
function bakeAnnotations(pdf: PDFDocument) {
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    for (let index = 0; index < (annotations?.size() ?? 0); index++) {
      const annotation = annotations!.lookup(index, PDFDict);
      bakeAnnotation(pdf, page, annotation);
    }
    page.node.delete(PDFName.of("Annots"));
  }
}
function appearanceFor(annotation: PDFDict) {
  const normal = annotation.lookupMaybe(PDFName.of("AP"), PDFDict)?.lookup(PDFName.of("N"));
  if (!(normal instanceof PDFDict)) return normal;
  const state = annotation.get(PDFName.of("AS"));
  return state instanceof PDFName ? normal.lookup(state) : undefined;
}
function bakeAnnotation(
  pdf: PDFDocument,
  page: ReturnType<PDFDocument["getPage"]>,
  annotation: PDFDict
) {
  const subtype = annotation.get(PDFName.of("Subtype"))?.toString();
  if (!printableAnnotation(annotation, subtype)) return;
  const appearance = appearanceFor(annotation);
  if (!(appearance instanceof PDFStream)) {
    if (subtype === "/Link") return;
    throw new Error(
      `The ${subtype ?? "unknown"} annotation has no supported appearance. N-up cannot safely bake it.`
    );
  }
  const { sx, sy, x, y, rect } = appearancePlacement(appearance, annotation);
  const ref = pdf.context.getObjectRef(appearance) ?? pdf.context.register(appearance);
  const key = page.node.newXObject("PrintAnnotation", ref);
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(sx, 0, 0, sy, rect[0] - x * sx, rect[1] - y * sy),
    drawObject(key),
    popGraphicsState()
  );
}
function printableAnnotation(annotation: PDFDict, subtype: string | undefined) {
  const flags = annotation.lookupMaybe(PDFName.of("F"), PDFNumber)?.asNumber() ?? 0;
  if (flags & 35 || subtype === "/Popup") return false;
  if (flags & 24) throw new Error("N-up cannot preserve annotations with fixed zoom or rotation.");
  return true;
}
function appearancePlacement(appearance: PDFStream, annotation: PDFDict) {
  const bbox = numbers(appearance.dict.lookupMaybe(PDFName.of("BBox"), PDFArray), []);
  const rect = numbers(annotation.lookupMaybe(PDFName.of("Rect"), PDFArray), []);
  const matrix = numbers(
    appearance.dict.lookupMaybe(PDFName.of("Matrix"), PDFArray),
    [1, 0, 0, 1, 0, 0]
  );
  if (bbox.length !== 4 || rect.length !== 4 || matrix.length !== 6)
    throw new Error("Invalid annotation appearance geometry.");
  const { x, y, width, height } = transformedBounds(
    { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] },
    matrix as unknown as Matrix
  );
  if (!width || !height) throw new Error("Empty annotation appearance.");
  const sx = (rect[2] - rect[0]) / width,
    sy = (rect[3] - rect[1]) / height;
  return { sx, sy, x, y, rect };
}
export async function nupPdf(bytes: Uint8Array, options: NupOptions) {
  if (options.count === 1) return bytes;
  nupSchema.parse(options);
  const source = await PDFDocument.load(bytes);
  if (source.getForm().getFields().length)
    throw new Error("Flatten fields before preparing a print layout.");
  bakeAnnotations(source);
  const output = await PDFDocument.create();
  const paper = { letter: [612, 792], a4: [595.28, 841.89], legal: [612, 1008] }[options.paper];
  const [width, height] = options.landscape ? [paper[1], paper[0]] : paper;
  const columns = nupColumns(options);
  const rows = options.count / columns,
    gap = options.margin;
  const cellWidth = (width - gap * (columns + 1)) / columns,
    cellHeight = (height - gap * (rows + 1)) / rows;
  if (cellWidth <= 0 || cellHeight <= 0) throw new Error("Margins leave no printable area.");
  let sheet = output.addPage([width, height]);
  for (const [index, page] of source.getPages().entries()) {
    if (index && index % options.count === 0) sheet = output.addPage([width, height]);
    await placePage(output, sheet, page, index, options, {
      width,
      height,
      columns,
      rows,
      gap,
      cellWidth,
      cellHeight,
    });
  }
  output.setTitle("Printable page layout");
  output.setCreator("PDFree · Ahara");
  return output.save();
}
function nupColumns(options: NupOptions) {
  if (options.count === 2) return options.landscape ? 2 : 1;
  return options.landscape && options.count === 6 ? 3 : 2;
}
async function placePage(
  output: PDFDocument,
  sheet: ReturnType<PDFDocument["getPage"]>,
  page: ReturnType<PDFDocument["getPage"]>,
  index: number,
  options: NupOptions,
  layout: {
    width: number;
    height: number;
    columns: number;
    rows: number;
    gap: number;
    cellWidth: number;
    cellHeight: number;
  }
) {
  const { height, columns, rows, gap, cellWidth, cellHeight } = layout;
  const slot = index % options.count;
  const column = options.order === "rows" ? slot % columns : Math.floor(slot / rows);
  const row = options.order === "rows" ? Math.floor(slot / columns) : slot % rows;
  const box = visiblePageBox(page),
    angle = (-page.getRotation().angle * Math.PI) / 180;
  const displayedWidth =
    Math.abs(Math.cos(angle)) * box.width + Math.abs(Math.sin(angle)) * box.height;
  const displayedHeight =
    Math.abs(Math.sin(angle)) * box.width + Math.abs(Math.cos(angle)) * box.height;
  const scale = Math.min(cellWidth / displayedWidth, cellHeight / displayedHeight);
  const corners = [
    [0, 0],
    [box.width, 0],
    [0, box.height],
    [box.width, box.height],
  ].map(([x, y]) => [
    x * Math.cos(angle) - y * Math.sin(angle),
    x * Math.sin(angle) + y * Math.cos(angle),
  ]);
  const embedded = await output.embedPage(page, {
    left: box.x,
    bottom: box.y,
    right: box.x + box.width,
    top: box.y + box.height,
  });
  sheet.drawPage(embedded, {
    x:
      gap +
      column * (cellWidth + gap) +
      (cellWidth - displayedWidth * scale) / 2 -
      Math.min(...corners.map((point) => point[0])) * scale,
    y:
      height -
      gap -
      (row + 1) * cellHeight -
      row * gap +
      (cellHeight - displayedHeight * scale) / 2 -
      Math.min(...corners.map((point) => point[1])) * scale,
    xScale: scale,
    yScale: scale,
    rotate: degrees(-page.getRotation().angle),
  });
}
