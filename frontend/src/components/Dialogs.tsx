import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { SignatureDialog } from "./SignatureDialog";
import { ExportDialog } from "./ExportDialog";
import { Modal } from "./Modal";
import { DocumentDialog } from "./DocumentDialog";
import { PdfPasswordDialog } from "./PdfPasswordDialog";
import { OcrDialog } from "./OcrDialog";
import { CleanupDialog } from "./CleanupDialog";
import { RepeatedDialog } from "./RepeatedDialog";
import { BatchDialog } from "./BatchDialog";
import { LibraryDialog } from "./LibraryDialog";
import { type ComponentType } from "react";
import { type DialogName } from "../hooks/useEditorUi";
const components: Partial<Record<DialogName, ComponentType>> = {
  signature: SignatureDialog,
  initials: SignatureDialog,
  export: ExportDialog,
  ocr: OcrDialog,
  cleanup: CleanupDialog,
  repeat: RepeatedDialog,
  batch: BatchDialog,
  properties: DocumentDialog,
  library: LibraryDialog,
  help: HelpDialog,
};
export function Dialogs() {
  const editor = useEditor();
  if (editor.password.request) return <PdfPasswordDialog />;
  const Dialog = components[editor.dialog];
  return Dialog ? <Dialog /> : null;
}
function HelpDialog() {
  const close = useCloseDialog();
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
}
