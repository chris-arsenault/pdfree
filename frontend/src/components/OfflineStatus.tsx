import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { useEditor } from "../hooks/editorContext";
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
  const apply = () => {
    if (
      editor.document.pages.length &&
      !window.confirm(
        "Updating reloads the editor. Download your editing project first to keep movable objects. Reload now?"
      )
    )
      return;
    update
      .current(true)
      .catch(() => setError("The update could not load. Your current editor remains available."));
  };
  return (
    <div className="offline-status" role="status">
      <span>{error || (ready ? "Ready to work offline" : "Installing offline assets…")}</span>
      {waiting && (
        <>
          <span>A new version is ready. Save your editing project before updating.</span>
          <button onClick={apply}>Update</button>
        </>
      )}
    </div>
  );
}
