import { type Page } from "./model";
export function deskewMatrix(page: Page) {
  const radians = ((page.scan?.angle ?? 0) * Math.PI) / 180;
  const cos = Math.cos(radians),
    sin = Math.sin(radians);
  const x = page.box.x + page.box.width / 2,
    y = page.box.y + page.box.height / 2;
  return [cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y] as const;
}
