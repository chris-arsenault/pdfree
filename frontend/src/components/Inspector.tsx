import { ImagePlus, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { ImagePicker } from "./ImagePicker";
import { FieldProperties } from "./FieldProperties";
import { AppearanceProperties, GeometryProperties, TextProperties } from "./ObjectProperties";
import { ObjectActions } from "./ObjectActions";
export function Inspector() {
  const editor = useEditor(),
    object = editor.page?.objects.find((item) => item.id === editor.objectIds[0]);
  if (!object) return <EmptyInspector />;
  return (
    <aside className="inspector">
      <div className="inspector-title">
        {object.kind.toUpperCase()}
        <button
          className="inspector-close"
          onClick={() => editor.setObjectIds([])}
          aria-label="Hide properties"
        >
          <X size={16} />
        </button>
      </div>
      {object.kind === "field" && <FieldProperties object={object} />}
      {(object.kind === "text" || object.kind === "stamp") && <TextProperties object={object} />}
      {object.kind !== "image" && <AppearanceProperties object={object} />}
      <GeometryProperties object={object} />
      <ObjectActions object={object} />
      <p className="inspector-tip">
        Drag to move. Use the corner to resize.
        <br />
        Shift-click to select multiple objects.
      </p>
    </aside>
  );
}
function EmptyInspector() {
  const editor = useEditor();
  return (
    <aside className={`inspector ${editor.tool === "image" ? "image-inspector" : ""}`}>
      <div className="inspector-title">
        PROPERTIES
        <button
          className="inspector-close"
          onClick={() => editor.setTool("select")}
          aria-label="Hide image chooser"
        >
          <X size={16} />
        </button>
      </div>
      <div className="inspector-empty">
        <ImagePlus size={25} />
        <p>
          {editor.tool === "image"
            ? "Choose an image, then click the page to place it."
            : "Select an object to adjust its appearance."}
        </p>
        {editor.tool === "image" && <ImagePicker />}
      </div>
    </aside>
  );
}
