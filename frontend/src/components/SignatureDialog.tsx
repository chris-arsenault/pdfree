import { text as tr } from "../i18n/runtime";
import { useEditor } from "../hooks/editorContext";
import { useSignature } from "../hooks/useSignature";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { SignatureCanvas } from "./SignatureCanvas";
import { Modal } from "./Modal";
export function SignatureDialog() {
  const editor = useEditor(),
    signature = useSignature(),
    close = useCloseDialog();
  return (
    <Modal
      title={editor.dialog === "initials" ? tr("signature.addInitials") : tr("signature.add")}
      onClose={close}
    >
      <p className="modal-description">{tr("signature.description")}</p>
      {signature.error && <p role="alert">{signature.error}</p>}
      <SignatureInput signature={signature} />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={signature.remember}
          onChange={(event) => signature.setRemember(event.target.checked)}
        />{" "}
        {tr("signature.remember")}
      </label>
      <SavedSignatures signature={signature} />
      <div className="modal-actions">
        <button className="button secondary" onClick={close}>
          {tr("common.cancel")}
        </button>
        <button className="button primary" disabled={!!editor.task.busy} onClick={signature.create}>
          {tr("signature.use")}
        </button>
      </div>
    </Modal>
  );
}
function SignatureInput({ signature }: { signature: ReturnType<typeof useSignature> }) {
  return (
    <>
      <div className="tabs">
        {(["draw", "type", "image"] as const).map((tab) => (
          <button
            className={signature.mode === tab ? "active" : ""}
            key={tab}
            onClick={() => signature.setMode(tab)}
          >
            {tr(
              (
                {
                  draw: "signature.modeDraw",
                  type: "signature.type",
                  image: "common.image",
                } as const
              )[tab]
            )}
          </button>
        ))}
      </div>
      {signature.mode === "draw" && <SignatureCanvas canvasRef={signature.canvasRef} />}
      {signature.mode === "type" && (
        <>
          <label>
            {tr("signature.nameInitials")}
            <input
              value={signature.text}
              onChange={(event) => signature.setText(event.target.value)}
              placeholder={tr("signature.name")}
            />
          </label>
          <div className="typed-signature signature-font">
            {signature.text || tr("signature.preview")}
          </div>
        </>
      )}
      {signature.mode === "image" && (
        <label className="image-drop">
          {signature.image ? signature.image.name : tr("signature.chooseImage")}
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) signature.readImage(file);
            }}
          />
        </label>
      )}
    </>
  );
}
function SavedSignatures({ signature }: { signature: ReturnType<typeof useSignature> }) {
  if (!signature.saved.length) return null;
  return (
    <div className="saved-signatures">
      <span className="section-label">{tr("signature.saved")}</span>
      {signature.saved.map((saved) => (
        <div key={saved.id}>
          <button className="text-button" onClick={() => signature.use(saved)}>
            {saved.label}
          </button>
          <button
            className="text-button"
            aria-label={tr("common.removeNamed", { name: saved.label })}
            onClick={() => signature.remove(saved.id)}
          >
            {tr("common.remove")}
          </button>
        </div>
      ))}
    </div>
  );
}
