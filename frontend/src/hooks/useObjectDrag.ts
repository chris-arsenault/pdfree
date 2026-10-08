import { useRef, useState, type PointerEvent } from "react";
import { useEditor } from "./editorContext";
import { pagePoint } from "../core/coordinates";
import { replaceObjects, snapPoint } from "../core/objectOperations";
import { type PlacedObject, type Point } from "../core/model";
import { resizeObject } from "../core/resizeObject";

export function useObjectDrag(object: PlacedObject) {
  const editor = useEditor();
  const [preview, setPreview] = useState<PlacedObject | null>(null);
  const gesture = useRef<{ start: Point; resize: boolean; ids: string[] } | null>(null);
  const start = (event: PointerEvent<HTMLDivElement>, resize = false) => {
    if (!editor.page) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.closest<HTMLElement>(".placed-object")?.focus();
    let ids = editor.objectIds.includes(object.id) ? editor.objectIds : [object.id];
    if (event.shiftKey)
      ids = editor.objectIds.includes(object.id)
        ? editor.objectIds.filter((id) => id !== object.id)
        : [...editor.objectIds, object.id];
    editor.setObjectIds(ids);
    editor.setTool("select");
    const surface = event.currentTarget.closest<HTMLElement>(".page-surface")!;
    gesture.current = { start: pagePoint(event, surface, editor.page, editor.zoom), resize, ids };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!gesture.current || !editor.page) return;
    const point = pagePoint(
      event,
      event.currentTarget.closest<HTMLElement>(".page-surface")!,
      editor.page,
      editor.zoom
    );
    const dx = point.x - gesture.current.start.x,
      dy = point.y - gesture.current.start.y;
    const next = gesture.current.resize
      ? resizeObject(object, dx, dy, object.kind === "image" && !event.shiftKey)
      : { ...object, x: object.x + dx, y: object.y + dy };
    setPreview(
      event.altKey || gesture.current.resize
        ? next
        : snapPoint(
            next,
            editor.page.objects.filter((other) => !gesture.current?.ids.includes(other.id)),
            4 / editor.zoom
          )
    );
  };
  const end = () => {
    if (preview && editor.page && gesture.current) {
      const dx = preview.x - object.x,
        dy = preview.y - object.y;
      const next = editor.page.objects.map((item) => {
        if (item.id === object.id) return preview;
        if (!gesture.current?.resize && gesture.current?.ids.includes(item.id))
          return { ...item, x: item.x + dx, y: item.y + dy };
        return item;
      });
      editor.commit(replaceObjects(editor.document, editor.page.id, next));
    }
    gesture.current = null;
    setPreview(null);
  };
  return {
    object: preview ?? object,
    dragging: Boolean(preview),
    start,
    move,
    end,
  };
}
