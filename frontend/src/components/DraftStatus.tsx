import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
import { FileCheck2, FileLock2, FileWarning, FileClock } from "lucide-react";
import { Tooltip } from "./ui/Tooltip";
import { ActionPopover } from "./ui/ActionPopover";
/** Footer save status; recovery lives in the empty workspace and Library in the Open menu. */
export function DraftStatus() {
  return (
    <div className="draft-status">
      <DraftMessage />
    </div>
  );
}

function DraftMessage() {
  const editor = useEditor(),
    draft = useDraft();
  const showStorage = () => editor.setDialog("library");
  if (draft.autosaveOff)
    return (
      <span role="status" className="draft-message">
        <Tooltip
          label="Autosave off"
          detail="Autosave is off for protected PDFs in this browser. Open Library storage settings to change this for all documents."
        >
          <button
            type="button"
            className="popover-trigger draft-settings-trigger"
            aria-label="Autosave off"
            disabled={!!editor.task.busy}
            onClick={showStorage}
          >
            <FileLock2 size={17} aria-hidden="true" />
            <span>Autosave off</span>
          </button>
        </Tooltip>
      </span>
    );
  const routine =
    !draft.status || ["Saving draft…", "Draft saved on this device"].includes(draft.status);
  if (!routine) {
    const removed = draft.status.startsWith("Removed from library.");
    return (
      <span role="status">
        <ActionPopover
          label={removed ? "Removed from library" : "Draft not saved"}
          icon={removed ? FileClock : FileWarning}
          className="status-warning"
        >
          {() => <p>{draft.status}</p>}
        </ActionPopover>
      </span>
    );
  }
  if (!draft.status) return null;
  const saving = draft.status === "Saving draft…";
  return (
    <Tooltip label={saving ? "Saving draft…" : "Draft saved"}>
      <span role="status" className="draft-message">
        {saving ? (
          <FileClock size={14} aria-hidden="true" />
        ) : (
          <FileCheck2 size={14} aria-hidden="true" />
        )}
        <span>{saving ? "Saving…" : "Saved"}</span>
      </span>
    </Tooltip>
  );
}
