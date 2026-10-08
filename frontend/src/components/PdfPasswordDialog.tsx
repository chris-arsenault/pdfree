import { useState, useCallback } from "react";
import { useEditor } from "../hooks/editorContext";
import { Modal } from "./Modal";

export function PdfPasswordDialog() {
  const editor = useEditor();
  const [password, setPassword] = useState("");
  const [identity, setIdentity] = useState<File | null>(null);
  const [error, setError] = useState("");
  const request = editor.password.request;
  const close = useCallback(() => editor.password.answer(null), [editor.password]);
  if (!request) return null;
  return (
    <Modal title="Unlock PDF" onClose={close}>
      <p className="modal-description">{request.name}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (request.kind === "recipient") {
            if (!identity || identity.size > 2 * 1024 * 1024) {
              setError("Choose a .p12 or .pfx identity smaller than 2 MB.");
              return;
            }
            try {
              const bytes = new Uint8Array(await identity.arrayBuffer());
              editor.password.answer({ bytes, password });
            } catch {
              setError("The recipient identity could not be read. Choose the file again.");
              return;
            }
          } else editor.password.answer(password);
          setPassword("");
          setIdentity(null);
        }}
      >
        <p role="status">{request.message}</p>
        {request.kind === "recipient" && (
          <label>
            Recipient identity (.p12 or .pfx)
            <input
              type="file"
              accept=".p12,.pfx"
              onChange={(event) => setIdentity(event.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <label>
          {request.kind === "recipient" ? "Identity password" : "PDF password"}
          <input
            type="password"
            value={password}
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <p className="field-note">
          {request.kind === "recipient"
            ? "Use a matching recipient identity. Its private key and password are never saved."
            : "Use the opening or owner password. It stays on this device and is never saved."}{" "}
          Decrypted drafts are disabled until you enable them.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => editor.password.answer(null)}
          >
            Cancel opening
          </button>
          <button type="submit" className="button primary">
            Unlock PDF
          </button>
        </div>
      </form>
    </Modal>
  );
}
