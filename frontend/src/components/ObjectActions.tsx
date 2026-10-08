import {
  Copy,
  Trash2,
  AlignStartVertical,
  AlignEndHorizontal,
  BringToFront,
  ListEnd,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type PlacedObject } from "../core/model";
import { IconButton } from "./ui/IconButton";
import {
  duplicateObjects,
  removeObjects,
  alignObjects,
  replaceObjects,
} from "../core/objectOperations";
export function ObjectActions({ objects }: { objects: PlacedObject[] }) {
  const editor = useEditor();
  const object = objects[0];
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
        <IconButton
          label="Duplicate objects"
          icon={Copy}
          detail={`Duplicate ${objects.length} selected object(s).`}
          onClick={copy}
        />
        <IconButton
          label="Delete objects"
          icon={Trash2}
          detail="Remove selected objects. You can undo this."
          shortcut="Delete"
          className="danger"
          onClick={remove}
        />
      </div>
      {editor.objectIds.length > 1 && (
        <div className="object-actions">
          <IconButton
            label="Align objects left"
            icon={AlignStartVertical}
            onClick={() => align("x")}
          />
          <IconButton
            label="Align objects bottom"
            icon={AlignEndHorizontal}
            onClick={() => align("y")}
          />
        </div>
      )}
      {objects.length === 1 && (
        <div className="object-actions">
          <IconButton
            label={object.kind === "field" ? "Move field tab order last" : "Bring to front"}
            icon={object.kind === "field" ? ListEnd : BringToFront}
            onClick={front}
          />
        </div>
      )}
    </>
  );
}
