import { useEditor } from "../hooks/editorContext";
import { DraftStatus } from "./DraftStatus";
import { OfflineStatus } from "./OfflineStatus";
import { ZoomControls } from "./ZoomControls";

export function Footer() {
  const editor = useEditor();
  return (
    <footer className="app-footer">
      <DraftStatus />
      <OfflineStatus />
      {editor.page && <ZoomControls />}
    </footer>
  );
}
