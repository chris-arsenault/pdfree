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

import { adjustPixels, type CleanupOptions } from "./scanAnalysis";

export type { CleanupOptions };
/** Settings for one stable page; pages in one run may each use their own detected values. */
export type PageCleanup = { pageId: string; options: CleanupOptions };
/**
 * Why a page cannot take image corrections or straightening (empty strings mean
 * supported), and whether earlier cleanup or trimming is in effect.
 */
export type ScanSupport = { pageId: string; image: string; straighten: string; cleaned: boolean };
export function deskewMatrix(page: Page) {
  const radians = ((page.scan?.angle ?? 0) * Math.PI) / 180;
  const cos = Math.cos(radians),
    sin = Math.sin(radians);
  const x = page.box.x + page.box.width / 2,
    y = page.box.y + page.box.height / 2;
  return [cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y] as const;
}
/** Each source is parsed once per run, however many of its pages are processed. */
function sourceLoader(document: EditorDocument) {
  const loaded = new Map<string, Promise<PDFDocument>>();
  return (page: Page) => {
    const source = document.sources.find((source) => source.id === page.sourceId);
    if (!source) throw new Error("Scan cleanup requires a source page.");
    if (!loaded.has(source.id)) loaded.set(source.id, PDFDocument.load(sourceBytes(source)));
    return loaded.get(source.id)!;
  };
}
export async function scanSupport(document: EditorDocument, ids: string[]) {
  const load = sourceLoader(document),
    results: ScanSupport[] = [];
  const reason = (work: () => void) => {
    try {
      work();
      return "";
    } catch (error) {
      return (error as Error).message;
    }
  };
  for (const id of ids) {
    const page = document.pages.find((page) => page.id === id);
    if (!page) throw new Error("A selected page no longer exists.");
    if (!page.sourceId) {
      const blank = "Inserted blank pages have no scan image.";
      results.push({ pageId: id, image: blank, straighten: blank, cleaned: false });
      continue;
    }
    const pdf = await load(page);
    const image = reason(() => scanImage(pdf, page.sourceIndex));
    const original = visiblePageBox(pdf.getPage(page.sourceIndex));
    results.push({
      pageId: id,
      image,
      straighten: image || reason(() => validateDeskew(page, pdf, document, 1)),
      cleaned:
        !!page.scan ||
        (["x", "y", "width", "height"] as const).some((key) => page.box[key] !== original[key]),
    });
  }
  return results;
}
export async function cleanupPages(
  document: EditorDocument,
  requests: PageCleanup[],
  progress: (message: string) => void = () => {}
) {
  requests.forEach((request) => cleanupSchema.parse(request.options));
  const assets: Asset[] = [],
    pages = [...document.pages],
    load = sourceLoader(document);
  for (const [index, { pageId: id, options }] of requests.entries()) {
    progress(`Page ${index + 1} of ${requests.length}`);
    const position = pages.findIndex((page) => page.id === id),
      page = pages[position];
    if (!page) throw new Error("A selected page no longer exists.");
    const pdf = await load(page);
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
  // Replaced cleaned images are dropped unless another page or object still uses them.
  const used = new Set(
    pages.flatMap((page) => [
      ...(page.scan ? [page.scan.assetId] : []),
      ...page.objects.flatMap((object) => (object.assetId ? [object.assetId] : [])),
    ])
  );
  const replaced = new Set(
    document.pages.flatMap((page) => (page.scan ? [page.scan.assetId] : []))
  );
  return {
    ...document,
    pages,
    assets: [
      ...document.assets.filter((asset) => !replaced.has(asset.id) || used.has(asset.id)),
      ...assets,
    ],
  };
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
