import { useEditor } from "../hooks/editorContext";
import { type PlacedObject } from "../core/model";
import { useCallback } from "react";
import { editorLimits, objectRotationError } from "../core/editorValidation";
import { NumberProperty } from "./NumberProperty";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { IconButton } from "./ui/IconButton";
function useUpdateObject(object: PlacedObject) {
  const editor = useEditor();
  return useCallback(
    (change: Partial<PlacedObject>) => editor.updateObject(object.id, change),
    [editor, object.id]
  );
}
export function TextProperties({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <>
      <label>
        Text
        <textarea
          aria-label="Object text"
          maxLength={editorLimits.text}
          value={object.text}
          onChange={(event) => update({ text: event.target.value })}
        />
      </label>
      <NumberProperty
        label="Font size"
        field="fontSize"
        value={object.fontSize}
        minimum={1}
        maximum={editorLimits.fontSize}
        step="any"
        onChange={update}
      />
      <FontProperty object={object} />
      <div className="alignment-property">
        <span>Alignment</span>
        <div className="alignment-buttons" role="group" aria-label="Text alignment">
          <IconButton
            label="Align text left"
            icon={AlignLeft}
            aria-pressed={object.align === "left"}
            onClick={() => update({ align: "left" })}
          />
          <IconButton
            label="Center text"
            icon={AlignCenter}
            aria-pressed={object.align === "center"}
            onClick={() => update({ align: "center" })}
          />
          <IconButton
            label="Align text right"
            icon={AlignRight}
            aria-pressed={object.align === "right"}
            onClick={() => update({ align: "right" })}
          />
        </div>
      </div>
    </>
  );
}
export function AppearanceProperties({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <>
      {object.kind !== "image" && <ColorProperty object={object} />}
      {["ink", "rectangle", "line", "arrow", "check", "cross"].includes(object.kind) && (
        <NumberProperty
          label="Stroke width"
          field="strokeWidth"
          value={object.strokeWidth}
          minimum={0.1}
          maximum={editorLimits.strokeWidth}
          step="any"
          onChange={update}
        />
      )}
      <label>
        <span>
          Opacity <span aria-hidden="true">{Math.round(object.opacity * 100)}%</span>
        </span>
        <input
          type="range"
          min=".1"
          max="1"
          step=".05"
          value={object.opacity}
          aria-valuetext={`${Math.round(object.opacity * 100)}%`}
          onChange={(event) => update({ opacity: Number(event.target.value) })}
        />
      </label>
    </>
  );
}
function ColorProperty({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <label>
      Color
      <input
        type="color"
        value={object.color}
        onChange={(event) => update({ color: event.target.value })}
      />
    </label>
  );
}
export function FieldAppearanceProperties({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <>
      {object.fieldKind !== "checkbox" && <ColorProperty object={object} />}
      {["text", "radio"].includes(object.fieldKind) && (
        <NumberProperty
          label="Font size"
          field="fontSize"
          value={object.fontSize}
          minimum={1}
          maximum={editorLimits.fontSize}
          step="any"
          onChange={update}
        />
      )}
    </>
  );
}
function FontProperty({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <label>
      Font
      <select
        value={object.font}
        onChange={(event) => update({ font: event.target.value as PlacedObject["font"] })}
      >
        <option value="sans">Noto Sans</option>
        <option value="signature">Caveat signature</option>
      </select>
    </label>
  );
}
export function GeometryProperties({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  const rotate = useCallback(
    (change: Partial<PlacedObject>) => {
      const error = objectRotationError({ ...object, ...change });
      if (error) throw new Error(error);
      update(change);
    },
    [object, update]
  );
  return (
    <>
      <div className="property-pair">
        <NumberProperty
          label="Width"
          field="width"
          value={object.width}
          minimum={0.01}
          maximum={editorLimits.size}
          step="any"
          onChange={update}
        />
        <NumberProperty
          label="Height"
          field="height"
          value={object.height}
          minimum={0.01}
          maximum={editorLimits.size}
          step="any"
          onChange={update}
        />
      </div>
      <NumberProperty
        label="Rotation"
        field="rotation"
        value={object.rotation}
        minimum={-360}
        maximum={360}
        step={object.kind === "field" ? "90" : "any"}
        onChange={rotate}
      />
    </>
  );
}
