import { formatDate } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
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
      <div className="intro-label">{tr("welcome.eyebrow")}</div>
      <h1>
        {tr("welcome.heading")}
        <br />
        <span>{tr("welcome.headingSecond")}</span>
      </h1>
      <p className="intro-copy">
        {tr("welcome.description")}
        <br />
        {tr("welcome.local")}
      </p>
      <label className="drop-card">
        <div className="upload-icon">
          <FileUp size={30} />
        </div>
        <strong>{tr("welcome.drop")}</strong>
        <span>{tr("welcome.choose")}</span>
        <span className="button primary">
          {tr("welcome.open")}
          <ArrowRight size={17} />
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
          <PenLine size={18} /> {tr("welcome.fillSign")}
        </span>
        <span>
          <Layers size={18} /> {tr("welcome.organize")}
        </span>
        <span>
          <ShieldCheck size={18} /> {tr("welcome.filesLocal")}
        </span>
      </div>
      <div className="privacy-note">{tr("welcome.privacy")}</div>
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
        <section className="recent-document" aria-label={tr("welcome.savedDocument")}>
          <FileClock size={20} aria-hidden="true" />
          <span>
            <strong>{recovery.document.name}</strong>
            <small>
              {tr("draft.savedAt", {
                date: formatDate(new Date(recovery.savedAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </small>
          </span>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => draft.restore(recovery)}
          >
            {tr("welcome.recover")}
          </button>
        </section>
      )}
      <div className="saved-work-links">
        <button className="text-button" disabled={busy} onClick={() => editor.setDialog("library")}>
          <Library size={15} aria-hidden="true" /> {tr("welcome.savedDocuments")}
        </button>
        <button className="text-button" disabled={busy} onClick={() => editor.setDialog("batch")}>
          <Files size={15} aria-hidden="true" /> {tr("batch.title")}
        </button>
      </div>
    </div>
  );
}
