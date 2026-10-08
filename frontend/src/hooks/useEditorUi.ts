import { useCallback, useState } from "react";
import { type PlacedObject, type Tool } from "../core/model";
export type DialogName = "" | "signature" | "initials" | "split" | "export" | "help" | "properties";
export function useEditorUi() {
  const [activeId, setActiveId] = useState("");
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [objectIds, setObjectIds] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [dialog, setDialog] = useState<DialogName>("");
  const [pendingObject, setPendingObject] = useState<Partial<PlacedObject>>({});
  const [savedRevision, setSavedRevision] = useState(-1);
  const [exportSelected, setExportSelected] = useState(false);
  const [documentEpoch, setDocumentEpoch] = useState(0);
  const reset = useCallback(() => {
    setActiveId("");
    setPageIds([]);
    setObjectIds([]);
    setTool("select");
    setPendingObject({});
    setDialog("");
    setSavedRevision(-1);
    setExportSelected(false);
    setDocumentEpoch((epoch) => epoch + 1);
  }, []);
  return {
    activeId,
    setActiveId,
    pageIds,
    setPageIds,
    objectIds,
    setObjectIds,
    tool,
    setTool,
    zoom,
    setZoom,
    dialog,
    setDialog,
    pendingObject,
    setPendingObject,
    savedRevision,
    setSavedRevision,
    exportSelected,
    setExportSelected,
    documentEpoch,
    reset,
  };
}
