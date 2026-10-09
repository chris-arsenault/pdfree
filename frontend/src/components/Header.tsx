import {
  ArrowUpRight,
  Download,
  FolderOpen,
  HelpCircle,
  FileText,
  FileCog,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";
import { FileButton } from "./ui/FileButton";
import { ActionPopover } from "./ui/ActionPopover";

export function Header() {
  const editor = useEditor();
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="PDFree home">
        <span className="brand-icon">
          <FileText size={22} />
        </span>
        <span className="brand-wordmark">
          PDFree<span className="brand-by">by AHARA</span>
        </span>
      </a>
      <div className="header-document">
        {editor.document.pages.length ? (
          <>
            <span className="document-name">{editor.document.name}</span>
          </>
        ) : (
          <span>Your files. Your device.</span>
        )}
      </div>
      <HeaderActions />
    </header>
  );
}

function HeaderActions() {
  const editor = useEditor();
  const openFiles = (files: File[]) => editor.importFiles(files, true);
  const showDocument = () => editor.setDialog("properties");
  const showHelp = () => editor.setDialog("help");
  const showSettings = () => editor.setDialog("settings");
  return (
    <nav className="header-actions" aria-label="Document actions">
      {editor.document.pages.length > 0 && (
        <IconButton
          label="Document"
          className="document-action"
          icon={FileCog}
          detail="Document details and source information."
          onClick={showDocument}
        />
      )}
      <IconButton
        label="Settings"
        className="settings-action"
        icon={Settings}
        detail="Settings for this browser."
        onClick={showSettings}
      />
      <IconButton
        label="Help"
        className="help-action"
        icon={HelpCircle}
        detail="Help and keyboard shortcuts"
        onClick={showHelp}
      />
      <FileButton
        multiple
        label="Open"
        icon={FolderOpen}
        accept="application/pdf,.pdf,.pdfree"
        disabled={!!editor.task.busy}
        onFiles={openFiles}
      />
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
      <MobileDocumentMenu />
      <a className="ahara-link" href="https://ahara.io" target="_blank" rel="noreferrer">
        AHARA <ArrowUpRight size={13} />
      </a>
    </nav>
  );
}

function MobileDocumentMenu() {
  const editor = useEditor();
  return (
    <ActionPopover label="Document actions" icon={MoreHorizontal} className="mobile-document-menu">
      {(close) => (
        <>
          {editor.document.pages.length > 0 && (
            <button
              onClick={() => {
                editor.setDialog("properties");
                close();
              }}
            >
              <FileCog size={17} aria-hidden="true" /> Document
            </button>
          )}
          <button
            onClick={() => {
              editor.setDialog("settings");
              close();
            }}
          >
            <Settings size={17} aria-hidden="true" /> Settings
          </button>
          <button
            onClick={() => {
              editor.setDialog("help");
              close();
            }}
          >
            <HelpCircle size={17} aria-hidden="true" /> Help
          </button>
        </>
      )}
    </ActionPopover>
  );
}
