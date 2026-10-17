import { formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
import { message } from "../i18n/messages";
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
    editor.task.run(message("task.updatingEditor"), async () => {
      if (
        editor.document.pages.length &&
        !(await editor.confirmation.ask({
          title: message("offline.updateQuestion"),
          message: message("offline.updateDescription"),
          confirmLabel: message("offline.updateConfirm"),
          tone: "primary",
        }))
      )
        return;
      await offline.update(true).catch(() => offline.setError(message("offline.updateFailed")));
    });
  return (
    <div className="offline-status" role="status">
      {offline.error ? (
        <ActionPopover
          label={tr("offline.unavailable")}
          icon={TriangleAlert}
          className="status-warning"
        >
          {() => <p>{offline.error}</p>}
        </ActionPopover>
      ) : (
        offline.mode !== "unsupported" && <OfflineAccess offline={offline} />
      )}
      {offline.waiting && (
        <Tooltip label={tr("offline.updateAvailable")} detail={tr("offline.updateHint")}>
          <button
            type="button"
            className="popover-trigger status-warning"
            aria-label={tr("offline.update")}
            onClick={apply}
            disabled={!!editor.task.busy}
          >
            <RefreshCw size={17} aria-hidden="true" />
            <span>{tr("offline.update")}</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
}

const megabytes = (bytes: number) =>
  formatNumber(bytes / 1024 / 1024, { style: "unit", unit: "megabyte", maximumFractionDigits: 0 });
function triggerLabel(offline: Offline) {
  if (offline.mode === "on") return tr("offline.on");
  if (offline.mode === "saving")
    return offline.progress === null
      ? tr("offline.saving")
      : tr("offline.savingPercent", { percent: Math.round(offline.progress * 100) });
  return tr("offline.use");
}

function OfflineAccess({ offline }: { offline: Offline }) {
  const editor = useEditor();
  const remove = () =>
    editor.task.run(message("task.removingOffline"), async () => {
      if (
        await editor.confirmation.ask({
          title: message("offline.removeQuestion"),
          message: message("offline.removeDescription"),
          confirmLabel: message("offline.remove"),
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
                <MonitorDown size={16} aria-hidden="true" /> {tr("offline.install")}
              </button>
            )}
            {offline.mode === "off" && (
              <button className="button primary" onClick={offline.enable}>
                {tr("offline.makeAvailable")}
              </button>
            )}
            {offline.mode === "on" && (
              <button className="button secondary" onClick={remove}>
                {tr("offline.remove")}
              </button>
            )}
          </div>
        </div>
      )}
    </ActionPopover>
  );
}

function OfflineDetails({ offline }: { offline: Offline }) {
  const size = offline.size ? megabytes(offline.size.bytes) : tr("offline.sizeUnknown");
  if (offline.mode === "saving")
    return (
      <>
        <p>{tr("offline.savingSize", { size })}</p>
        <progress aria-label={tr("offline.saved")} max={1} value={offline.progress ?? undefined} />
      </>
    );
  if (offline.mode === "on")
    return (
      <p>
        {tr("offline.savedDescription")}
        {!offline.kept && tr("offline.eviction")}
      </p>
    );
  return <p>{tr("offline.availableDescription", { size })}</p>;
}
