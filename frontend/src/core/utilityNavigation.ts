import { type Destination, type Page } from "./model";
import { transformPoint, transformedBounds } from "./affine";

export function adjustedDestination(destination: Destination, page: Page): Destination {
  if (!page.scan?.angle || ["Fit", "FitB"].includes(destination.mode)) return destination;
  const radians = (page.scan.angle * Math.PI) / 180,
    a = Math.cos(radians),
    b = Math.sin(radians);
  const x = page.box.x + page.box.width / 2,
    y = page.box.y + page.box.height / 2;
  const matrix = [a, b, -b, a, x - a * x + b * y, y - b * x - a * y] as const;
  const coordinates = destination.coordinates;
  if (
    destination.mode === "XYZ" &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    const point = transformPoint({ x: coordinates[0], y: coordinates[1] }, matrix);
    return { ...destination, coordinates: [point.x, point.y, coordinates[2]] };
  }
  if (
    destination.mode === "FitR" &&
    coordinates.every((coordinate) => typeof coordinate === "number")
  ) {
    const [left, bottom, right, top] = coordinates as number[];
    const box = transformedBounds(
      { x: left, y: bottom, width: right - left, height: top - bottom },
      matrix
    );
    return { ...destination, coordinates: [box.x, box.y, box.x + box.width, box.y + box.height] };
  }
  throw new Error(
    "Deskew cannot preserve this positioned bookmark or link destination. Use a whole-page destination first."
  );
}
