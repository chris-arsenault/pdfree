import { text as tr } from "../i18n/runtime";
import { X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function EditorNotifications() {
  const editor = useEditor();
  return (
    <div className="editor-notifications">
      {editor.pinned.view.removed && (
        <div className="busy-banner" role="status">
          <span>{tr("notifications.pinnedRemoved")}</span>
          <IconButton
            label={tr("notifications.dismissPinned")}
            icon={X}
            onClick={() => editor.pinned.setView((previous) => ({ ...previous, removed: false }))}
          />
        </div>
      )}
      {editor.task.busy && (
        <div className="busy-banner" role="status">
          <span className="spinner" />
          <span>{editor.task.busy}…</span>
          {editor.task.kind === "task.openingFiles" && (
            <button
              className="button secondary"
              onClick={() => {
                editor.confirmation.answer(false);
                editor.password.cancel();
              }}
            >
              {tr("notifications.cancelOpening")}
            </button>
          )}
        </div>
      )}
      {editor.task.error && (
        <div className="error-banner" role="alert">
          <span>{editor.task.error}</span>
          <IconButton
            label={tr("notifications.dismissError")}
            icon={X}
            onClick={editor.task.dismiss}
          />
        </div>
      )}
      {editor.task.message && (
        <div className="busy-banner" role="status">
          <span>{editor.task.message}</span>
          <IconButton label={tr("notifications.dismiss")} icon={X} onClick={editor.task.dismiss} />
        </div>
      )}
    </div>
  );
}
