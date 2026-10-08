import { useRef, useState, type PointerEvent } from "react";
import { useEditor } from "./editorContext";
import { pagePoint } from "../core/coordinates";
import { defaultObject, type PlacedObject, type Point, type Tool } from "../core/model";
import { replaceObjects } from "../core/objectOperations";
import { hasPlacementAsset } from "../core/editorOperations";

export function usePlacement() {
  const editor = useEditor();
  const stroke = useRef<Point[]>([]);
  const [preview, setPreview] = useState<PlacedObject | null>(null);
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!editor.page || editor.tool === "select") {
      editor.setObjectIds([]);
      return;
    }
    if ((event.target as HTMLElement).closest(".placed-object,.native-widget")) return;
    if (editor.tool === "image" && !hasPlacementAsset(editor.document, editor.pendingObject)) {
      editor.task.notify("Choose an image in the properties panel first.");
      return;
    }
    const point = pagePoint(event, event.currentTarget, editor.page, editor.zoom);
    const object = placementObject(editor.tool, point, editor.pendingObject);
    stroke.current = [point];
    setPreview(object);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!preview || !editor.page) return;
    const point = pagePoint(event, event.currentTarget, editor.page, editor.zoom);
    if (preview.kind === "ink") {
      stroke.current.push(point);
      setPreview(inkObject(preview, stroke.current));
    } else if (["highlight", "rectangle", "line", "arrow", "field"].includes(preview.kind)) {
      const first = stroke.current[0];
      const x = Math.min(first.x, point.x),
        y = Math.min(first.y, point.y),
        width = Math.max(12, Math.abs(point.x - first.x)),
        height = Math.max(12, Math.abs(point.y - first.y));
      setPreview({
        ...preview,
        x,
        y,
        width,
        height,
        points: [
          { x: (first.x - x) / width, y: (first.y - y) / height },
          { x: (point.x - x) / width, y: (point.y - y) / height },
        ],
      });
    }
  };
  const end = () => {
    if (preview && editor.page) {
      editor.commit(
        replaceObjects(editor.document, editor.page.id, [...editor.page.objects, preview])
      );
      editor.setObjectIds([preview.id]);
      editor.setTool("select");
    }
    stroke.current = [];
    setPreview(null);
  };
  return { start, move, end, preview };
}
function placementObject(tool: Tool, point: Point, pending: Partial<PlacedObject>) {
  const kind = ["date", "signature", "initials"].includes(tool) ? "text" : tool;
  const object = { ...defaultObject(kind as PlacedObject["kind"], point), ...pending };
  object.y -= object.height;
  if (tool === "date") object.text = new Date().toLocaleDateString();
  if (tool === "check" || tool === "cross") {
    object.width = 20;
    object.height = 20;
  }
  if (tool === "highlight") {
    object.color = "#f4d344";
    object.height = 18;
  }
  if (tool === "field") object.fieldName = `field_${object.id.slice(0, 8)}`;
  return object;
}
function inkObject(object: PlacedObject, points: Point[]): PlacedObject {
  const x = Math.min(...points.map((point) => point.x)),
    y = Math.min(...points.map((point) => point.y));
  const width = Math.max(1, Math.max(...points.map((point) => point.x)) - x);
  const height = Math.max(1, Math.max(...points.map((point) => point.y)) - y);
  return {
    ...object,
    x,
    y,
    width,
    height,
    points: points.map((point) => ({ x: (point.x - x) / width, y: (point.y - y) / height })),
  };
}
