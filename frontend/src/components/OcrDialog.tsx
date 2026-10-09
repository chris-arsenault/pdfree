import { useState } from "react";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { recognizePages } from "../services/ocr";
import { Modal } from "./Modal";
import { ProcessingStatus } from "./ProcessingStatus";
import { PageScopeField } from "./PageScopeField";
import { usePageScope, selectionDefault } from "../hooks/usePageScope";
export function OcrDialog() {
  const editor = useEditor(),
    task = useProcessing();
  const [result, setResult] = useState("");
  const scope = usePageScope(selectionDefault(editor)),
    ids = scope.pageIds;
  const run = () =>
    task.run(
      (signal, progress) => recognizePages(editor.document, ids, signal, progress),
      (recognized) => {
        editor.commit(recognized.document);
        setResult(
          `Recognition complete. ${recognized.skipped} page(s) with existing text or no source were skipped. Review accuracy before sharing.`
        );
      }
    );
  return (
    <Modal
      title="Recognize scanned text"
      onClose={() => {
        task.cancel();
        editor.setDialog("");
      }}
    >
      <p className="modal-description">
        English recognition runs on this device. The PDF appearance stays intact; recognized text
        becomes searchable and selectable.
      </p>
      <PageScopeField
        scope={scope.scope}
        onChange={scope.setScope}
        pageIds={ids}
        error={scope.error}
        disabled={task.busy}
      />
      <p className="field-note">
        Existing PDF text is skipped to avoid duplicate text layers. Engine and language assets are
        available offline after the app finishes caching.
      </p>
      <ProcessingStatus task={task} />
      {result && <p role="status">{result}</p>}
      <div className="modal-actions">
        <button
          className="button secondary"
          disabled={task.busy}
          onClick={() => {
            editor.commit({
              ...editor.document,
              pages: editor.document.pages.map((page) =>
                ids.includes(page.id) ? { ...page, recognition: null } : page
              ),
            });
            setResult("Recognition removed from selected pages.");
          }}
        >
          Remove recognition
        </button>
        <button className="button primary" disabled={task.busy || !ids.length} onClick={run}>
          Recognize {ids.length} page(s)
        </button>
      </div>
    </Modal>
  );
}
