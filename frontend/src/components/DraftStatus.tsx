import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
import { Library, FileCheck2 } from "lucide-react";
import { LibraryDialog } from "./LibraryDialog";
export function DraftStatus() {
  const editor = useEditor(),
    draft = useDraft();
  const routine =
    !draft.status || ["Saving draft…", "Draft saved on this device"].includes(draft.status);
  return (
    <div className={`draft-status ${routine ? "" : "status-notice"}`}>
      {!editor.document.pages.length && draft.recoveries.length ? (
        draft.recoveries.slice(0, 1).map((recovery) => (
          <div className="draft-recovery" key={recovery.id}>
            <span>
              Recover {recovery.document.name} · {new Date(recovery.savedAt).toLocaleString()}
            </span>
            <button onClick={() => draft.restore(recovery)} disabled={!!editor.task.busy}>
              Recover draft
            </button>
          </div>
        ))
      ) : (
        <span role="status">
          <FileCheck2 size={14} aria-hidden="true" />
          {draft.status || "Local drafts"}
        </span>
      )}
      <button
        className="popover-trigger"
        disabled={!!editor.task.busy}
        onClick={() => editor.setDialog("library")}
      >
        <Library size={17} aria-hidden="true" /> Library
      </button>
      {editor.dialog === "library" && <LibraryDialog draft={draft} />}
    </div>
  );
}
