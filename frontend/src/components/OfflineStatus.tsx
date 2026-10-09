import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { useEditor } from "../hooks/editorContext";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { ActionPopover } from "./ui/ActionPopover";
import { Tooltip } from "./ui/Tooltip";
export function OfflineStatus() {
  const editor = useEditor(),
    [waiting, setWaiting] = useState(false),
    [error, setError] = useState("");
  const update = useRef<(reloadPage: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    update.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setWaiting(true),
      onRegisterError: () => setError("Offline installation is unavailable in this browser."),
    });
  }, []);
  const apply = () =>
    editor.task.run("Updating editor", async () => {
      if (
        editor.document.pages.length &&
        !(await editor.confirmation.ask({
          title: "Update and reload?",
          message:
            "Updating reloads the editor. Download an editing project first to keep movable objects and other edits.",
          confirmLabel: "Update and reload",
          tone: "primary",
        }))
      )
        return;
      await update
        .current(true)
        .catch(() => setError("The update could not load. Your current editor remains available."));
    });
  if (!error && !waiting) return null;
  return (
    <div className="offline-status" role="status">
      {error && (
        <ActionPopover label="Offline unavailable" icon={TriangleAlert} className="status-warning">
          {() => <p>{error}</p>}
        </ActionPopover>
      )}
      {waiting && (
        <Tooltip
          label="Update available"
          detail="Save your editing project before updating. Updating reloads the editor."
        >
          <button
            type="button"
            className="popover-trigger status-warning"
            aria-label="Update"
            onClick={apply}
            disabled={!!editor.task.busy}
          >
            <RefreshCw size={17} aria-hidden="true" />
            <span>Update</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
}
