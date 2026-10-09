import { OPS } from "pdfjs-dist";
import { type EditorDocument, type Page } from "../core/model";
import { sourcePdf } from "./viewer";

/**
 * What a page's original content offers for OCR: real PDF text, a scanned
 * image without text, vector drawing without text (such as outlined lettering),
 * or nothing painted at all (blank and inserted pages).
 */
export type PageContent = "text" | "scan" | "graphics" | "empty";

const cache = new Map<string, Promise<PageContent>>();
const imageOperators = new Set<number>([
  OPS.paintImageXObject,
  OPS.paintInlineImageXObject,
  OPS.paintImageXObjectRepeat,
]);
const drawingOperators = new Set<number>([OPS.constructPath, OPS.rawFillPath, OPS.shadingFill]);

export function pageContent(document: EditorDocument, page: Page): Promise<PageContent> {
  const source = document.sources.find((source) => source.id === page.sourceId);
  if (!source) return Promise.resolve("empty");
  // Sources are immutable, so the answer for one source page never changes.
  const key = `${source.id}:${page.sourceIndex}`;
  let content = cache.get(key);
  if (!content) {
    content = classify(document, page);
    cache.set(key, content);
    content.catch(() => cache.delete(key));
  }
  return content;
}
/** Pages OCR can read: anything painted that is not already PDF text. */
export const recognizable = (content: PageContent) => content === "scan" || content === "graphics";

async function classify(document: EditorDocument, page: Page): Promise<PageContent> {
  const source = document.sources.find((source) => source.id === page.sourceId)!;
  const original = await (await sourcePdf(source)).getPage(page.sourceIndex + 1);
  const text = await original.getTextContent();
  if (text.items.some((item) => "str" in item && item.str.trim())) return "text";
  const { fnArray } = await original.getOperatorList({ annotationMode: 0 });
  if (fnArray.some((operator) => imageOperators.has(operator))) return "scan";
  return fnArray.some((operator) => drawingOperators.has(operator)) ? "graphics" : "empty";
}
