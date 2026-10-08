import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { useEditor } from "../hooks/editorContext";
import { CloudCheck, CloudDownload, RefreshCw } from "lucide-react";
import { ActionPopover } from "./ui/ActionPopover";
export function OfflineStatus() {
  const editor = useEditor(),
    [ready, setReady] = useState(false),
    [waiting, setWaiting] = useState(false),
    [error, setError] = useState("");
  const update = useRef<(reloadPage: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    const controlled = () => setReady(Boolean(navigator.serviceWorker.controller));
    navigator.serviceWorker?.addEventListener("controllerchange", controlled);
    update.current = registerSW({
      immediate: true,
      onOfflineReady: controlled,
      onNeedRefresh: () => setWaiting(true),
      onRegisterError: () => setError("Offline installation is unavailable in this browser."),
    });
    return () => navigator.serviceWorker?.removeEventListener("controllerchange", controlled);
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
  return (
    <div className={`offline-status ${error || waiting ? "status-notice" : ""}`} role="status">
      {error ? (
        <span>{error}</span>
      ) : (
        <ActionPopover
          label={ready ? "Ready to work offline" : "Installing offline assets…"}
          icon={ready ? CloudCheck : CloudDownload}
          className="offline-indicator"
        >
          {() => (
            <p>
              {ready ? "Ready to work offline." : "Installing offline assets…"} Offline readiness
              applies to application assets; your documents stay on your device.
            </p>
          )}
        </ActionPopover>
      )}
      {waiting && (
        <>
          <span>A new version is ready. Save your editing project before updating.</span>
          <button onClick={apply} disabled={!!editor.task.busy}>
            <RefreshCw size={14} aria-hidden="true" /> Update
          </button>
        </>
      )}
    </div>
  );
}
