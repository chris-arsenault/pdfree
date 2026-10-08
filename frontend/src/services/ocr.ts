import { recognitionEngine } from "./ocrClient";
import { type EditorDocument, type Recognition } from "../core/model";
import { viewedPage } from "./viewer";
import { type PDFPageProxy, type PageViewport } from "pdfjs-dist";
import { type Block } from "tesseract.js";

export async function recognizePages(
  document: EditorDocument,
  ids: string[],
  signal: AbortSignal,
  progress: (message: string) => void
) {
  let worker: Awaited<ReturnType<typeof recognitionEngine>> | null = null;
  const check = () => {
    if (signal.aborted) throw new DOMException("Recognition canceled.", "AbortError");
  };
  const results = new Map<string, Recognition>();
  let skipped = 0;
  try {
    check();
    for (const [index, id] of ids.entries()) {
      check();
      const page = document.pages.find((page) => page.id === id);
      if (!page?.sourceId) {
        skipped++;
        continue;
      }
      const view = await viewedPage(document, {
        ...page,
        scan: page.scan ? { ...page.scan, angle: 0 } : null,
      });
      try {
        const original = view.page,
          content = await original.getTextContent();
        if (content.items.some((item) => "str" in item && item.str.trim())) {
          skipped++;
          continue;
        }
        progress(`Recognizing page ${index + 1} of ${ids.length}`);
        worker ??= await recognitionEngine(signal, progress);
        results.set(id, await recognizeImage(original, worker, signal));
      } finally {
        view.release();
      }
    }
    return {
      document: {
        ...document,
        pages: document.pages.map((page) =>
          results.has(page.id) ? { ...page, recognition: results.get(page.id)! } : page
        ),
      },
      skipped,
    };
  } finally {
    worker?.terminate();
  }
}
async function recognizeImage(
  original: PDFPageProxy,
  worker: Awaited<ReturnType<typeof recognitionEngine>>,
  signal: AbortSignal
): Promise<Recognition> {
  const check = () => {
    if (signal.aborted) throw new DOMException("Recognition canceled.", "AbortError");
  };
  // Recognition coordinates are measured against original unrotated PDF
  // coordinates; the durable deskew transform is applied at display/export.
  const size = original.getViewport({ scale: 1, rotation: 0 });
  const scale = Math.min(
    3,
    4096 / Math.max(size.width, size.height),
    Math.sqrt((12 * 1024 * 1024) / (size.width * size.height))
  );
  const viewport = original.getViewport({ scale, rotation: 0 });
  const canvas = window.document.createElement("canvas");
  try {
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const rendering = original.render({ canvas, viewport, annotationMode: 0 });
    const cancelRender = () => rendering.cancel();
    signal.addEventListener("abort", cancelRender, { once: true });
    try {
      await rendering.promise;
    } finally {
      signal.removeEventListener("abort", cancelRender);
    }
    check();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("Could not prepare recognition image.")),
        "image/png"
      )
    );
    const blocks = await worker.recognize(blob);
    check();
    return {
      engine: "tesseract-7",
      language: "eng",
      words: recognizedWords(blocks, viewport, scale),
    };
  } finally {
    canvas.width = canvas.height = 0;
    original.cleanup();
  }
}
function recognizedWords(blocks: Block[], viewport: PageViewport, scale: number) {
  return blocks
    .flatMap((block) =>
      block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => line.words))
    )
    .filter(
      (word) => word.text.trim() && word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0
    )
    .map((word) => {
      const [x, y] = viewport.convertToPdfPoint(word.bbox.x0, word.bbox.y1);
      return {
        text: word.text,
        confidence: Math.max(0, Math.min(100, word.confidence)),
        x,
        y,
        width: (word.bbox.x1 - word.bbox.x0) / scale,
        height: (word.bbox.y1 - word.bbox.y0) / scale,
      };
    });
}
