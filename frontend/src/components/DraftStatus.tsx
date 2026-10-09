import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
import { Library, FileCheck2, FileLock2 } from "lucide-react";
import { LibraryDialog } from "./LibraryDialog";
import { IconButton } from "./ui/IconButton";
import { Tooltip } from "./ui/Tooltip";
export function DraftStatus() {
  const editor = useEditor(),
    draft = useDraft();
  const routine =
    !draft.status || ["Saving draft…", "Draft saved on this device"].includes(draft.status);
  const showLibrary = () => editor.setDialog("library");
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
        <DraftMessage />
      )}
      <IconButton
        label="Library"
        detail="Reopen or delete documents saved on this device."
        icon={Library}
        disabled={!!editor.task.busy}
        onClick={showLibrary}
      />
      {editor.dialog === "library" && <LibraryDialog draft={draft} />}
    </div>
  );
}

function DraftMessage() {
  const editor = useEditor(),
    draft = useDraft();
  const showSettings = () => editor.setDialog("settings");
  if (draft.autosaveOff)
    return (
      <span role="status">
        <Tooltip
          label="Autosave off"
          detail="Your browser settings disable autosave for protected PDFs. Open Settings to change this for all documents."
        >
          <button
            type="button"
            className="popover-trigger draft-settings-trigger"
            aria-label="Autosave off"
            disabled={!!editor.task.busy}
            onClick={showSettings}
          >
            <FileLock2 size={17} aria-hidden="true" />
            <span>Autosave off</span>
          </button>
        </Tooltip>
      </span>
    );
  return (
    <span role="status">
      <FileCheck2 size={14} aria-hidden="true" />
      {draft.status || "Local drafts"}
    </span>
  );
}
