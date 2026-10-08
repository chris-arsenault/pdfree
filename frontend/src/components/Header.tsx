import { ArrowUpRight, Download, FolderOpen, HelpCircle, FileText } from "lucide-react";
import { useEditor } from "../hooks/editorContext";

export function Header() {
  const editor = useEditor();
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="PDFree home">
        <span className="brand-icon">
          <FileText size={22} />
        </span>
        <span>
          PDFree<span className="brand-by">by AHARA</span>
        </span>
      </a>
      <div className="header-document">
        {editor.document.pages.length ? (
          <>
            <span className="document-dot" />
            {editor.document.name}
            <span className="local-badge">LOCAL FILE</span>
          </>
        ) : (
          <span>Your files. Your device.</span>
        )}
      </div>
      <nav className="header-actions" aria-label="Document actions">
        <button
          className="icon-button"
          title="Help and keyboard shortcuts"
          onClick={() => editor.setDialog("help")}
        >
          <HelpCircle size={20} />
          <span className="visually-hidden">Help</span>
        </button>
        <label className="button secondary">
          <FolderOpen size={17} /> Open
          <input
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf,.pdfree"
            multiple
            disabled={!!editor.task.busy}
            onChange={(e) => {
              editor.importFiles(Array.from(e.target.files ?? []), true);
              e.target.value = "";
            }}
          />
        </label>
        {editor.document.pages.length > 0 && (
          <button
            className="button primary"
            disabled={!!editor.task.busy}
            onClick={() => {
              editor.setExportSelected(false);
              editor.setDialog("export");
            }}
          >
            <Download size={17} /> Export
          </button>
        )}
        <a className="ahara-link" href="https://ahara.io" target="_blank" rel="noreferrer">
          AHARA <ArrowUpRight size={13} />
        </a>
      </nav>
    </header>
  );
}
