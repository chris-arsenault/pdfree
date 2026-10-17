import { text as tr } from "../i18n/runtime";
import {
  Copy,
  Trash2,
  AlignStartVertical,
  AlignEndHorizontal,
  BringToFront,
  ChevronDown,
  ChevronUp,
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
          label={tr("objects.duplicate")}
          icon={Copy}
          detail={tr("objects.duplicateDetail", { count: objects.length })}
          onClick={copy}
        />
        <IconButton
          label={tr("objects.delete")}
          icon={Trash2}
          detail={tr("objects.deleteHint")}
          shortcut={tr("common.delete")}
          className="danger"
          onClick={remove}
        />
      </div>
      {editor.objectIds.length > 1 && (
        <div className="object-actions">
          <IconButton
            label={tr("objects.alignLeft")}
            icon={AlignStartVertical}
            onClick={() => align("x")}
          />
          <IconButton
            label={tr("objects.alignBottom")}
            icon={AlignEndHorizontal}
            onClick={() => align("y")}
          />
        </div>
      )}
      {objects.length === 1 && object.kind !== "field" && (
        <div className="object-actions">
          <IconButton label={tr("objects.front")} icon={BringToFront} onClick={front} />
        </div>
      )}
      {objects.length === 1 && object.kind === "field" && <FieldTabOrder object={object} />}
    </>
  );
}
/** Authored fields tab in page object order; moving swaps with the neighbouring field only. */
function FieldTabOrder({ object }: { object: PlacedObject }) {
  const editor = useEditor();
  const page = editor.page;
  if (!page) return null;
  const fields = page.objects.filter((item) => item.kind === "field");
  const position = fields.findIndex((item) => item.id === object.id);
  const move = (step: -1 | 1) => {
    const neighbour = fields[position + step];
    if (!neighbour) return;
    const objects = page.objects.map((item) => {
      if (item.id === object.id) return neighbour;
      return item.id === neighbour.id ? object : item;
    });
    editor.commit(replaceObjects(editor.document, page.id, objects));
  };
  return (
    <div
      className="object-actions field-tab-order"
      role="group"
      aria-label={tr("objects.tabOrder")}
    >
      <span>{tr("objects.tabPosition", { number: position + 1, total: fields.length })}</span>
      <IconButton
        label={tr("objects.earlier")}
        icon={ChevronUp}
        disabled={position <= 0}
        onClick={() => move(-1)}
      />
      <IconButton
        label={tr("objects.later")}
        icon={ChevronDown}
        disabled={position >= fields.length - 1}
        onClick={() => move(1)}
      />
    </div>
  );
}
