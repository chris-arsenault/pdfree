import { message } from "../i18n/messages";
import { useMessageState } from "../i18n/react";
import { renderMessage } from "../i18n/runtime";
import { text as tr } from "../i18n/runtime";
import { useState, useCallback } from "react";
import { useEditor } from "../hooks/editorContext";
import { Modal } from "./Modal";

export function PdfPasswordDialog() {
  const editor = useEditor();
  const close = useCallback(() => editor.password.answer(null), [editor.password]);
  const request = editor.password.request;
  if (!request) return null;
  return (
    <Modal title={tr("password.title")} onClose={close}>
      <p className="modal-description">{request.name}</p>
      <PasswordForm request={request} answer={editor.password.answer} />
    </Modal>
  );
}
type PasswordApi = ReturnType<typeof import("../hooks/usePdfPassword").usePdfPassword>;
function PasswordForm({
  request,
  answer,
}: {
  request: NonNullable<PasswordApi["request"]>;
  answer: PasswordApi["answer"];
}) {
  const [password, setPassword] = useState(""),
    [identity, setIdentity] = useState<File | null>(null);
  const [error, setError] = useMessageState();
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (request.kind === "recipient") {
          if (!identity || identity.size > 2 * 1024 * 1024) {
            setError(message("password.identitySize"));
            return;
          }
          try {
            const bytes = new Uint8Array(await identity.arrayBuffer());
            answer({ bytes, password });
          } catch {
            setError(message("password.identityRead"));
            return;
          }
        } else answer(password);
        setPassword("");
        setIdentity(null);
      }}
    >
      <p role="status">{renderMessage(request.message)}</p>
      {request.kind === "recipient" && (
        <label>
          {tr("password.identity")}
          <input
            type="file"
            accept=".p12,.pfx"
            onChange={(event) => setIdentity(event.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <label>
        {request.kind === "recipient"
          ? tr("password.identityPassword")
          : tr("password.pdfPassword")}
        <input
          type="password"
          value={password}
          autoComplete="off"
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <p className="field-note">
        {request.kind === "recipient" ? tr("password.recipientHint") : tr("password.passwordHint")}{" "}
        {tr("password.draftsDisabled")}
      </p>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={() => answer(null)}>
          {tr("notifications.cancelOpening")}
        </button>
        <button type="submit" className="button primary">
          {tr("password.title")}
        </button>
      </div>
    </form>
  );
}
