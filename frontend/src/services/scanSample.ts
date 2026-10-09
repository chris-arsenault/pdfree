import { type EditorDocument } from "../core/model";
import { analyzeScan, pixelLevels, type ScanAnalysis } from "../core/scanAnalysis";
import { sourcePdf } from "./viewer";

/** A page rendered without cleanup, crop or rotation, as the cleanup pipeline sees it. */
export type ScanSample = {
  pageId: string;
  pixels: ImageData;
  /** Original visible page size in PDF points. */
  width: number;
  height: number;
  pointsPerPixel: number;
};
// Large enough to measure 0.1° of tilt across a page, small enough to analyze quickly.
const sampleEdge = 1400;

export async function renderSample(
  document: EditorDocument,
  pageId: string,
  signal: AbortSignal
): Promise<ScanSample> {
  const page = document.pages.find((page) => page.id === pageId);
  const source = document.sources.find((source) => source.id === page?.sourceId);
  if (!page || !source) throw new Error("Inserted blank pages have no scan to analyze.");
  const original = await (await sourcePdf(source)).getPage(page.sourceIndex + 1);
  const size = original.getViewport({ scale: 1, rotation: 0 });
  const scale = Math.min(2, sampleEdge / Math.max(size.width, size.height));
  const viewport = original.getViewport({ scale, rotation: 0 });
  const canvas = window.document.createElement("canvas");
  try {
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const rendering = original.render({ canvas, viewport, annotationMode: 0 });
    const cancel = () => rendering.cancel();
    signal.addEventListener("abort", cancel, { once: true });
    try {
      await rendering.promise;
    } finally {
      signal.removeEventListener("abort", cancel);
    }
    if (signal.aborted) throw new DOMException("Analysis canceled.", "AbortError");
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    return {
      pageId,
      pixels: context.getImageData(0, 0, canvas.width, canvas.height),
      width: size.width,
      height: size.height,
      pointsPerPixel: size.width / canvas.width,
    };
  } finally {
    canvas.width = canvas.height = 0;
  }
}

export function analyzeSample(sample: ScanSample): ScanAnalysis {
  const { data, width, height } = sample.pixels;
  return analyzeScan(pixelLevels(data, width, height), sample.pointsPerPixel);
}

/** Renders and analyzes each page in turn; used when every page gets its own settings. */
export async function analyzePages(
  document: EditorDocument,
  ids: string[],
  signal: AbortSignal,
  progress: (message: string) => void
) {
  const results = new Map<string, ScanAnalysis>();
  for (const [index, id] of ids.entries()) {
    progress(`Analyzing page ${index + 1} of ${ids.length}`);
    results.set(id, analyzeSample(await renderSample(document, id, signal)));
    // Yield between pages so progress and Cancel stay responsive.
    await new Promise((resolve) => setTimeout(resolve));
    if (signal.aborted) throw new DOMException("Analysis canceled.", "AbortError");
  }
  return results;
}
