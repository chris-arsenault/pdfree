import { type PDFPage } from "pdf-lib";
import { type Page } from "./model";

function normalizedBox(box: Page["box"]): Page["box"] {
  return {
    x: Math.min(box.x, box.x + box.width),
    y: Math.min(box.y, box.y + box.height),
    width: Math.abs(box.width),
    height: Math.abs(box.height),
  };
}

export function visiblePageBox(page: PDFPage): Page["box"] {
  const media = normalizedBox(page.getMediaBox()),
    crop = normalizedBox(page.getCropBox());
  const x = Math.max(media.x, crop.x),
    y = Math.max(media.y, crop.y);
  const width = Math.min(media.x + media.width, crop.x + crop.width) - x;
  const height = Math.min(media.y + media.height, crop.y + crop.height) - y;
  // PDF.js falls back to the MediaBox when the intersection is empty.
  return width > 0 && height > 0 ? { x, y, width, height } : media;
}
