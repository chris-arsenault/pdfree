import { FileUp, ShieldCheck, PenLine, Layers, ArrowRight } from "lucide-react";
import { useEditor } from "../hooks/editorContext";

export function EmptyWorkspace() {
  const { importFiles, task } = useEditor();
  return (
    <section className="empty-workspace">
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
