import { LockKeyhole } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { DraftStatus } from "./DraftStatus";
import { OfflineStatus } from "./OfflineStatus";
import { ZoomControls } from "./ZoomControls";
import { ActionPopover } from "./ui/ActionPopover";

export function Footer() {
  const editor = useEditor();
  const saveStatus =
    editor.savedRevision === editor.history.revision ? "Exported" : "Editing locally";
  return (
    <footer className="app-footer">
      <ActionPopover label="On this device" icon={LockKeyhole} className="privacy-status">
        {() => (
          <p>
            PDFs, edits, signatures and credentials are processed in your browser. Documents are
            never uploaded.
          </p>
        )}
      </ActionPopover>
      <DraftStatus />
      <OfflineStatus />
      <span className="save-status">
        {editor.document.pages.length ? saveStatus : "Ready when you are"}
      </span>
      {editor.page && <ZoomControls />}
    </footer>
  );
}
