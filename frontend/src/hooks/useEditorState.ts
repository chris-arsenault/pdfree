import { useReducer, useCallback } from "react";
import { emptyDocument, type EditorDocument, type PlacedObject } from "../core/model";
import { historyReducer } from "../core/history";
import { openFiles, insertImported } from "../services/openFiles";
import { useTask } from "./useTask";
import { useEditorUi } from "./useEditorUi";
import { selectedPageIds as selection, updatePlacedObject } from "../core/editorOperations";

export function useEditorState() {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: emptyDocument(),
    future: [],
    revision: 0,
  });
  const ui = useEditorUi(),
    task = useTask(),
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
      const replacing =
        replaceCurrent || files.some((file) => file.name.toLowerCase().endsWith(".pdfree"));
      if (!allowReplace(replacing, document.pages.length, ui.savedRevision !== history.revision))
        return;
      const loaded = await openFiles(files, replacing ? emptyDocument() : document);
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
  };
}
function pageIdAt(document: EditorDocument, index: number) {
  return document.pages[index]?.id ?? "";
}
function allowReplace(replacing: boolean, pageCount: number, unsaved: boolean) {
  return (
    !replacing ||
    !pageCount ||
    !unsaved ||
    window.confirm(
      "Open a new document? Download an editing project first if you need to keep these edits."
    )
  );
}
