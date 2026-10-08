import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
export function DraftStatus() {
  const editor = useEditor(),
    draft = useDraft();
  return (
    <div className="draft-status" role="status">
      {!editor.document.pages.length && draft.recoveries.length ? (
        draft.recoveries.map((recovery, index) => (
          <div key={recovery.id}>
            <span>
              Recover {recovery.document.name} · {new Date(recovery.savedAt).toLocaleString()}
            </span>
            <button onClick={() => draft.restore(recovery)} disabled={!!editor.task.busy}>
              {index ? `Recover ${recovery.document.name}` : "Recover draft"}
            </button>
          </div>
        ))
      ) : (
        <span>{draft.status || "Drafts are stored only in this browser"}</span>
      )}
      <button onClick={draft.discard} disabled={!!editor.task.busy}>
        Clear local data
      </button>
    </div>
  );
}
