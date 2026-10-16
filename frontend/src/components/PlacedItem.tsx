import { useEditor } from "../hooks/editorContext";
import { useObjectDrag } from "../hooks/useObjectDrag";
import { ObjectFrame } from "./ObjectFrame";
import { type PlacedObject } from "../core/model";
import { ObjectAppearance } from "./ObjectAppearance";
import { AlignmentGuides } from "./AlignmentGuides";

export function PlacedItem({ object: original }: { object: PlacedObject }) {
  const editor = useEditor(),
    drag = useObjectDrag(original),
    object = drag.object;
  if (!editor.page) return null;
  const selected = editor.objectIds.includes(object.id);
  return (
    <>
      {drag.dragging && <AlignmentGuides object={object} />}
      <ObjectFrame
        object={object}
        page={editor.page}
        scale={editor.zoom}
        className={`placed-object ${selected ? "selected" : ""} kind-${object.kind}`}
        role="button"
        tabIndex={0}
        aria-label={`${object.kind}: ${object.text || object.fieldName || "object"}`}
        aria-pressed={selected}
        onPointerDown={(event) => drag.start(event)}
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        onPointerCancel={drag.end}
        onKeyDown={(event) => {
          if (event.key === "Enter") editor.setObjectIds([object.id]);
        }}
      >
        <ObjectAppearance object={object} assets={editor.document.assets} />
        {selected && (
          <div
            className="resize-handle"
            aria-hidden="true"
            onPointerDown={(event) => drag.start(event, true)}
            onPointerMove={drag.move}
            onPointerUp={drag.end}
          />
        )}
      </ObjectFrame>
    </>
  );
}
