import { useCallback, useState } from "react";
import { type PlacedObject, type Tool } from "../core/model";
export type DialogName = "" | "signature" | "initials" | "split" | "export" | "help" | "properties";
export function useEditorUi() {
  const [activeId, setActiveId] = useState("");
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [objectIds, updateObjectIds] = useState<string[]>([]);
  const [tool, updateTool] = useState<Tool>("select");
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(() => window.matchMedia("(min-width: 761px)").matches);
  const [zoom, setZoom] = useState(1);
  const [dialog, setDialog] = useState<DialogName>("");
  const [pendingObject, setPendingObject] = useState<Partial<PlacedObject>>({});
  const [savedRevision, setSavedRevision] = useState(-1);
  const [exportSelected, setExportSelected] = useState(false);
  const [documentEpoch, setDocumentEpoch] = useState(0);
  const setObjectIds = useCallback((ids: string[]) => {
    updateObjectIds(ids);
    setPropertiesOpen(ids.length > 0);
  }, []);
  const setTool = useCallback((next: Tool) => {
    updateTool(next);
    if (next === "image") setPropertiesOpen(true);
  }, []);
  const reset = useCallback(() => {
    setActiveId("");
    setPageIds([]);
    setObjectIds([]);
    setTool("select");
    setPendingObject({});
    setDialog("");
    setSavedRevision(-1);
    setExportSelected(false);
    setPropertiesOpen(false);
    setPagesOpen(window.matchMedia("(min-width: 761px)").matches);
    setDocumentEpoch((epoch) => epoch + 1);
  }, [setObjectIds, setTool]);
  return {
    activeId,
    setActiveId,
    pageIds,
    setPageIds,
    objectIds,
    setObjectIds,
    propertiesOpen,
    setPropertiesOpen,
    pagesOpen,
    setPagesOpen,
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
