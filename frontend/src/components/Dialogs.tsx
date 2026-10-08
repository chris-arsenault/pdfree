import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { SignatureDialog } from "./SignatureDialog";
import { ExportDialog } from "./ExportDialog";
import { Modal } from "./Modal";
import { SplitDialog } from "./SplitDialog";
import { DocumentDialog } from "./DocumentDialog";
export function Dialogs() {
  const editor = useEditor();
  const close = useCloseDialog();
  if (editor.dialog === "signature" || editor.dialog === "initials") return <SignatureDialog />;
  if (editor.dialog === "export") return <ExportDialog />;
  if (editor.dialog === "split") return <SplitDialog />;
  if (editor.dialog === "properties") return <DocumentDialog />;
  if (editor.dialog === "help")
    return (
      <Modal title="A little help" onClose={close}>
        <p className="modal-description">
          Click existing form fields to fill them. For scans, choose Text and click the page. Drag
          objects to move them; use the corner to resize.
        </p>
        <ul className="help-list">
          <li>Ctrl/⌘ Z: undo · Ctrl/⌘ Shift Z: redo</li>
          <li>Shift-click: select multiple objects</li>
          <li>Arrow keys: nudge selected objects · Shift: larger steps</li>
          <li>Ctrl/⌘ C and V: copy and paste objects</li>
          <li>Delete: remove selected objects</li>
          <li>Rotation and splitting use physical page numbers.</li>
        </ul>
        <p className="field-note">
          Signatures are visible marks. Covering text with a shape does not securely redact it. PDF
          JavaScript is not executed.
        </p>
      </Modal>
    );
  return null;
}
