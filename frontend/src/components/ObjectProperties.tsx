import { useEditor } from "../hooks/editorContext";
import { type PlacedObject } from "../core/model";
import { useCallback } from "react";
import { editorLimits, objectRotationError } from "../core/editorValidation";
import { NumberProperty } from "./NumberProperty";
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
      <label>
        Alignment
        <select
          value={object.align}
          onChange={(event) => update({ align: event.target.value as PlacedObject["align"] })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </>
  );
}
export function AppearanceProperties({ object }: { object: PlacedObject }) {
  const update = useUpdateObject(object);
  return (
    <>
      <label>
        Color
        <input
          type="color"
          value={object.color}
          onChange={(event) => update({ color: event.target.value })}
        />
      </label>
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
      <NumberProperty
        label="Stroke width"
        field="strokeWidth"
        value={object.strokeWidth}
        minimum={0.1}
        maximum={editorLimits.strokeWidth}
        step="any"
        onChange={update}
      />
      <label>
        Opacity
        <input
          type="range"
          min=".1"
          max="1"
          step=".05"
          value={object.opacity}
          onChange={(event) => update({ opacity: Number(event.target.value) })}
        />
      </label>
    </>
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
