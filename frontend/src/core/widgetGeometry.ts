import { displayBox } from "./coordinates";
import { type Page, type Widget } from "./model";

export function widgetDisplayGeometry(widget: Widget, page: Page) {
  const bounds = displayBox(widget, page);
  const rotation = (((page.rotation - widget.rotation) % 360) + 360) % 360;
  const sideways = rotation % 180 !== 0;
  const width = sideways ? bounds.height : bounds.width;
  const height = sideways ? bounds.width : bounds.height;
  const anchors = {
    0: { x: bounds.x, y: bounds.y },
    90: { x: bounds.x + bounds.width, y: bounds.y },
    180: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    270: { x: bounds.x, y: bounds.y + bounds.height },
  };
  const anchor = anchors[rotation as keyof typeof anchors];
  if (!anchor) throw new Error("This form widget uses an unsupported rotation.");
  return { ...anchor, width, height, rotation };
}
