import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
import { Library, FileCheck2, FileLock2, FileWarning, FileClock } from "lucide-react";
import { LibraryDialog } from "./LibraryDialog";
import { IconButton } from "./ui/IconButton";
import { Tooltip } from "./ui/Tooltip";
import { ActionPopover } from "./ui/ActionPopover";
export function DraftStatus() {
  const editor = useEditor(),
    draft = useDraft();
  const showLibrary = () => editor.setDialog("library");
  return (
    <div className="draft-status">
      {!editor.document.pages.length && draft.recoveries.length ? (
        draft.recoveries.slice(0, 1).map((recovery) => (
          <ActionPopover label="Saved document" icon={FileClock} key={recovery.id}>
            {(close) => (
              <>
                <p>
                  {recovery.document.name} · {new Date(recovery.savedAt).toLocaleString()}
                </p>
                <button
                  onClick={() => {
                    draft.restore(recovery);
                    close();
                  }}
                  disabled={!!editor.task.busy}
                >
                  Recover draft
                </button>
              </>
            )}
          </ActionPopover>
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
      <span role="status" className="draft-message">
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
