import { type PlacedObject, type FieldKind } from "../core/model";
import { useEditor } from "../hooks/editorContext";
import { useId, useState } from "react";
import { editorLimits, fieldOptionsError, objectRotationError } from "../core/editorValidation";
export function FieldProperties({ object }: { object: PlacedObject }) {
  const editor = useEditor(),
    update = (change: Partial<PlacedObject>) => editor.updateObject(object.id, change);
  const [typeError, setTypeError] = useState("");
  const errorId = useId();
  return (
    <>
      <label>
        Field name
        <input
          value={object.fieldName}
          maxLength={editorLimits.text}
          onChange={(event) => update({ fieldName: event.target.value })}
        />
      </label>
      <label>
        Field type
        <select
          aria-label="Field type"
          value={object.fieldKind}
          aria-invalid={!!typeError}
          aria-describedby={typeError ? errorId : undefined}
          onChange={(event) => {
            const fieldKind = event.target.value as FieldKind;
            const error = objectRotationError({ ...object, fieldKind });
            setTypeError(error);
            if (!error) update({ fieldKind });
          }}
        >
          <option value="text">Text</option>
          <option value="checkbox">Checkbox</option>
          <option value="radio">Radio group</option>
          <option value="dropdown">Dropdown</option>
          <option value="list">List</option>
        </select>
        {typeError && <span id={errorId}>{typeError} The previous field type is retained.</span>}
      </label>
      {object.fieldKind === "checkbox" ? (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={object.text === "true"}
            onChange={(event) => update({ text: String(event.target.checked) })}
          />{" "}
          Checked
        </label>
      ) : (
        <label>
          Initial value
          <input
            value={object.text}
            maxLength={editorLimits.text}
            onChange={(event) => update({ text: event.target.value })}
          />
        </label>
      )}
      {["radio", "dropdown", "list"].includes(object.fieldKind) && (
        <OptionsProperty object={object} />
      )}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={object.required}
          onChange={(event) => update({ required: event.target.checked })}
        />{" "}
        Required
      </label>
      <p className="field-note">
        Fields follow object order on each page for tab navigation. Export without flattening to
        keep them fillable.
      </p>
    </>
  );
}

function OptionsProperty({ object }: { object: PlacedObject }) {
  const editor = useEditor();
  const [raw, setRaw] = useState(object.options.join("\n"));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  return (
    <label>
      Options (one per line)
      <textarea
        value={editing ? raw : object.options.join("\n")}
        maxLength={editorLimits.text}
        aria-invalid={!!error}
        aria-describedby={error ? id : undefined}
        onFocus={() => {
          setEditing(true);
          setRaw(object.options.join("\n"));
        }}
        onBlur={() => setEditing(false)}
        onChange={(event) => {
          const next = event.target.value;
          const options = next.split("\n");
          const error = fieldOptionsError(options);
          setRaw(next);
          setError(error);
          if (!error) editor.updateObject(object.id, { options });
        }}
      />
      {error && <span id={id}>{error} The previous options are retained.</span>}
    </label>
  );
}
