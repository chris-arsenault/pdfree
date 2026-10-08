import { defaultObject, type Page } from "./model";
import { toPdf } from "./coordinates";
export function selectedHighlights(surface: HTMLElement, page: Page, zoom: number) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.anchorNode || !surface.contains(selection.anchorNode))
    throw new Error("Select text on the PDF page first.");
  const bounds = surface.getBoundingClientRect(),
    rects = [...selection.getRangeAt(0).getClientRects()];
  const objects = rects
    .filter((rect) => rect.width > 1 && rect.height > 1)
    .map((rect) => {
      const first = toPdf(
        { x: (rect.left - bounds.left) / zoom, y: (rect.top - bounds.top) / zoom },
        page
      );
      const last = toPdf(
        { x: (rect.right - bounds.left) / zoom, y: (rect.bottom - bounds.top) / zoom },
        page
      );
      return {
        ...defaultObject("highlight", {
          x: Math.min(first.x, last.x),
          y: Math.min(first.y, last.y),
        }),
        width: Math.abs(last.x - first.x),
        height: Math.abs(last.y - first.y),
        color: "#f4d344",
      };
    });
  selection.removeAllRanges();
  return objects;
}
