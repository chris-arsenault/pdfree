import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { useExport } from "../hooks/useExport";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { Modal } from "./Modal";
import { filePicker } from "../services/fileSave";
import { defaultSecuritySettings, hasSecurity } from "../core/securitySettings";
import { ExportSecurity } from "./ExportSecurity";
export function ExportDialog() {
  const editor = useEditor(),
    [flatten, setFlatten] = useState(false),
    [selected, setSelected] = useState(editor.exportSelected);
  const [security, setSecurity] = useState(defaultSecuritySettings);
  const [name, setName] = useState(editor.document.name),
    actions = useExport(name, selected, flatten, security);
  const close = useCloseDialog();
  return (
    <Modal title="Export your document" onClose={close}>
      <p className="modal-description">
        Your PDF is created on this device and downloaded directly.
      </p>
      <label>
        File name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => setSelected(event.target.checked)}
        />
        Export selected pages ({editor.selectedPageIds.length})
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={flatten}
          onChange={(event) => setFlatten(event.target.checked)}
        />
        Flatten form fields
      </label>
      <p className="field-note">
        Flattening keeps the filled appearance and removes interactive fields. Save an editing
        project to continue moving added objects.
      </p>
      <RequiredFields />
      <ExportSecurity value={security} onChange={setSecurity} disabled={!!editor.task.busy} />
      <OtherFormats actions={actions} />
      <div className="modal-actions">
        <button
          className="button secondary"
          onClick={() => actions.exportFile(true)}
          disabled={!!editor.task.busy}
        >
          <Printer size={16} /> {hasSecurity(security) ? "Print unprotected copy" : "Print"}
        </button>
        <button
          className="button primary"
          onClick={() => actions.exportFile()}
          disabled={!!editor.task.busy || !name.trim()}
        >
          <Download size={16} /> Download PDF
        </button>
      </div>
    </Modal>
  );
}
function OtherFormats({ actions }: { actions: ReturnType<typeof useExport> }) {
  const editor = useEditor();
  return (
    <div className="export-extras">
      <button
        className="button secondary"
        onClick={actions.saveProject}
        disabled={!!editor.task.busy}
      >
        Download editing project
      </button>
      <button className="button secondary" onClick={actions.images} disabled={!!editor.task.busy}>
        Page images (PNG ZIP)
      </button>
      {filePicker && (
        <button className="button secondary" onClick={actions.direct} disabled={!!editor.task.busy}>
          Save PDF directly to file
        </button>
      )}
    </div>
  );
}
function RequiredFields() {
  const editor = useEditor();
  const required = editor.document.sources
    .flatMap((source) => source.fields)
    .filter((field) => {
      const value = editor.document.values[field.id];
      return field.required && (!value || (Array.isArray(value) && !value.length));
    });
  if (!required.length) return null;
  return (
    <div className="inline-warning">
      Unfilled required fields: {required.map((field) => field.name).join(", ")}
    </div>
  );
}
