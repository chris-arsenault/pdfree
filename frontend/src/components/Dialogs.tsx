import { text as tr } from "../i18n/runtime";
import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { Modal } from "./Modal";
import { type DialogName } from "../hooks/useEditorUi";
import { lazy, type ComponentType } from "react";
import { DeferredView } from "./DeferredView";
const signature = lazy(() =>
  import("./SignatureDialog").then((module) => ({ default: module.SignatureDialog }))
);
const Password = lazy(() =>
  import("./PdfPasswordDialog").then((module) => ({ default: module.PdfPasswordDialog }))
);
const components: Partial<Record<DialogName, ComponentType>> = {
  signature,
  initials: signature,
  export: lazy(() => import("./ExportDialog").then((module) => ({ default: module.ExportDialog }))),
  ocr: lazy(() => import("./OcrDialog").then((module) => ({ default: module.OcrDialog }))),
  cleanup: lazy(() =>
    import("./CleanupDialog").then((module) => ({ default: module.CleanupDialog }))
  ),
  repeat: lazy(() =>
    import("./RepeatedDialog").then((module) => ({ default: module.RepeatedDialog }))
  ),
  batch: lazy(() => import("./BatchDialog").then((module) => ({ default: module.BatchDialog }))),
  properties: lazy(() =>
    import("./DocumentDialog").then((module) => ({ default: module.DocumentDialog }))
  ),
  library: lazy(() =>
    import("./LibraryDialog").then((module) => ({ default: module.LibraryDialog }))
  ),
};
export function Dialogs() {
  const editor = useEditor();
  const close = useCloseDialog();
  if (editor.password.request)
    return (
      <DeferredView key="password" onClose={editor.password.cancel}>
        <Password />
      </DeferredView>
    );
  if (editor.dialog === "help") return <HelpDialog />;
  const Dialog = components[editor.dialog];
  return Dialog ? (
    <DeferredView key={editor.dialog} onClose={close}>
      <Dialog />
    </DeferredView>
  ) : null;
}
function HelpDialog() {
  const close = useCloseDialog();
  return (
    <Modal title={tr("help.title")} onClose={close}>
      <p className="modal-description">{tr("help.introduction")}</p>
      <ul className="help-list">
        <li>{tr("help.undo")}</li>
        <li>{tr("help.multiSelect")}</li>
        <li>{tr("help.nudge")}</li>
        <li>{tr("help.clipboard")}</li>
        <li>{tr("help.delete")}</li>
        <li>{tr("help.pageNumbers")}</li>
      </ul>
      <p className="field-note">{tr("help.safety")}</p>
    </Modal>
  );
}
