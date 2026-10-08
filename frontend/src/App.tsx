import { EditorContext } from "./hooks/editorContext";
import "./styles.css";
import { useEditorState } from "./hooks/useEditorState";
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
            {editor.task.busy === "Opening files" && (
              <button
                className="button secondary"
                onClick={() => {
                  editor.confirmation.answer(false);
                  editor.password.cancel();
                }}
              >
                Cancel opening
              </button>
            )}
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
        {editor.document.pages.length ? (
          <div className="editor-content" inert={!!editor.task.busy}>
            <Toolbar />
            <div className="editor-layout">
              {editor.pagesOpen && <PageSidebar />}
              <Workspace />
              <Inspector />
            </div>
          </div>
        ) : (
          <EmptyWorkspace />
        )}
        <Footer />
        <Dialogs />
        <ConfirmationDialog />
      </div>
    </EditorContext.Provider>
  );
}
function Keyboard() {
  useKeyboard();
  return null;
}
