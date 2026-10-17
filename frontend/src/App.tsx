import "./styles.css";
import { useEditor } from "./hooks/editorContext";
import { DocumentSessions } from "./components/DocumentSessions";
import { DocumentTabs } from "./components/DocumentTabs";
import { Header } from "./components/Header";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { Footer } from "./components/Footer";
import { Dialogs } from "./components/Dialogs";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { useKeyboard } from "./hooks/useKeyboard";
import { useMessages } from "./i18n/react";
import { lazy, useEffect } from "react";
import { DeferredView } from "./components/DeferredView";
const loadEditor = () =>
  import("./components/EditorContent").then((module) => ({ default: module.EditorContent }));
const EditorContent = lazy(loadEditor);

export default function App() {
  useMessages();
  return (
    <DocumentSessions>
      <EditorSurface />
    </DocumentSessions>
  );
}
function EditorSurface() {
  const editor = useEditor();
  useEffect(() => {
    // Overlap view loading with file reading and the import worker.
    if (editor.task.kind === "task.openingFiles") loadEditor().catch(() => {});
  }, [editor.task.kind]);
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
        <DeferredView>
          <EditorContent />
        </DeferredView>
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
