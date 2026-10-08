import { useEditor } from "../hooks/editorContext";
import { PlacedItem } from "./PlacedItem";
export function ObjectLayer() {
  const editor = useEditor();
  return (
    <div className="object-layer">
      {editor.page?.objects.map((object) => (
        <PlacedItem key={object.id} object={object} />
      ))}
    </div>
  );
}
