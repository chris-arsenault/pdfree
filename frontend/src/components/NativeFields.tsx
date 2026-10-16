import { useEditor } from "../hooks/editorContext";
import { useCallback } from "react";
import { widgetDisplayGeometry } from "../core/widgetGeometry";
import { type NativeField, type Widget, type Page } from "../core/model";
import { FieldControl } from "./FieldControl";

function NativeWidget({
  field,
  widget,
  page,
  scale,
  readOnly,
}: {
  field: NativeField;
  widget: Widget;
  page: Page;
  scale: number;
  readOnly: boolean;
}) {
  const editor = useEditor();
  const update = useCallback(
    (value: typeof field.value) =>
      !readOnly &&
      editor.commit({
        ...editor.document,
        values: { ...editor.document.values, [field.id]: value },
      }),
    [editor, field, readOnly]
  );
  const geometry = widgetDisplayGeometry(widget, page);
  const value = editor.document.values[field.id] ?? field.value;
  return (
    <div
      className={`native-widget ${field.required ? "required" : ""}`}
      title={`${field.name}${field.required ? " (required)" : ""}`}
      style={{
        "--x": `${geometry.x * scale}px`,
        "--y": `${geometry.y * scale}px`,
        "--w": `${geometry.width * scale}px`,
        "--h": `${geometry.height * scale}px`,
        "--angle": `${geometry.rotation}deg`,
        "--font-size": `${Math.min(14, geometry.height * 0.65) * scale}px`,
      }}
    >
      {field.kind === "radio" ? (
        <input
          aria-label={`${field.name}: ${widget.option}`}
          type="radio"
          name={`${readOnly ? "reference:" : ""}${field.id}`}
          value={widget.option}
          checked={value === widget.option}
          disabled={field.readOnly || readOnly}
          onChange={() => update(widget.option)}
        />
      ) : (
        <FieldControl field={field} value={value} onChange={update} readOnly={readOnly} />
      )}
    </div>
  );
}
export function NativeFields({
  page: requestedPage,
  scale,
  readOnly = false,
}: {
  page?: Page;
  scale?: number;
  readOnly?: boolean;
}) {
  const editor = useEditor(),
    { document } = editor;
  const page = requestedPage ?? editor.page;
  if (!page) return null;
  const source = document.sources.find((item) => item.id === page.sourceId);
  return (
    <div className="native-fields">
      {source?.fields.flatMap((field) =>
        field.widgets
          .filter((widget) => widget.pageIndex === page.sourceIndex)
          .map((widget, index) => (
            <NativeWidget
              key={`${field.id}-${index}`}
              field={field}
              widget={widget}
              page={page}
              scale={scale ?? editor.zoom}
              readOnly={readOnly}
            />
          ))
      )}
    </div>
  );
}
