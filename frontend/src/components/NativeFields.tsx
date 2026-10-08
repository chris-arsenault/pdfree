import { useEditor } from "../hooks/editorContext";
import { useCallback } from "react";
import { widgetDisplayGeometry } from "../core/widgetGeometry";
import { type NativeField, type Widget } from "../core/model";
import { FieldControl } from "./FieldControl";

function NativeWidget({ field, widget }: { field: NativeField; widget: Widget }) {
  const editor = useEditor(),
    page = editor.page;
  const update = useCallback(
    (value: typeof field.value) =>
      editor.commit({
        ...editor.document,
        values: { ...editor.document.values, [field.id]: value },
      }),
    [editor, field]
  );
  if (!page) return null;
  const geometry = widgetDisplayGeometry(widget, page);
  const value = editor.document.values[field.id] ?? field.value;
  return (
    <div
      className={`native-widget ${field.required ? "required" : ""}`}
      title={`${field.name}${field.required ? " (required)" : ""}`}
      style={{
        "--x": `${geometry.x * editor.zoom}px`,
        "--y": `${geometry.y * editor.zoom}px`,
        "--w": `${geometry.width * editor.zoom}px`,
        "--h": `${geometry.height * editor.zoom}px`,
        "--angle": `${geometry.rotation}deg`,
        "--font-size": `${Math.min(14, geometry.height * 0.65) * editor.zoom}px`,
      }}
    >
      {field.kind === "radio" ? (
        <input
          aria-label={`${field.name}: ${widget.option}`}
          type="radio"
          name={field.id}
          value={widget.option}
          checked={value === widget.option}
          disabled={field.readOnly}
          onChange={() => update(widget.option)}
        />
      ) : (
        <FieldControl field={field} value={value} onChange={update} />
      )}
    </div>
  );
}
export function NativeFields() {
  const { page, document } = useEditor();
  if (!page) return null;
  const source = document.sources.find((item) => item.id === page.sourceId);
  return (
    <div className="native-fields">
      {source?.fields.flatMap((field) =>
        field.widgets
          .filter((widget) => widget.pageIndex === page.sourceIndex)
          .map((widget, index) => (
            <NativeWidget key={`${field.id}-${index}`} field={field} widget={widget} />
          ))
      )}
    </div>
  );
}
