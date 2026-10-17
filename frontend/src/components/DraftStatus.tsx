import { text as tr } from "../i18n/runtime";
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
        <Tooltip label={tr("draft.autosaveOff")} detail={tr("draft.autosaveHint")}>
          <button
            type="button"
            className="popover-trigger draft-settings-trigger"
            aria-label={tr("draft.autosaveOff")}
            disabled={!!editor.task.busy}
            onClick={showStorage}
          >
            <FileLock2 size={17} aria-hidden="true" />
            <span>{tr("draft.autosaveOff")}</span>
          </button>
        </Tooltip>
      </span>
    );
  const routine =
    !draft.statusKind || ["draft.saving", "draft.savedAccessible"].includes(draft.statusKind);
  if (!routine) {
    const removed = draft.statusKind === "draft.removed";
    return (
      <span role="status">
        <ActionPopover
          label={removed ? tr("draft.removedLabel") : tr("draft.notSaved")}
          icon={removed ? FileClock : FileWarning}
          className="status-warning"
        >
          {() => <p>{draft.status}</p>}
        </ActionPopover>
      </span>
    );
  }
  if (!draft.status) return null;
  const saving = draft.statusKind === "draft.saving";
  // Plain status text: a hover tooltip here only repeated it and could open over
  // the page list whenever autosave ran under a resting pointer.
  return (
    <span role="status" className="draft-message">
      {saving ? (
        <FileClock size={14} aria-hidden="true" />
      ) : (
        <FileCheck2 size={14} aria-hidden="true" />
      )}
      <span>{saving ? tr("draft.savingLabel") : tr("draft.savedLabel")}</span>
      <span className="sr-only">
        {saving ? tr("draft.savingAccessible") : tr("draft.savedAccessible")}
      </span>
    </span>
  );
}
