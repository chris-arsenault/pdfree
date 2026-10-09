import { useCallback, useState, useRef } from "react";
import { newId, type PlacedObject, type Tool } from "../core/model";
import { useCommentUi } from "./useCommentUi";
import { emptyClipboard } from "../core/editorOperations";
/** Where Export opens: the whole document, the page selection as a PDF, or Split. */
export type ExportStart = "document" | "extract" | "split";
export type DialogName =
  | ""
  | "signature"
  | "initials"
  | "export"
  | "help"
  | "properties"
  | "library"
  | "ocr"
  | "cleanup"
  | "repeat"
  | "batch";
/** The left panel shows either page thumbnails or the bookmark outline. */
export type LeftTab = "pages" | "bookmarks";
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
  const [leftTab, setLeftTab] = useState<LeftTab>("pages");
  const [zoom, setZoom] = useState(1);
  // Outlines recognized words on the page, tinted by confidence, for reviewing OCR.
  const [showRecognition, setShowRecognition] = useState(false);
  const [dialog, setDialog] = useState<DialogName>("");
  const [pendingObject, setPendingObject] = useState<Partial<PlacedObject>>({});
  const [savedRevision, setSavedRevision] = useState(-1);
  const [exportStart, setExportStart] = useState<ExportStart>("document");
  const openExport = useCallback((start: ExportStart) => {
    setExportStart(start);
    setDialog("export");
  }, []);
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
    setExportStart("document");
    setPropertiesOpen(false);
    setShowRecognition(false);
    resetComments();
    setPagesOpen(window.matchMedia("(min-width: 761px)").matches);
    setLeftTab("pages");
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
    leftTab,
    setLeftTab,
    tool,
    setTool,
    zoom,
    setZoom,
    showRecognition,
    setShowRecognition,
    dialog,
    setDialog,
    pendingObject,
    setPendingObject,
    savedRevision,
    setSavedRevision,
    exportStart,
    openExport,
    documentEpoch,
    draftId,
    setDraftId,
    reset,
  };
}
