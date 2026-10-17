import { useEditor } from "../hooks/editorContext";
import { PageSidebar } from "./PageSidebar";
import { Workspace } from "./Workspace";
import { Toolbar } from "./Toolbar";
import { Inspector } from "./Inspector";
import { CommentsPanel } from "./CommentsPanel";
import { Navigator } from "./Navigator";
import { EditorNotifications } from "./EditorNotifications";

export function EditorContent() {
  const editor = useEditor();
  return (
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
  );
}
