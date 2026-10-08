import { Copy, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type PlacedObject } from "../core/model";
import {
  duplicateObjects,
  removeObjects,
  alignObjects,
  replaceObjects,
} from "../core/objectOperations";
export function ObjectActions({ object }: { object: PlacedObject }) {
  const editor = useEditor();
  const copy = () => {
    if (editor.page) {
      const duplicated = duplicateObjects(editor.document, editor.page, editor.objectIds);
      editor.commit(duplicated.document);
      editor.setObjectIds(duplicated.ids);
    }
  };
  const remove = () => {
    if (editor.page) {
      editor.commit(removeObjects(editor.document, editor.page, editor.objectIds));
      editor.setObjectIds([]);
    }
  };
  const front = () => {
    if (editor.page)
      editor.commit(
        replaceObjects(editor.document, editor.page.id, [
          ...editor.page.objects.filter((item) => item.id !== object.id),
          object,
        ])
      );
  };
  const align = (axis: "x" | "y") => {
    if (editor.page)
      editor.commit(alignObjects(editor.document, editor.page, editor.objectIds, axis));
  };
  return (
    <>
      <div className="object-actions">
        <button className="button secondary" onClick={copy}>
          <Copy size={14} /> Copy
        </button>
        <button className="button danger" onClick={remove}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
      {editor.objectIds.length > 1 && (
        <div className="object-actions">
          <button onClick={() => align("x")}>Align left</button>
          <button onClick={() => align("y")}>Align bottom</button>
        </div>
      )}
      <button className="text-button" onClick={front}>
        Bring to front / move field tab order last
      </button>
    </>
  );
}
