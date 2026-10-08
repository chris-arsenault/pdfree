import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { Modal } from "./Modal";
import { useId, useState } from "react";
import { documentNameError, editorLimits } from "../core/editorValidation";
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
      {editor.document.sources.map((source) => (
        <div className="document-source" key={source.id}>
          <strong>{source.name}</strong>
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
        Encrypted PDFs, XFA forms and certificate signature fields are rejected. Visible signatures,
        text and shapes do not provide certificate signing or secure redaction.
      </p>
    </Modal>
  );
}
