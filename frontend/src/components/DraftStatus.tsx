import { useDraft } from "../hooks/useDraft";
import { useEditor } from "../hooks/editorContext";
import { Database, FileCheck2 } from "lucide-react";
import { ActionPopover } from "./ui/ActionPopover";
export function DraftStatus() {
  const editor = useEditor(),
    draft = useDraft();
  const routine =
    !draft.status || ["Saving draft…", "Draft saved on this device"].includes(draft.status);
  return (
    <div className={`draft-status ${routine ? "" : "status-notice"}`}>
      {!editor.document.pages.length && draft.recoveries.length ? (
        draft.recoveries.map((recovery, index) => (
          <div className="draft-recovery" key={recovery.id}>
            <span>
              Recover {recovery.document.name} · {new Date(recovery.savedAt).toLocaleString()}
            </span>
            <button onClick={() => draft.restore(recovery)} disabled={!!editor.task.busy}>
              {index ? `Recover ${recovery.document.name}` : "Recover draft"}
            </button>
          </div>
        ))
      ) : (
        <span role="status">
          <FileCheck2 size={14} aria-hidden="true" />
          {draft.status || "Local drafts"}
        </span>
      )}
      <ActionPopover label="Local data" icon={Database}>
        {(close) => (
          <>
            <p>
              Drafts and remembered signatures stay in this browser. Download an editing project for
              backup.
            </p>
            {editor.document.pages.length > 0 && (
              <button
                onClick={() => {
                  editor.setDialog("properties");
                  close();
                }}
              >
                Document details
              </button>
            )}
            <button
              className="danger"
              onClick={() => {
                draft.discard();
                close();
              }}
              disabled={!!editor.task.busy}
            >
              Clear local data
            </button>
          </>
        )}
      </ActionPopover>
    </div>
  );
}
