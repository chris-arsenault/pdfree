import { useCallback, useState, useRef } from "react";
import { newId, type PlacedObject, type Tool } from "../core/model";
import { useCommentUi } from "./useCommentUi";
import { emptyClipboard } from "../core/editorOperations";
export type DialogName =
  | ""
  | "signature"
  | "initials"
  | "split"
  | "export"
  | "help"
  | "properties"
  | "library"
  | "ocr"
  | "cleanup"
  | "repeat"
  | "batch"
  | "bookmarks";
// eslint-disable-next-line max-lines-per-function -- Session UI state shares one reset boundary; keep these independent state primitives together.
export function useEditorUi(initialDraftId?: string) {
  const clipboard = useRef(emptyClipboard());
  const [activeId, setActiveId] = useState("");
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [objectIds, updateObjectIds] = useState<string[]>([]);
  const [tool, updateTool] = useState<Tool>("select");
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const comments = useCommentUi();
  const { setCommentsOpen, resetComments } = comments;
  const [pagesOpen, setPagesOpen] = useState(() => window.matchMedia("(min-width: 761px)").matches);
  const [zoom, setZoom] = useState(1);
  const [dialog, setDialog] = useState<DialogName>("");
  const [pendingObject, setPendingObject] = useState<Partial<PlacedObject>>({});
  const [savedRevision, setSavedRevision] = useState(-1);
  const [exportSelected, setExportSelected] = useState(false);
  const [documentEpoch, setDocumentEpoch] = useState(0);
  const [draftId, setDraftId] = useState<string>(() => initialDraftId ?? newId());
  const setObjectIds = useCallback(
    (ids: string[]) => {
      updateObjectIds(ids);
      setPropertiesOpen(ids.length > 0);
      if (ids.length) setCommentsOpen(false);
    },
    [setCommentsOpen]
  );
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
    resetComments();
    setPagesOpen(window.matchMedia("(min-width: 761px)").matches);
    setDocumentEpoch((epoch) => epoch + 1);
    setDraftId(newId());
    clipboard.current = emptyClipboard();
  }, [setObjectIds, setTool, resetComments]);
  return {
    clipboard,
    activeId,
    setActiveId,
    pageIds,
    setPageIds,
    objectIds,
    setObjectIds,
    propertiesOpen,
    ...comments,
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
    draftId,
    setDraftId,
    reset,
  };
}
