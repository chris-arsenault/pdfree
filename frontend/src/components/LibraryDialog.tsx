import { formatDate } from "../i18n/format";
import { useMessageState } from "../i18n/react";
import { message, errorMessage } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
import { useEffect, useState, useCallback, useId, type ChangeEvent } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { useDraft } from "../hooks/useDraft";
import { useProtectedAutosaveDisabled } from "../hooks/useSettings";
import { setProtectedAutosaveDisabled } from "../services/settings";
import { useSavedSignatures } from "../hooks/useSavedSignatures";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { loadDrafts, deleteSavedDraft, onDraftsRemoved, type Draft } from "../services/drafts";
import { type SavedSignature } from "../services/signatures";
import { Modal } from "./Modal";
import { IconButton } from "./ui/IconButton";
import { ObjectImage } from "./ObjectAppearance";

export function LibraryDialog() {
  const editor = useEditor(),
    draft = useDraft(),
    close = useCloseDialog(),
    library = useLibraryDocuments(draft.status),
    signatures = useSavedSignatures();
  return (
    <Modal title={tr("common.library")} onClose={close}>
      <p className="modal-description">{tr("library.description")}</p>
      {editor.task.error && <p role="alert">{editor.task.error}</p>}
      <section className="library-section" aria-label={tr("welcome.savedDocuments")}>
        <h3>{tr("common.documents")}</h3>
        {library.error && <p role="alert">{library.error}</p>}
        {library.loading ? (
          <p>{tr("common.loading")}</p>
        ) : (
          !library.documents.length && <p>{tr("library.emptyDocuments")}</p>
        )}
        <ul className="library-list">
          {library.documents.map((saved) => (
            <DocumentRow
              key={saved.id}
              saved={saved}
              onOpen={draft.restore}
              onDelete={library.remove}
            />
          ))}
        </ul>
      </section>
      <section className="library-section" aria-label={tr("library.savedSignatures")}>
        <h3>{tr("common.signatures")}</h3>
        {signatures.error && <p role="alert">{signatures.error}</p>}
        {!signatures.saved.length && !signatures.error && <p>{tr("library.emptySignatures")}</p>}
        {!!signatures.saved.length && !editor.page && <p>{tr("library.openForSignature")}</p>}
        <ul className="library-list">
          {signatures.saved.map((saved) => (
            <SignatureRow
              key={saved.id}
              saved={saved}
              onUse={signatures.use}
              onDelete={signatures.remove}
            />
          ))}
        </ul>
      </section>
      <StorageSettings />
    </Modal>
  );
}

function StorageSettings() {
  const disabled = useProtectedAutosaveDisabled();
  const noteId = useId();
  const [error, setError] = useMessageState();
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setProtectedAutosaveDisabled(event.target.checked);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };
  return (
    <section className="library-section" aria-label={tr("library.storageSettings")}>
      <h3>{tr("common.storage")}</h3>
      <label className="checkbox-label">
        <input type="checkbox" checked={disabled} onChange={change} aria-describedby={noteId} />
        {tr("library.disableProtectedAutosave")}
      </label>
      <p className="field-note" id={noteId}>
        {tr("library.autosaveDescription")}
      </p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

function useLibraryDocuments(status: string) {
  const editor = useEditor();
  const [documents, setDocuments] = useState<Draft[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useMessageState();
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      loadDrafts()
        .then((items) => {
          if (!cancelled) {
            setDocuments(items);
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) setError(message("library.unavailable"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    refresh();
    const unsubscribe = onDraftsRemoved(refresh);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [status]);
  const remove = (saved: Draft) =>
    editor.task.run(message("task.deletingSaved"), async () => {
      if (
        !(await editor.confirmation.ask({
          title: message("common.deleteQuestion", { name: saved.document.name }),
          message: message("library.removeDescription"),
          confirmLabel: message("library.deleteDocument"),
          tone: "danger",
        }))
      )
        return;
      await deleteSavedDraft(saved.id);
      setDocuments(await loadDrafts());
    });
  return { documents, loading, error, remove };
}

function DocumentRow({
  saved,
  onOpen,
  onDelete,
}: {
  saved: Draft;
  onOpen: (draft: Draft) => void;
  onDelete: (draft: Draft) => void;
}) {
  const editor = useEditor();
  const remove = useCallback(() => onDelete(saved), [saved, onDelete]);
  return (
    <li>
      <FileText size={20} aria-hidden="true" />
      <div className="library-item-info">
        <span>{saved.document.name}</span>
        <small>
          {tr("common.pages", { count: saved.document.pages.length })} ·{" "}
          {formatDate(new Date(saved.savedAt), { dateStyle: "medium", timeStyle: "short" })}
        </small>
      </div>
      <button
        className="button secondary"
        disabled={!!editor.task.busy}
        aria-label={tr("common.openNamed", { name: saved.document.name })}
        onClick={() => onOpen(saved)}
      >
        {tr("common.open")}
      </button>
      <IconButton
        label={tr("common.deleteNamed", { name: saved.document.name })}
        icon={Trash2}
        disabled={!!editor.task.busy}
        onClick={remove}
      />
    </li>
  );
}

function SignatureRow({
  saved,
  onUse,
  onDelete,
}: {
  saved: SavedSignature;
  onUse: (signature: SavedSignature) => void;
  onDelete: (id: string) => void;
}) {
  const editor = useEditor();
  const remove = useCallback(() => onDelete(saved.id), [saved.id, onDelete]);
  return (
    <li>
      <div className="library-item-info">
        <div className="library-signature-preview">
          {saved.asset ? (
            <ObjectImage asset={saved.asset} />
          ) : (
            <span className="signature-font">{saved.object.text || saved.label}</span>
          )}
        </div>
        {saved.asset && <small>{saved.label}</small>}
      </div>
      <button
        className="button secondary"
        disabled={!!editor.task.busy || !editor.page}
        aria-label={tr("common.useNamed", { name: saved.label })}
        onClick={() => onUse(saved)}
      >
        {tr("common.use")}
      </button>
      <IconButton
        label={tr("library.deleteSignature", { name: saved.label })}
        icon={Trash2}
        disabled={!!editor.task.busy}
        onClick={remove}
      />
    </li>
  );
}
