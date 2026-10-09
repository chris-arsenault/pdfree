import {
  FileUp,
  ShieldCheck,
  PenLine,
  Layers,
  ArrowRight,
  FileClock,
  Library,
  Files,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { useDraft } from "../hooks/useDraft";
import { EditorNotifications } from "./EditorNotifications";

export function EmptyWorkspace() {
  const { importFiles, task } = useEditor();
  return (
    <section className="empty-workspace">
      <EditorNotifications />
      <div className="intro-label">A LITTLE LESS PAPERWORK</div>
      <h1>
        Your paperwork.
        <br />
        <span>Without the paper.</span>
      </h1>
      <p className="intro-copy">
        Fill a form, add your signature, and get on with your day.
        <br />
        Everything happens right here, on your device.
      </p>
      <label className="drop-card">
        <div className="upload-icon">
          <FileUp size={30} />
        </div>
        <strong>Drop your PDF here</strong>
        <span>or choose a file to get started</span>
        <span className="button primary">
          Open a PDF <ArrowRight size={17} />
        </span>
        <input
          className="visually-hidden"
          type="file"
          accept="application/pdf,.pdf,.pdfree"
          multiple
          disabled={!!task.busy}
          onChange={(e) => importFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <SavedWork />
      <div className="intro-features">
        <span>
          <PenLine size={18} /> Fill & sign
        </span>
        <span>
          <Layers size={18} /> Organize pages
        </span>
        <span>
          <ShieldCheck size={18} /> Files stay on your device
        </span>
      </div>
      <div className="privacy-note">No uploads. No account. No watermarks.</div>
    </section>
  );
}

/** Most recent recoverable draft beside the drop card, plus the other ways to start. */
function SavedWork() {
  const editor = useEditor(),
    draft = useDraft(),
    busy = !!editor.task.busy;
  const recovery = draft.recoveries[0];
  return (
    <div className="saved-work">
      {recovery && (
        <section className="recent-document" aria-label="Saved document">
          <FileClock size={20} aria-hidden="true" />
          <span>
            <strong>{recovery.document.name}</strong>
            <small>Saved {new Date(recovery.savedAt).toLocaleString()}</small>
          </span>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => draft.restore(recovery)}
          >
            Recover draft
          </button>
        </section>
      )}
      <div className="saved-work-links">
        <button className="text-button" disabled={busy} onClick={() => editor.setDialog("library")}>
          <Library size={15} aria-hidden="true" /> Saved documents
        </button>
        <button className="text-button" disabled={busy} onClick={() => editor.setDialog("batch")}>
          <Files size={15} aria-hidden="true" /> Process multiple PDFs
        </button>
      </div>
    </div>
  );
}
