import { EditorContext } from "./hooks/editorContext";
import { useEditorState } from "./hooks/useEditorState";
import { Header } from "./components/Header";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { PageSidebar } from "./components/PageSidebar";
import { Workspace } from "./components/Workspace";
import { Footer } from "./components/Footer";
import { Toolbar } from "./components/Toolbar";
import { Inspector } from "./components/Inspector";
import { Dialogs } from "./components/Dialogs";
import { useKeyboard } from "./hooks/useKeyboard";
import { PageActions } from "./components/PageActions";
import { DraftStatus } from "./components/DraftStatus";
import { OfflineStatus } from "./components/OfflineStatus";

export default function App() {
  const editor = useEditorState();
  return (
    <EditorContext.Provider value={editor}>
      <div
        className="app-shell"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (e.dataTransfer.files.length) {
            e.preventDefault();
            editor.importFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        <Header />
        {editor.task.busy && (
          <div className="busy-banner" role="status">
            <span className="spinner" />
            {editor.task.busy}…
          </div>
        )}
        {editor.task.error && (
          <div className="error-banner" role="alert">
            {editor.task.error}
            <button onClick={editor.task.dismiss} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {editor.task.message && (
          <div className="busy-banner" role="status">
            {editor.task.message}
            <button onClick={editor.task.dismiss} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
        <Keyboard />
        <DraftStatus />
        <OfflineStatus />
        {editor.document.pages.length ? (
          <div className="editor-content" inert={!!editor.task.busy}>
            <Toolbar />
            <PageActions />
            <div className="editor-layout">
              <PageSidebar />
              <Workspace />
              <Inspector />
            </div>
          </div>
        ) : (
          <EmptyWorkspace />
        )}
        <Footer />
        <Dialogs />
      </div>
    </EditorContext.Provider>
  );
}
function Keyboard() {
  useKeyboard();
  return null;
}
