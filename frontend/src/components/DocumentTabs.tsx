import { text as tr } from "../i18n/runtime";
import { useContext } from "react";
import { Plus, X } from "lucide-react";
import { SessionContext } from "../hooks/sessionContext";
import { IconButton } from "./ui/IconButton";
import { FileButton } from "./ui/FileButton";
export function DocumentTabs() {
  const manager = useContext(SessionContext);
  if (!manager) return null;
  const busy = manager.sessions.some((session) => session.busy);
  return (
    <nav className="document-tabs" aria-label={tr("document.openDocuments")}>
      {manager.sessions.map((session) => (
        <div
          className={`document-tab ${manager.activeId === session.id ? "active" : ""}`}
          key={session.id}
        >
          <button
            aria-current={manager.activeId === session.id ? "page" : undefined}
            disabled={busy}
            onClick={() => manager.select(session.id)}
          >
            {session.unsaved && <span aria-label={tr("document.unsaved")}>• </span>}
            {session.name}
          </button>
          <IconButton
            label={tr("common.closeNamed", { name: session.name })}
            icon={X}
            disabled={busy}
            onClick={() => manager.close(session.id)}
          />
        </div>
      ))}
      <FileButton
        label={tr("document.openAnother")}
        icon={Plus}
        accept="application/pdf,.pdf,.pdfree"
        multiple
        disabled={busy}
        onFiles={manager.openFiles}
      />
    </nav>
  );
}
