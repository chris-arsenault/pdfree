import { useEditor } from "../hooks/editorContext";
import { PlacedItem } from "./PlacedItem";
import { type Page } from "../core/model";
import { ObjectFrame } from "./ObjectFrame";
import { ObjectAppearance } from "./ObjectAppearance";
export function ObjectLayer({
  page,
  scale,
  readOnly = false,
}: {
  page?: Page;
  scale?: number;
  readOnly?: boolean;
}) {
  const editor = useEditor();
  const visiblePage = page ?? editor.page;
  return (
    <div className="object-layer">
      {visiblePage?.objects.map((object) =>
        readOnly ? (
          <ObjectFrame
            key={object.id}
            className={`placed-object reference-object kind-${object.kind}`}
            object={object}
            page={visiblePage}
            scale={scale ?? editor.zoom}
          >
            <ObjectAppearance object={object} assets={editor.document.assets} />
          </ObjectFrame>
        ) : (
          <PlacedItem key={object.id} object={object} />
        )
      )}
    </div>
  );
}
