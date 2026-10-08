import { useEffect, useState, useCallback } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type useDraft } from "../hooks/useDraft";
import { useSavedSignatures } from "../hooks/useSavedSignatures";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { loadDrafts, deleteSavedDraft, onDraftsRemoved, type Draft } from "../services/drafts";
import { type SavedSignature } from "../services/signatures";
import { Modal } from "./Modal";
import { IconButton } from "./ui/IconButton";
import { ObjectImage } from "./ObjectAppearance";

export function LibraryDialog({ draft }: { draft: ReturnType<typeof useDraft> }) {
  const editor = useEditor(),
    close = useCloseDialog(),
    library = useLibraryDocuments(draft.status),
    signatures = useSavedSignatures();
  return (
    <Modal title="Library" onClose={close}>
      <p className="modal-description">Documents and signatures saved in this browser.</p>
      {editor.task.error && <p role="alert">{editor.task.error}</p>}
      <section className="library-section" aria-label="Saved documents">
        <h3>Documents</h3>
        {library.error && <p role="alert">{library.error}</p>}
        {library.loading ? (
          <p>Loading…</p>
        ) : (
          !library.documents.length && <p>No saved documents.</p>
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
      <section className="library-section" aria-label="Saved signatures">
        <h3>Signatures</h3>
        {signatures.error && <p role="alert">{signatures.error}</p>}
        {!signatures.saved.length && !signatures.error && <p>No saved signatures.</p>}
        {!!signatures.saved.length && !editor.page && <p>Open a document to use a signature.</p>}
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
    </Modal>
  );
}

function useLibraryDocuments(status: string) {
  const editor = useEditor();
  const [documents, setDocuments] = useState<Draft[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      loadDrafts()
        .then((items) => {
          if (!cancelled) {
            setDocuments(items);
            setError("");
          }
        })
        .catch(() => {
          if (!cancelled) setError("Saved documents are unavailable in this browser.");
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
    editor.task.run("Deleting saved document", async () => {
      if (
        !(await editor.confirmation.ask({
          title: `Delete ${saved.document.name}?`,
          message:
            "Remove this saved document from the library? Open documents and downloaded files are kept.",
          confirmLabel: "Delete document",
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
          {saved.document.pages.length} {saved.document.pages.length === 1 ? "page" : "pages"} ·{" "}
          {new Date(saved.savedAt).toLocaleString()}
        </small>
      </div>
      <button
        className="button secondary"
        disabled={!!editor.task.busy}
        aria-label={`Open ${saved.document.name}`}
        onClick={() => onOpen(saved)}
      >
        Open
      </button>
      <IconButton
        label={`Delete ${saved.document.name}`}
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
        aria-label={`Use ${saved.label}`}
        onClick={() => onUse(saved)}
      >
        Use
      </button>
      <IconButton
        label={`Delete signature ${saved.label}`}
        icon={Trash2}
        disabled={!!editor.task.busy}
        onClick={remove}
      />
    </li>
  );
}
