import { type FieldValue, type NativeField } from "../core/model";
import { choiceValues } from "../core/editorValidation";
export function FieldControl({
  field,
  value,
  onChange,
}: {
  field: NativeField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const attributes = {
    "aria-label": field.name,
    required: field.required,
    disabled: field.readOnly,
  };
  if (field.kind === "checkbox")
    return (
      <input
        {...attributes}
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  if (field.kind === "dropdown" || field.kind === "list")
    return <ChoiceControl field={field} value={value} onChange={onChange} />;
  if (field.multiline)
    return (
      <textarea
        {...attributes}
        value={String(value)}
        maxLength={field.maxLength || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  return (
    <input
      {...attributes}
      type="text"
      value={String(value)}
      maxLength={field.maxLength || undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
function ChoiceControl({
  field,
  value,
  onChange,
}: {
  field: NativeField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const selected = Array.isArray(value) ? value : [String(value)];
  const selectValue = field.multiSelect ? selected : (selected[0] ?? "");
  const choices = [
    ...field.choiceOptions,
    ...selected
      .filter((value) => value && !field.options.includes(value))
      .map((value) => ({ value, label: value })),
  ];
  return (
    <select
      aria-label={field.name}
      required={field.required}
      disabled={field.readOnly}
      multiple={field.multiSelect}
      value={selectValue}
      onChange={(e) =>
        onChange(choiceValues(Array.from(e.target.selectedOptions, (option) => option.value)))
      }
    >
      {!field.multiSelect && <option value="">Choose…</option>}
      {choices.map((option, index) => (
        <option key={`${option.value}:${index}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
