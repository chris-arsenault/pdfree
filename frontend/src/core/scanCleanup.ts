import {
  PDFDocument,
  PDFDict,
  PDFName,
  concatTransformationMatrix,
  pushGraphicsState,
  popGraphicsState,
} from "pdf-lib";
import { imageCanvas, scanImage, replaceImage } from "./pdfImages";
import { z } from "zod";
import { scanSchema } from "./utilityModel";
import { visiblePageBox } from "./visiblePage";
import { adjustedDestination } from "./utilityNavigation";
import {
  newId,
  sourceBytes,
  type Asset,
  type EditorDocument,
  type Page,
  type ScanAdjustment,
} from "./model";

export type CleanupOptions = {
  angle: number;
  contrast: number;
  background: number;
  crop: { left: number; right: number; top: number; bottom: number };
};
export function deskewMatrix(page: Page) {
  const radians = ((page.scan?.angle ?? 0) * Math.PI) / 180;
  const cos = Math.cos(radians),
    sin = Math.sin(radians);
  const x = page.box.x + page.box.width / 2,
    y = page.box.y + page.box.height / 2;
  return [cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y] as const;
}
export async function cleanupPages(
  document: EditorDocument,
  ids: string[],
  options: CleanupOptions,
  progress: (message: string) => void = () => {}
) {
  cleanupSchema.parse(options);
  const assets: Asset[] = [],
    pages = [...document.pages];
  for (const [index, id] of ids.entries()) {
    progress(`Page ${index + 1} of ${ids.length}`);
    const position = pages.findIndex((page) => page.id === id),
      page = pages[position];
    if (!page) throw new Error("A selected page no longer exists.");
    const source = document.sources.find((source) => source.id === page.sourceId);
    if (!source) throw new Error("Scan cleanup requires a source page.");
    const pdf = await PDFDocument.load(sourceBytes(source));
    let scan: ScanAdjustment | null = null;
    if (options.angle || options.contrast !== 1 || options.background) {
      validateDeskew(page, pdf, document, options.angle);
      const asset = await processedScan(pdf, page.sourceIndex, options);
      assets.push(asset);
      scan = {
        assetId: asset.id,
        angle: options.angle,
        contrast: options.contrast,
        background: options.background,
      };
    }
    const original = visiblePageBox(pdf.getPage(page.sourceIndex));
    const { left, right, top, bottom } = options.crop;
    if (left + right >= original.width || top + bottom >= original.height)
      throw new Error("Crop margins must leave visible page content.");
    pages[position] = {
      ...page,
      scan,
      box: {
        x: original.x + left,
        y: original.y + bottom,
        width: original.width - left - right,
        height: original.height - top - bottom,
      },
    };
  }
  return { ...document, pages, assets: [...document.assets, ...assets] };
}
const margin = z.number().finite().min(0).max(100_000);
const cleanupSchema = scanSchema
  .omit({ assetId: true })
  .extend({ crop: z.object({ left: margin, right: margin, top: margin, bottom: margin }) });
function validateDeskew(page: Page, pdf: PDFDocument, document: EditorDocument, angle: number) {
  if (!angle) return;
  if (page.comments.length || (pdf.getPage(page.sourceIndex).node.Annots()?.size() ?? 0) > 0)
    throw new Error(
      "Deskew pages before adding comments or fields; their annotation geometry cannot safely be rotated."
    );
  const rotated = { ...page, scan: { assetId: "preview", angle, contrast: 1, background: 0 } };
  for (const destination of [
    ...(document.bookmarks ?? []).map((bookmark) => bookmark.destination),
    ...document.pages.flatMap((item) => (item.links ?? []).map((link) => link.destination)),
  ])
    if (destination.pageId === page.id) adjustedDestination(destination, rotated);
}
async function processedScan(
  pdf: PDFDocument,
  index: number,
  options: CleanupOptions
): Promise<Asset> {
  const image = scanImage(pdf, index),
    canvas = await imageCanvas(image.stream);
  try {
    const context = canvas.getContext("2d")!,
      pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    adjustPixels(pixels.data, options);
    context.putImageData(pixels, 0, 0);
    const data = new Uint8Array(
      await (await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 })).arrayBuffer()
    );
    return { id: newId(), name: "Cleaned scan.jpg", data, mime: "image/jpeg" };
  } finally {
    canvas.width = canvas.height = 1;
  }
}
function adjustPixels(data: Uint8ClampedArray, options: CleanupOptions) {
  for (let index = 0; index < data.length; index += 4)
    for (let channel = 0; channel < 3; channel++) {
      let value = (data[index + channel] - 128) * options.contrast + 128;
      if (options.background && value > 255 - options.background) value = 255;
      data[index + channel] = value;
    }
}
export async function applyScan(
  pdf: PDFDocument,
  index: number,
  page: Page,
  document: EditorDocument
) {
  if (!page.scan) return;
  const image = scanImage(pdf, index),
    asset = document.assets.find((asset) => asset.id === page.scan!.assetId);
  if (!asset) throw new Error("Missing cleaned scan image.");
  const embedded = await pdf.embedJpg(asset.data);
  // A resource can be shared by several original pages. Cleanup belongs to one
  // stable page, so give it a private resource dictionary and image reference.
  const target = pdf.getPage(index);
  const resources = target.node.Resources()!.clone(pdf.context);
  const objects = resources.lookup(PDFName.of("XObject"), PDFDict).clone(pdf.context);
  const ref = pdf.context.register(image.stream.clone(pdf.context));
  objects.set(image.name, ref);
  resources.set(PDFName.of("XObject"), objects);
  target.node.set(PDFName.of("Resources"), resources);
  replaceImage(pdf, { ...image, ref }, asset.data, embedded.width, embedded.height);
  if (page.scan.angle) {
    const original = pdf.getPage(index);
    const prefix = pdf.context.contentStream([
      pushGraphicsState(),
      concatTransformationMatrix(...deskewMatrix(page)),
    ]);
    const suffix = pdf.context.contentStream([popGraphicsState()]);
    original.node.wrapContentStreams(pdf.context.register(prefix), pdf.context.register(suffix));
  }
}
