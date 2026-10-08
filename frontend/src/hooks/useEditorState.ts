import { useReducer, useCallback, useContext } from "react";
import { emptyDocument, type EditorDocument, type PlacedObject } from "../core/model";
import { historyReducer } from "../core/history";
import { openFiles, insertImported } from "../services/openFiles";
import { useTask } from "./useTask";
import { useEditorUi } from "./useEditorUi";
import { usePdfPassword } from "./usePdfPassword";
import { useConfirmation } from "./useConfirmation";
import { selectedPageIds as selection, updatePlacedObject } from "../core/editorOperations";
import { SessionContext } from "./sessionContext";

// This hook owns the single document/history/task boundary used by each session.
// eslint-disable-next-line max-lines-per-function
export function useEditorState(initialDocument = emptyDocument(), initialDraftId?: string) {
  const sessions = useContext(SessionContext);
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialDocument,
    future: [],
    revision: 0,
  });
  const ui = useEditorUi(initialDraftId),
    password = usePdfPassword(),
    task = useTask(),
    confirmation = useConfirmation(!!task.busy),
    document = history.present;
  const page = document.pages.find((item) => item.id === ui.activeId) ?? document.pages[0] ?? null;
  const activePageId = page ? page.id : "";
  const selectedPageIds = selection(document, ui.pageIds, activePageId);
  const commit = useCallback(
    (next: EditorDocument) => dispatch({ type: "commit", document: next }),
    []
  );
  const resetUi = ui.reset;
  const replace = useCallback(
    (next: EditorDocument) => {
      resetUi();
      dispatch({ type: "reset", document: next });
    },
    [resetUi]
  );
  const importFiles = (files: File[], replaceCurrent = false, insertAfter = false) =>
    task.run("Opening files", async () => {
      if (!files.length) return;
      if (sessions && replaceCurrent && document.pages.length) {
        sessions.openFiles(files);
        return;
      }
      const replacing = replacingFiles(files, replaceCurrent);
      const allowed = await allowReplace(
        replacing,
        document.pages.length,
        ui.savedRevision !== history.revision,
        confirmation.ask
      );
      if (!allowed) return;
      const signal = password.begin();
      const loaded = await openFiles(
        files,
        replacing ? emptyDocument() : document,
        password.ask,
        signal
      );
      const next = insertAfter
        ? insertImported(loaded, document.pages.length, activePageId)
        : loaded;
      if (replacing) {
        replace(next);
        ui.setSavedRevision(-1);
      } else commit(next);
      ui.setActiveId(pageIdAt(next, replacing ? 0 : document.pages.length));
      ui.setObjectIds([]);
      ui.setPageIds([]);
    });
  const updateObject = (id: string, change: Partial<PlacedObject>) =>
    commit(updatePlacedObject(document, id, change));
  return {
    ...ui,
    document,
    history,
    dispatch,
    commit,
    replace,
    page,
    task,
    importFiles,
    updateObject,
    selectedPageIds,
    password,
    confirmation,
  };
}
function replacingFiles(files: File[], replaceCurrent: boolean) {
  return replaceCurrent || files.some((file) => file.name.toLowerCase().endsWith(".pdfree"));
}
function pageIdAt(document: EditorDocument, index: number) {
  return document.pages[index]?.id ?? "";
}
function allowReplace(
  replacing: boolean,
  pageCount: number,
  unsaved: boolean,
  ask: ReturnType<typeof useConfirmation>["ask"]
) {
  if (!replacing || !pageCount || !unsaved) return Promise.resolve(true);
  return ask({
    title: "Open a new document?",
    message: "Download an editing project first if you need to keep these edits.",
    confirmLabel: "Open document",
    tone: "primary",
  });
}
