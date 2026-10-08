import { useId, useState } from "react";
import { propertyNumber } from "../core/editorValidation";
import { type PlacedObject } from "../core/model";
type NumericProperty = "fontSize" | "strokeWidth" | "width" | "height" | "rotation";

export function NumberProperty({
  label,
  value,
  minimum,
  maximum,
  step,
  field,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: string;
  field: NumericProperty;
  onChange: (change: Partial<PlacedObject>) => void;
}) {
  const id = useId();
  const [raw, setRaw] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const change = (next: string) => {
    setRaw(next);
    try {
      const number = propertyNumber(next, label, minimum, maximum);
      setError("");
      onChange({ [field]: number });
    } catch (error) {
      setError((error as Error).message);
    }
  };
  return (
    <label>
      {label}
      <input
        type="number"
        aria-label={label}
        min={minimum}
        max={maximum}
        step={step}
        value={editing ? raw : String(value)}
        aria-invalid={!!error}
        aria-describedby={error ? id : undefined}
        onFocus={() => {
          setEditing(true);
          setRaw(String(value));
        }}
        onBlur={() => setEditing(false)}
        onChange={(event) => change(event.target.value)}
      />
      {error && <span id={id}>{error} The previous value is retained.</span>}
    </label>
  );
}
