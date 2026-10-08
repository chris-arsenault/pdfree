import { useEffect, useId, useRef } from "react";
import { useEditor } from "../hooks/editorContext";
import { type Confirmation } from "../hooks/useConfirmation";

export function ConfirmationDialog() {
  const { confirmation } = useEditor();
  if (!confirmation.request) return null;
  return <Decision request={confirmation.request} answer={confirmation.answer} />;
}

function Decision({
  request,
  answer,
}: {
  request: Confirmation;
  answer: (confirmed: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    confirm = useRef<HTMLButtonElement>(null),
    id = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal confirmation-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (event.shiftKey && document.activeElement === cancel.current) {
          event.preventDefault();
          confirm.current?.focus();
        } else if (!event.shiftKey && document.activeElement === confirm.current) {
          event.preventDefault();
          cancel.current?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        answer(false);
      }}
    >
      <h2 id={`${id}-title`}>{request.title}</h2>
      <p id={`${id}-message`} className="confirmation-message">
        {request.message}
      </p>
      <div className="modal-actions">
        <button
          ref={cancel}
          type="button"
          className="button secondary"
          onClick={() => answer(false)}
        >
          Cancel
        </button>
        <button
          ref={confirm}
          type="button"
          className={`button ${request.tone}`}
          onClick={() => answer(true)}
        >
          {request.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
