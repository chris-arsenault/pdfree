import { useEffect } from "react";
import { useEditor } from "./editorContext";
import { moveObjects, removeObjects } from "../core/objectOperations";
import {
  canCopyObjects,
  copyObjects,
  pasteObjects,
  type ObjectClipboard,
} from "../core/editorOperations";
type Editor = ReturnType<typeof useEditor>;
function handleCommand(editor: Editor, key: string, event: KeyboardEvent) {
  if (key === "s") {
    event.preventDefault();
    editor.openExport("document");
    return true;
  }
  if (key === "z" || key === "y") {
    event.preventDefault();
    editor.dispatch({ type: event.shiftKey || key === "y" ? "redo" : "undo" });
    return true;
  }
  return false;
}
function handleClipboard(
  editor: Editor,
  clipboard: { current: ObjectClipboard },
  key: string,
  event: KeyboardEvent
) {
  if (!editor.page) return;
  if (key === "c") {
    const copied = copyObjects(editor.document, editor.page.id, editor.objectIds);
    if (!canCopyObjects(copied.objects, window.getSelection()?.toString() ?? "")) return;
    clipboard.current = copied;
    event.preventDefault();
  }
  if (key === "v" && clipboard.current.objects.length) {
    event.preventDefault();
    const result = pasteObjects(editor.document, editor.page.id, clipboard.current);
    editor.commit(result.document);
    editor.setObjectIds(result.ids);
  }
  if (key === "a") {
    event.preventDefault();
    editor.setObjectIds(editor.page.objects.map((object) => object.id));
  }
}
function handleObjects(editor: Editor, event: KeyboardEvent) {
  if (!editor.page || !editor.objectIds.length) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    editor.commit(removeObjects(editor.document, editor.page, editor.objectIds));
    editor.setObjectIds([]);
  }
  const directions: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, 1],
    ArrowDown: [0, -1],
  };
  const direction = directions[event.key];
  if (direction) {
    event.preventDefault();
    const amount = event.shiftKey ? 10 : 1,
      angle = (editor.page.rotation * Math.PI) / 180;
    const [dx, dy] = direction;
    editor.commit(
      moveObjects(
        editor.document,
        editor.page,
        editor.objectIds,
        (dx * Math.cos(angle) - dy * Math.sin(angle)) * amount,
        (dx * Math.sin(angle) + dy * Math.cos(angle)) * amount
      )
    );
  }
}
export function useKeyboard() {
  const editor = useEditor(),
    clipboard = editor.clipboard;
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("input,textarea,select,[contenteditable=true],dialog,[role=dialog]") ||
        editor.dialog ||
        editor.task.busy
      )
        return;
      const command = event.ctrlKey || event.metaKey,
        key = event.key.toLowerCase();
      if (command && handleCommand(editor, key, event)) return;
      if (!editor.page) return;
      if (event.key === "Escape") {
        editor.setTool("select");
        editor.setObjectIds([]);
        return;
      }
      if (command) handleClipboard(editor, clipboard, key, event);
      else handleObjects(editor, event);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [editor, clipboard]);
}
