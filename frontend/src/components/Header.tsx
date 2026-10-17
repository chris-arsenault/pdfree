import { renderMessage } from "../i18n/runtime";
import { text as tr } from "../i18n/runtime";
import {
  ArrowUpRight,
  Download,
  FolderOpen,
  HelpCircle,
  FileText,
  FileCog,
  Files,
  Library,
  MoreHorizontal,
} from "lucide-react";
import { useId, useState } from "react";
import { useEditor } from "../hooks/editorContext";
import { documentNameError, editorLimits } from "../core/editorValidation";
import { IconButton } from "./ui/IconButton";
import { FileButton } from "./ui/FileButton";
import { ActionPopover } from "./ui/ActionPopover";

export function Header() {
  const editor = useEditor();
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label={tr("header.home")}>
        <span className="brand-icon">
          <FileText size={22} />
        </span>
        <span className="brand-wordmark">
          PDFree<span className="brand-by">{tr("brand.by")}</span>
        </span>
      </a>
      {editor.document.pages.length > 0 && (
        <div className="header-document">
          <DocumentName key={`${editor.documentEpoch}-${editor.document.name}`} />
        </div>
      )}
      <HeaderActions />
    </header>
  );
}

/** In-place rename; invalid drafts stay local and revert on blur, keeping the previous name. */
function DocumentName() {
  const editor = useEditor(),
    errorId = useId();
  const [name, setName] = useState(editor.document.name);
  const error = documentNameError(name);
  return (
    <>
      <input
        className="document-name"
        aria-label={tr("header.rename")}
        value={name}
        maxLength={editorLimits.name}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          if (!error && name !== editor.document.name) editor.commit({ ...editor.document, name });
          else setName(editor.document.name);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setName(editor.document.name);
            event.currentTarget.blur();
          }
        }}
      />
      {error && (
        <span id={errorId} className="document-name-error" role="alert">
          {renderMessage(error)}
        </span>
      )}
    </>
  );
}

function HeaderActions() {
  const editor = useEditor();
  const openFiles = (files: File[]) => editor.importFiles(files, true);
  const showDocument = () => editor.setDialog("properties");
  const showHelp = () => editor.setDialog("help");
  return (
    <nav className="header-actions" aria-label={tr("header.actions")}>
      {editor.document.pages.length > 0 && (
        <IconButton
          label={tr("common.document")}
          className="document-action"
          icon={FileCog}
          detail={tr("header.documentHint")}
          onClick={showDocument}
        />
      )}
      <IconButton
        label={tr("common.help")}
        className="help-action"
        icon={HelpCircle}
        detail={tr("header.helpHint")}
        onClick={showHelp}
      />
      <div className="open-group">
        <FileButton
          multiple
          label={tr("common.open")}
          icon={FolderOpen}
          accept="application/pdf,.pdf,.pdfree"
          disabled={!!editor.task.busy}
          onFiles={openFiles}
        />
        <OpenMenu />
      </div>
      {editor.document.pages.length > 0 && (
        <button
          className="button primary"
          disabled={!!editor.task.busy}
          onClick={() => editor.openExport("document")}
        >
          <Download size={17} /> {tr("common.export")}
        </button>
      )}
      <MobileDocumentMenu />
      <a className="ahara-link" href="https://ahara.io" target="_blank" rel="noreferrer">
        AHARA <ArrowUpRight size={13} />
      </a>
    </nav>
  );
}

/** File sources other than the picker: saved documents and batch processing of other files. */
export function OpenMenu() {
  const editor = useEditor();
  return (
    <ActionPopover label={tr("header.openOptions")} icon={FolderOpen} className="open-menu" compact>
      {(close) => (
        <>
          <button
            disabled={!!editor.task.busy}
            onClick={() => {
              editor.setDialog("library");
              close();
            }}
          >
            <Library size={17} aria-hidden="true" />
            <span>
              {tr("common.library")}
              <small aria-hidden="true">{tr("header.libraryHint")}</small>
            </span>
          </button>
          <button
            disabled={!!editor.task.busy}
            onClick={() => {
              editor.setDialog("batch");
              close();
            }}
          >
            <Files size={17} aria-hidden="true" />
            <span>
              {tr("batch.title")}
              <small aria-hidden="true">{tr("header.batchHint")}</small>
            </span>
          </button>
        </>
      )}
    </ActionPopover>
  );
}

function MobileDocumentMenu() {
  const editor = useEditor();
  return (
    <ActionPopover
      label={tr("header.actions")}
      icon={MoreHorizontal}
      className="mobile-document-menu"
    >
      {(close) => (
        <>
          {editor.document.pages.length > 0 && (
            <button
              onClick={() => {
                editor.setDialog("properties");
                close();
              }}
            >
              <FileCog size={17} aria-hidden="true" /> {tr("common.document")}
            </button>
          )}
          <button
            onClick={() => {
              editor.setDialog("help");
              close();
            }}
          >
            <HelpCircle size={17} aria-hidden="true" /> {tr("common.help")}
          </button>
        </>
      )}
    </ActionPopover>
  );
}
