import { type Page, type Point, type Box } from "./model";

export function displaySize(page: Page) {
  return page.rotation % 180 === 0
    ? { width: page.box.width, height: page.box.height }
    : { width: page.box.height, height: page.box.width };
}
export function toDisplay(point: Point, page: Page): Point {
  const x = point.x - page.box.x,
    y = point.y - page.box.y;
  switch (((page.rotation % 360) + 360) % 360) {
    case 90:
      return { x: y, y: x };
    case 180:
      return { x: page.box.width - x, y };
    case 270:
      return { x: page.box.height - y, y: page.box.width - x };
    default:
      return { x, y: page.box.height - y };
  }
}
export function toPdf(point: Point, page: Page): Point {
  const { width: w, height: h, x: ox, y: oy } = page.box;
  switch (((page.rotation % 360) + 360) % 360) {
    case 90:
      return { x: point.y + ox, y: point.x + oy };
    case 180:
      return { x: w - point.x + ox, y: point.y + oy };
    case 270:
      return { x: w - point.y + ox, y: h - point.x + oy };
    default:
      return { x: point.x + ox, y: h - point.y + oy };
  }
}
export function displayBox(box: Box, page: Page) {
  const points = [
    toDisplay(box, page),
    toDisplay({ x: box.x + box.width, y: box.y + box.height }, page),
  ];
  return {
    x: Math.min(points[0].x, points[1].x),
    y: Math.min(points[0].y, points[1].y),
    width: Math.abs(points[1].x - points[0].x),
    height: Math.abs(points[1].y - points[0].y),
  };
}
export function pagePoint(
  event: { clientX: number; clientY: number },
  element: HTMLElement,
  page: Page,
  scale: number
) {
  const rect = element.getBoundingClientRect();
  return toPdf(
    { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale },
    page
  );
}
