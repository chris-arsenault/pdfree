import { useEditor } from "../hooks/editorContext";
import { useObjectDrag } from "../hooks/useObjectDrag";
import { toDisplay } from "../core/coordinates";
import { type PlacedObject } from "../core/model";
import { ObjectAppearance } from "./ObjectAppearance";
import { AlignmentGuides } from "./AlignmentGuides";

export function PlacedItem({ object: original }: { object: PlacedObject }) {
  const editor = useEditor(),
    drag = useObjectDrag(original),
    object = drag.object;
  if (!editor.page) return null;
  const radians = (object.rotation * Math.PI) / 180;
  const origin = toDisplay(
    {
      x: object.x - object.height * Math.sin(radians),
      y: object.y + object.height * Math.cos(radians),
    },
    editor.page
  );
  const selected = editor.objectIds.includes(object.id);
  return (
    <>
      {drag.dragging && <AlignmentGuides object={object} />}
      <div
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
        style={{
          "--x": `${origin.x * editor.zoom}px`,
          "--y": `${origin.y * editor.zoom}px`,
          "--w": `${object.width * editor.zoom}px`,
          "--h": `${object.height * editor.zoom}px`,
          "--angle": `${editor.page.rotation - object.rotation}deg`,
          "--object-color": object.color,
          "--font-size": `${object.fontSize * editor.zoom}px`,
          "--opacity": object.opacity,
          "--text-align": object.align,
          "--stroke-width": object.strokeWidth,
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
      </div>
    </>
  );
}
