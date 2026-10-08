import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { Modal } from "./Modal";
import { useId, useState } from "react";
import { documentNameError, editorLimits } from "../core/editorValidation";
import { hasEncryptedSources } from "../core/model";
export function DocumentDialog() {
  const editor = useEditor();
  const close = useCloseDialog();
  const id = useId();
  const [name, setName] = useState(editor.document.name);
  const error = documentNameError(name);
  return (
    <Modal title="Document details" onClose={close}>
      <label>
        Document name
        <input
          value={name}
          maxLength={editorLimits.name}
          aria-invalid={!!error}
          aria-describedby={error ? id : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!documentNameError(next)) editor.commit({ ...editor.document, name: next });
          }}
        />
        {error && <span id={id}>{error} The previous name is retained.</span>}
      </label>
      <p className="modal-description">
        {editor.document.pages.length} pages · {editor.document.sources.length} source PDFs ·{" "}
        {editor.document.assets.length} local images
      </p>
      <DraftConsent />
      {editor.document.sources.map((source) => (
        <div className="document-source" key={source.id}>
          <strong>{source.name}</strong>
          {source.encryption && (
            <p className="inline-warning">
              Opened {source.encryption.algorithm} encrypted PDF using{" "}
              {source.encryption.authenticatedAs} access. The editing copy is decrypted; export
              protection is configured separately.
            </p>
          )}
          <p>
            {source.title || "No title"} · {source.author || "No author"} ·{" "}
            {(source.bytes.length / 1024 / 1024).toFixed(2)} MB
          </p>
          {source.warnings.map((warning) => (
            <p className="inline-warning" key={warning}>
              {warning}
            </p>
          ))}
          {!!source.structuralWarnings.length && (
            <p className="inline-warning">
              Page extraction or merging is restricted to preserve:{" "}
              {source.structuralWarnings.join(", ")}. Export the complete original document to keep
              these structures.
            </p>
          )}
        </div>
      ))}
      <p className="field-note">
        XFA forms and certificate signature fields are rejected. Visible signatures, text and shapes
        do not provide certificate signing or secure redaction.
      </p>
    </Modal>
  );
}
function DraftConsent() {
  const editor = useEditor();
  if (!hasEncryptedSources(editor.document)) return null;
  return (
    <>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={editor.document.allowDecryptedDrafts === true}
          onChange={(event) =>
            editor.commit({ ...editor.document, allowDecryptedDrafts: event.target.checked })
          }
        />
        Save decrypted drafts on this device (without a password)
      </label>
      <p className="field-note">
        Drafts include decrypted content without password protection. Disabling stops new saves;
        Delete the saved document in Library to remove its existing local copy.
      </p>
    </>
  );
}
