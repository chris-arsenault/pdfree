import { useMessageState } from "../i18n/react";
import { text as tr } from "../i18n/runtime";
import { type PlacedObject, type FieldKind } from "../core/model";
import { useEditor } from "../hooks/editorContext";
import { useId, useState } from "react";
import { editorLimits, fieldOptionsError, objectRotationError } from "../core/editorValidation";
export function FieldProperties({ object }: { object: PlacedObject }) {
  const editor = useEditor(),
    update = (change: Partial<PlacedObject>) => editor.updateObject(object.id, change);
  const [typeError, setTypeError] = useMessageState();
  const errorId = useId();
  return (
    <>
      <label>
        {tr("field.name")}
        <input
          value={object.fieldName}
          maxLength={editorLimits.text}
          onChange={(event) => update({ fieldName: event.target.value })}
        />
      </label>
      <label>
        {tr("field.type")}
        <select
          aria-label={tr("field.type")}
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
          <option value="text">{tr("common.text")}</option>
          <option value="checkbox">{tr("common.checkbox")}</option>
          <option value="radio">{tr("common.radioGroup")}</option>
          <option value="dropdown">{tr("common.dropdown")}</option>
          <option value="list">{tr("common.list")}</option>
        </select>
        {typeError && (
          <span id={errorId}>
            {typeError} {tr("field.typeRetained")}
          </span>
        )}
      </label>
      {object.fieldKind === "checkbox" ? (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={object.text === "true"}
            onChange={(event) => update({ text: String(event.target.checked) })}
          />{" "}
          {tr("common.checked")}
        </label>
      ) : (
        <label>
          {tr("field.initial")}
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
        {tr("common.required")}
      </label>
      <p className="field-note">{tr("field.tabHint")}</p>
    </>
  );
}

function OptionsProperty({ object }: { object: PlacedObject }) {
  const editor = useEditor();
  const [raw, setRaw] = useState(object.options.join("\n"));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useMessageState();
  const id = useId();
  return (
    <label>
      {tr("field.options")}
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
      {error && (
        <span id={id}>
          {error} {tr("field.optionsRetained")}
        </span>
      )}
    </label>
  );
}
