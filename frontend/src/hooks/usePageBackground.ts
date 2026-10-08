import { useContext, useMemo } from "react";
import { type Page } from "../core/model";
import { EditorContext } from "./editorContext";

// Overlay edits must not invalidate the source raster or native text layer.
export function usePageBackground(page: Page) {
  const { id, sourceId, sourceIndex, rotation, scan } = page;
  const { x, y, width, height } = page.box;
  const asset = useContext(EditorContext)?.document.assets.find(
    (asset) => asset.id === scan?.assetId
  );
  const assets = useMemo(() => (asset ? [asset] : []), [asset]);
  const background = useMemo<Page>(
    () => ({
      id,
      sourceId,
      sourceIndex,
      rotation,
      scan,
      box: { x, y, width, height },
      objects: [],
      comments: [],
    }),
    [id, sourceId, sourceIndex, rotation, scan, x, y, width, height]
  );
  return { background, assets };
}
