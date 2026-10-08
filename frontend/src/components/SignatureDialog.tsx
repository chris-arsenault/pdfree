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
      title={editor.dialog === "initials" ? "Add your initials" : "Add your signature"}
      onClose={close}
    >
      <p className="modal-description">
        Create your signature, then click the document to place it.
      </p>
      <SignatureInput signature={signature} />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={signature.remember}
          onChange={(event) => signature.setRemember(event.target.checked)}
        />{" "}
        Remember on this device
      </label>
      <SavedSignatures signature={signature} />
      <div className="modal-actions">
        <button className="button secondary" onClick={close}>
          Cancel
        </button>
        <button className="button primary" disabled={!!editor.task.busy} onClick={signature.create}>
          Use signature
        </button>
      </div>
    </Modal>
  );
}
function SignatureInput({ signature }: { signature: ReturnType<typeof useSignature> }) {
  return (
    <>
      <div className="tabs">
        {["draw", "type", "image"].map((tab) => (
          <button
            className={signature.mode === tab ? "active" : ""}
            key={tab}
            onClick={() => signature.setMode(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {signature.mode === "draw" && <SignatureCanvas canvasRef={signature.canvasRef} />}
      {signature.mode === "type" && (
        <>
          <label>
            Your name or initials
            <input
              value={signature.text}
              onChange={(event) => signature.setText(event.target.value)}
              placeholder="Your name"
            />
          </label>
          <div className="typed-signature signature-font">{signature.text || "Your signature"}</div>
        </>
      )}
      {signature.mode === "image" && (
        <label className="image-drop">
          {signature.image ? signature.image.name : "Choose a PNG or JPG signature"}
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
      <span className="section-label">SAVED SIGNATURES</span>
      {signature.saved.map((saved) => (
        <div key={saved.id}>
          <button className="text-button" onClick={() => signature.use(saved)}>
            {saved.label}
          </button>
          <button
            className="text-button"
            aria-label={`Remove ${saved.label}`}
            onClick={() => signature.remove(saved.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
