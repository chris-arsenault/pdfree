import "./styles.css";
import { useEditor } from "./hooks/editorContext";
import { DocumentSessions } from "./components/DocumentSessions";
import { DocumentTabs } from "./components/DocumentTabs";
import { Header } from "./components/Header";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { PageSidebar } from "./components/PageSidebar";
import { Workspace } from "./components/Workspace";
import { Footer } from "./components/Footer";
import { Toolbar } from "./components/Toolbar";
import { Inspector } from "./components/Inspector";
import { Dialogs } from "./components/Dialogs";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { useKeyboard } from "./hooks/useKeyboard";
import { CommentsPanel } from "./components/CommentsPanel";
import { Navigator } from "./components/Navigator";
import { EditorNotifications } from "./components/EditorNotifications";

export default function App() {
  return (
    <DocumentSessions>
      <EditorSurface />
    </DocumentSessions>
  );
}
function EditorSurface() {
  const editor = useEditor();
  return (
    <div
      className="app-shell"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          // Dropped files open like header Open; the Pages list is the append target.
          editor.importFiles(Array.from(e.dataTransfer.files), true);
        }
      }}
    >
      <Header />
      <DocumentTabs />
      <Keyboard />
      {editor.document.pages.length ? (
        <div className="editor-content">
          <div className="editor-tools" inert={!!editor.task.busy}>
            <Toolbar />
            <Navigator />
          </div>
          <div className="editor-body">
            <EditorNotifications />
            <div className="editor-layout" inert={!!editor.task.busy}>
              {editor.pagesOpen && <PageSidebar />}
              <Workspace />
              <Inspector />
              <CommentsPanel />
            </div>
          </div>
        </div>
      ) : (
        <EmptyWorkspace />
      )}
      <Footer />
      <Dialogs />
      <ConfirmationDialog />
    </div>
  );
}
function Keyboard() {
  useKeyboard();
  return null;
}
