import { X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { ImagePicker } from "./ImagePicker";
import { FieldProperties } from "./FieldProperties";
import {
  AppearanceProperties,
  FieldAppearanceProperties,
  GeometryProperties,
  TextProperties,
} from "./ObjectProperties";
import { ObjectActions } from "./ObjectActions";
import { IconButton } from "./ui/IconButton";
import { SidePanel } from "./ui/SidePanel";
import { type PlacedObject } from "../core/model";
import { tools } from "./toolDefinitions";
import { hasPlacementAsset } from "../core/editorOperations";
export function Inspector() {
  const editor = useEditor();
  const objects = editor.page?.objects.filter((item) => editor.objectIds.includes(item.id)) ?? [];
  const object = objects.length === 1 ? objects[0] : null;
  let title = object ? tools.find((tool) => tool.id === object.kind)?.label : "Properties";
  if (objects.length > 1) title = `${objects.length} objects selected`;
  return (
    <SidePanel
      id="properties-panel"
      label="Object properties"
      className="inspector"
      open={editor.propertiesOpen}
      onClose={() => editor.setPropertiesOpen(false)}
    >
      <div className="panel-heading">
        <strong>{title}</strong>
        <IconButton
          label="Hide properties"
          icon={X}
          onClick={() => editor.setPropertiesOpen(false)}
        />
      </div>
      {objects.length ? (
        <>
          {object && <SelectedProperties key={object.id} object={object} />}
          <ObjectActions objects={objects} />
        </>
      ) : (
        <EmptyInspector />
      )}
    </SidePanel>
  );
}
function SelectedProperties({ object }: { object: PlacedObject }) {
  return (
    <>
      {object.kind === "field" && (
        <fieldset className="property-section">
          <legend>Fillable field</legend>
          <FieldProperties object={object} />
          <FieldAppearanceProperties object={object} />
        </fieldset>
      )}
      {(object.kind === "text" || object.kind === "stamp") && (
        <div className="property-section">
          <TextProperties object={object} />
        </div>
      )}
      {object.kind !== "field" && (
        <fieldset className="property-section">
          <legend>Appearance</legend>
          <AppearanceProperties object={object} />
        </fieldset>
      )}
      <fieldset className="property-section">
        <legend>Size & rotation</legend>
        <GeometryProperties object={object} />
      </fieldset>
    </>
  );
}
function EmptyInspector() {
  const editor = useEditor();
  return (
    <div className="inspector-empty">
      <p>
        {editor.tool === "image"
          ? imageInstructions(editor)
          : "Select an object to adjust its appearance."}
      </p>
      {editor.tool === "image" && <ImagePicker />}
    </div>
  );
}
function imageInstructions(editor: ReturnType<typeof useEditor>) {
  return hasPlacementAsset(editor.document, editor.pendingObject)
    ? "Click the page to place your image."
    : "Choose an image, then click the page to place it.";
}
