import { type Point } from "./model";
export type Matrix = readonly [number, number, number, number, number, number];
export function transformPoint(point: Point, [a, b, c, d, e, f]: Matrix): Point {
  return { x: a * point.x + c * point.y + e, y: b * point.x + d * point.y + f };
}
export function transformedBounds(
  box: { x: number; y: number; width: number; height: number },
  matrix: Matrix
) {
  const corners = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => transformPoint({ x, y }, matrix));
  const x = Math.min(...corners.map((point) => point.x)),
    y = Math.min(...corners.map((point) => point.y));
  return {
    x,
    y,
    width: Math.max(...corners.map((point) => point.x)) - x,
    height: Math.max(...corners.map((point) => point.y)) - y,
  };
}
