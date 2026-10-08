import { type PlacedObject } from "./model";
export function resizeObject(
  object: PlacedObject,
  dx: number,
  dy: number,
  preserveAspect: boolean
) {
  const angle = (object.rotation * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  const localX = dx * c + dy * s,
    localY = -dx * s + dy * c;
  const width = Math.max(12, object.width + localX);
  const height = preserveAspect
    ? (width * object.height) / object.width
    : Math.max(12, object.height - localY);
  const shift = object.height - height;
  return { ...object, width, height, x: object.x - s * shift, y: object.y + c * shift };
}
