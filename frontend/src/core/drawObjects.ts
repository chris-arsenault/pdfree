import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
  degrees,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  concatTransformationMatrix,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { type EditorDocument, type Page, type PlacedObject } from "./model";
export type FontData = { sans: Uint8Array; signature: Uint8Array };
export type Fonts = { sans: PDFFont; signature: PDFFont };
export function pdfColor(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255
  );
}
export async function embedFonts(pdf: PDFDocument, data: FontData | null): Promise<Fonts> {
  if (!data) {
    const sans = await pdf.embedFont(StandardFonts.Helvetica);
    return { sans, signature: await pdf.embedFont(StandardFonts.TimesRomanItalic) };
  }
  pdf.registerFontkit(fontkit);
  return {
    sans: await pdf.embedFont(data.sans, { subset: true }),
    signature: await pdf.embedFont(data.signature, { subset: true }),
  };
}
export function wrapText(text: string, font: PDFFont, size: number, width: number) {
  return text.split("\n").flatMap((paragraph) => {
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, size) > width) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
    return lines;
  });
}
function drawText(page: PDFPage, object: PlacedObject, fonts: Fonts) {
  const font = fonts[object.font];
  const lines = wrapText(object.text, font, object.fontSize, object.width);
  page.pushOperators(
    pushGraphicsState(),
    rectangle(object.x, object.y, object.width, object.height),
    clip(),
    endPath()
  );
  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, object.fontSize);
    let offset = 0;
    if (object.align === "center") offset = (object.width - width) / 2;
    if (object.align === "right") offset = object.width - width;
    page.drawText(line, {
      x: object.x + offset,
      y: object.y + object.height - object.fontSize - index * object.fontSize * 1.25,
      size: object.fontSize,
      font,
      color: pdfColor(object.color),
      opacity: object.opacity,
      rotate: degrees(object.rotation),
    });
  });
  page.pushOperators(popGraphicsState());
}
function drawMark(page: PDFPage, object: PlacedObject) {
  const { x, y, width: w, height: h } = object;
  const points =
    object.kind === "check"
      ? [
          { x: x + w * 0.1, y: y + h * 0.5 },
          { x: x + w * 0.4, y: y + h * 0.2 },
          { x: x + w * 0.9, y: y + h * 0.9 },
        ]
      : [
          { x, y },
          { x: x + w, y: y + h },
          { x: x + w, y },
          { x, y: y + h },
        ];
  const options = {
    color: pdfColor(object.color),
    thickness: object.strokeWidth,
    opacity: object.opacity,
  };
  page.drawLine({ start: points[0], end: points[1], ...options });
  page.drawLine({
    start: points[object.kind === "check" ? 1 : 2],
    end: points[object.kind === "check" ? 2 : 3],
    ...options,
  });
}
function drawLines(page: PDFPage, object: PlacedObject) {
  const points = object.points.length
    ? object.points.map((p) => ({
        x: object.x + p.x * object.width,
        y: object.y + p.y * object.height,
      }))
    : [
        { x: object.x, y: object.y },
        { x: object.x + object.width, y: object.y + object.height },
      ];
  for (let i = 1; i < points.length; i++)
    page.drawLine({
      start: points[i - 1],
      end: points[i],
      color: pdfColor(object.color),
      thickness: object.strokeWidth,
      opacity: object.opacity,
    });
  if (object.kind === "arrow") {
    const end = points[1],
      angle = Math.atan2(end.y - points[0].y, end.x - points[0].x);
    for (const delta of [-0.5, 0.5])
      page.drawLine({
        start: end,
        end: { x: end.x - 12 * Math.cos(angle + delta), y: end.y - 12 * Math.sin(angle + delta) },
        color: pdfColor(object.color),
        thickness: object.strokeWidth,
        opacity: object.opacity,
      });
  }
}
export async function drawObject(
  pdf: PDFDocument,
  page: PDFPage,
  object: PlacedObject,
  document: EditorDocument,
  fonts: Fonts
) {
  if (object.kind === "text" || object.kind === "stamp") return drawText(page, object, fonts);
  if (object.kind === "check" || object.kind === "cross") return drawMark(page, object);
  if (["ink", "line", "arrow"].includes(object.kind)) return drawLines(page, object);
  if (object.kind === "rectangle" || object.kind === "highlight") drawRectangle(page, object);
  if (object.kind === "image") await drawImage(pdf, page, object, document);
}
function drawRectangle(page: PDFPage, object: PlacedObject) {
  page.drawRectangle({
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    color: object.kind === "highlight" ? pdfColor(object.color) : undefined,
    borderColor: pdfColor(object.color),
    borderWidth: object.kind === "highlight" ? 0 : object.strokeWidth,
    borderOpacity: object.opacity,
    opacity: object.opacity,
    rotate: degrees(object.rotation),
  });
}
async function drawImage(
  pdf: PDFDocument,
  page: PDFPage,
  object: PlacedObject,
  document: EditorDocument
) {
  const asset = document.assets.find((item) => item.id === object.assetId);
  if (!asset) throw new Error("An image is missing from this project.");
  const image =
    asset.mime === "image/jpeg" ? await pdf.embedJpg(asset.data) : await pdf.embedPng(asset.data);
  page.drawImage(image, {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    opacity: object.opacity,
    rotate: degrees(object.rotation),
  });
}
export async function drawObjects(
  pdf: PDFDocument,
  pages: Page[],
  document: EditorDocument,
  fonts: Fonts
) {
  for (let index = 0; index < pages.length; index++) {
    for (const object of pages[index].objects) {
      const page = pdf.getPage(index),
        radians = (object.rotation * Math.PI) / 180;
      page.pushOperators(
        pushGraphicsState(),
        concatTransformationMatrix(
          Math.cos(radians),
          Math.sin(radians),
          -Math.sin(radians),
          Math.cos(radians),
          object.x,
          object.y
        )
      );
      await drawObject(pdf, page, { ...object, x: 0, y: 0, rotation: 0 }, document, fonts);
      page.pushOperators(popGraphicsState());
    }
  }
}
