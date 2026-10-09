import { useRef, useState, type PointerEvent } from "react";
import { useEditor } from "./editorContext";
import { pagePoint } from "../core/coordinates";
import { defaultObject, newId, type PlacedObject, type Point, type Tool } from "../core/model";
import { replaceObjects } from "../core/objectOperations";
import { hasPlacementAsset } from "../core/editorOperations";
import { commentPointAt } from "../core/comments";
import { selectedHighlights } from "../core/selectionHighlights";

type Editor = ReturnType<typeof useEditor>;
const textTarget = (target: EventTarget) =>
  !!(target as HTMLElement).closest(".textLayer span, .recognized-layer span");

/** Turns a text selection on the page into highlight objects; returns whether any were added. */
export function highlightTextSelection(editor: Editor, surface: HTMLElement) {
  if (!editor.page) return false;
  let highlights: PlacedObject[];
  try {
    highlights = selectedHighlights(surface, editor.page, editor.zoom);
  } catch {
    return false;
  }
  if (!highlights.length) return false;
  editor.commit(
    replaceObjects(editor.document, editor.page.id, [...editor.page.objects, ...highlights])
  );
  editor.setObjectIds(highlights.map((item) => item.id));
  editor.setTool("select");
  return true;
}

export function usePlacement() {
  const editor = useEditor();
  const stroke = useRef<Point[]>([]);
  // A Highlight drag that starts on PDF or recognized text selects text natively instead.
  const textDrag = useRef(false);
  const [preview, setPreview] = useState<PlacedObject | null>(null);
  const start = (event: PointerEvent<HTMLDivElement>) => {
    textDrag.current = false;
    if (!editor.page || editor.tool === "select") {
      editor.setObjectIds([]);
      return;
    }
    if ((event.target as HTMLElement).closest(".placed-object,.native-widget,.comment-marker"))
      return;
    // Touch drags cannot make a native selection here, so they keep drawing area highlights.
    if (editor.tool === "highlight" && event.pointerType !== "touch" && textTarget(event.target)) {
      textDrag.current = true;
      return;
    }
    if (editor.tool === "comment") {
      editor.setPendingComment({
        id: newId(),
        pageId: editor.page.id,
        point: commentPointAt(
          pagePoint(event, event.currentTarget, editor.page, editor.zoom),
          editor.page
        ),
      });
      editor.setObjectIds([]);
      editor.setCommentsOpen(true);
      editor.setTool("select");
      return;
    }
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
      setPreview(spanObject(preview, stroke.current[0], point));
    }
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (textDrag.current) {
      textDrag.current = false;
      highlightTextSelection(editor, event.currentTarget);
      return;
    }
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
function spanObject(object: PlacedObject, first: Point, point: Point): PlacedObject {
  const x = Math.min(first.x, point.x),
    y = Math.min(first.y, point.y),
    width = Math.max(12, Math.abs(point.x - first.x)),
    height = Math.max(12, Math.abs(point.y - first.y));
  return {
    ...object,
    x,
    y,
    width,
    height,
    points: [
      { x: (first.x - x) / width, y: (first.y - y) / height },
      { x: (point.x - x) / width, y: (point.y - y) / height },
    ],
  };
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
