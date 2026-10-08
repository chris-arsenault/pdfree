import { localPdf } from "./viewer";
import { zipSync } from "fflate";
import { type EditorDocument } from "../core/model";
import { runPdfWorker } from "./workerClient";
import { fontData } from "./resources";
import { imageArchiveSize, imageRasterSize } from "./rasterBudget";
import { type PDFPageProxy } from "pdfjs-dist";

export async function pageImages(document: EditorDocument, pageIds: string[]) {
  const bytes = await runPdfWorker<Uint8Array>({
    kind: "export",
    document,
    flatten: true,
    pageIds,
    fonts: await fontData(),
  });
  const pdf = await localPdf(bytes),
    files: Record<string, Uint8Array> = {};
  let archiveSize = 0;
  try {
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index);
      const image = await renderPageImage(page);
      archiveSize = imageArchiveSize(archiveSize, image.length);
      files[`page-${String(index).padStart(3, "0")}.png`] = image;
    }
    return zipSync(files, { level: 0 });
  } finally {
    await pdf.destroy();
  }
}

async function renderPageImage(page: PDFPageProxy) {
  const size = page.getViewport({ scale: 1 });
  const pixels = imageRasterSize(size.width, size.height);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = window.document.createElement("canvas");
  try {
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Page image export failed."))),
        "image/png"
      )
    );
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }
}
