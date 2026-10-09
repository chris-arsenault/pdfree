import { useId, useState, type ChangeEvent } from "react";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { useProtectedAutosaveDisabled } from "../hooks/useSettings";
import { setProtectedAutosaveDisabled } from "../services/settings";
import { Modal } from "./Modal";

export function SettingsDialog() {
  const close = useCloseDialog();
  const disabled = useProtectedAutosaveDisabled();
  const noteId = useId();
  const [error, setError] = useState("");
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setProtectedAutosaveDisabled(event.target.checked);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This browser could not save the setting.");
    }
  };
  return (
    <Modal title="Settings" onClose={close}>
      <label className="checkbox-label">
        <input type="checkbox" checked={disabled} onChange={change} aria-describedby={noteId} />
        Don&apos;t autosave protected documents
      </label>
      <p className="field-note" id={noteId}>
        Applies to all documents in this browser. Saved drafts contain unlocked document content.
        Turning this on stops new saves from protected PDFs; existing saved documents stay in
        Library.
      </p>
      {error && <p role="alert">{error}</p>}
    </Modal>
  );
}
