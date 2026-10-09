import { useEditor } from "../hooks/editorContext";
import { useOffline } from "../hooks/useOffline";
import {
  CircleCheck,
  HardDriveDownload,
  MonitorDown,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { ActionPopover } from "./ui/ActionPopover";
import { Tooltip } from "./ui/Tooltip";

type Offline = ReturnType<typeof useOffline>;

/** Footer offline state: opt-in offline copy, app installation and updates. */
export function OfflineStatus() {
  const editor = useEditor(),
    offline = useOffline();
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
      await offline
        .update(true)
        .catch(() =>
          offline.setError("The update could not load. Your current editor remains available.")
        );
    });
  return (
    <div className="offline-status" role="status">
      {offline.error ? (
        <ActionPopover label="Offline unavailable" icon={TriangleAlert} className="status-warning">
          {() => <p>{offline.error}</p>}
        </ActionPopover>
      ) : (
        offline.mode !== "unsupported" && <OfflineAccess offline={offline} />
      )}
      {offline.waiting && (
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

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
function triggerLabel(offline: Offline) {
  if (offline.mode === "on") return "Works offline";
  if (offline.mode === "saving")
    return offline.progress === null
      ? "Saving for offline…"
      : `Saving for offline ${Math.round(offline.progress * 100)}%`;
  return "Use offline";
}

function OfflineAccess({ offline }: { offline: Offline }) {
  const editor = useEditor();
  const remove = () =>
    editor.task.run("Removing offline copy", async () => {
      if (
        await editor.confirmation.ask({
          title: "Remove offline copy?",
          message:
            "PDFree will load from the internet again and stop working without a connection. Documents saved in your Library stay on this device.",
          confirmLabel: "Remove offline copy",
          tone: "danger",
        })
      )
        await offline.remove();
    });
  return (
    <ActionPopover
      label={triggerLabel(offline)}
      icon={offline.mode === "on" ? CircleCheck : HardDriveDownload}
      className="offline-access"
    >
      {() => (
        <div className="offline-panel">
          <OfflineDetails offline={offline} />
          <div className="offline-actions">
            {offline.installable && (
              <button className="button secondary" onClick={offline.install}>
                <MonitorDown size={16} aria-hidden="true" /> Install app
              </button>
            )}
            {offline.mode === "off" && (
              <button className="button primary" onClick={offline.enable}>
                Make available offline
              </button>
            )}
            {offline.mode === "on" && (
              <button className="button secondary" onClick={remove}>
                Remove offline copy
              </button>
            )}
          </div>
        </div>
      )}
    </ActionPopover>
  );
}

function OfflineDetails({ offline }: { offline: Offline }) {
  const size = offline.size ? megabytes(offline.size.bytes) : "about 30 MB";
  if (offline.mode === "saving")
    return (
      <>
        <p>Saving PDFree to this device ({size})…</p>
        <progress aria-label="Offline copy saved" max={1} value={offline.progress ?? undefined} />
      </>
    );
  if (offline.mode === "on")
    return (
      <p>
        PDFree is saved on this device and opens without a connection, including text recognition.
        Updates appear here when available.
        {!offline.kept &&
          " The browser may clear the offline copy if the device runs low on space."}
      </p>
    );
  return (
    <p>
      PDFree loads from the internet on each visit. Save it to this device ({size}, including text
      recognition) to open and use it without a connection. Your documents stay on this device
      either way.
    </p>
  );
}
