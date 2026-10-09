import { Plus, Redo2, Undo2, Wrench, ScanText, ScanLine, ListOrdered, Files } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type Tool } from "../core/model";
import { tools } from "./toolDefinitions";
import { IconButton } from "./ui/IconButton";
import { ActionPopover } from "./ui/ActionPopover";
export function Toolbar() {
  const editor = useEditor();
  const select = (tool: Tool) => {
    editor.setObjectIds([]);
    editor.setPendingComment(null);
    if (tool === "signature" || tool === "initials") editor.setDialog(tool);
    else {
      editor.setTool(tool);
      editor.setPendingObject({});
    }
  };
  return (
    <div className="toolbar" role="toolbar" aria-label="Editing tools">
      <HistoryButtons />
      <UtilityTools />
      <div className="desktop-tools">
        {["select", "fill", "sign", "annotate", "field"].map((group) => (
          <div className="tool-group" key={group}>
            {tools
              .filter((tool) => tool.group === group)
              .map((tool) => (
                <IconButton
                  key={tool.id}
                  label={tool.label}
                  icon={tool.icon}
                  detail={tool.hint}
                  aria-pressed={editor.tool === tool.id}
                  className={editor.tool === tool.id ? "active" : ""}
                  onClick={() => select(tool.id)}
                />
              ))}
          </div>
        ))}
      </div>
      <MobileTools select={select} />
      <span className="active-tool">{tools.find((tool) => tool.id === editor.tool)?.label}</span>
    </div>
  );
}
function UtilityTools() {
  const editor = useEditor();
  return (
    <ActionPopover label="Tools" icon={Wrench}>
      {(close) => (
        <>
          <button
            onClick={() => {
              editor.setDialog("ocr");
              close();
            }}
          >
            <ScanText size={17} aria-hidden="true" />
            Recognize text
          </button>
          <button
            onClick={() => {
              editor.setDialog("cleanup");
              close();
            }}
          >
            <ScanLine size={17} aria-hidden="true" />
            Clean up scans
          </button>
          <button
            onClick={() => {
              editor.setDialog("repeat");
              close();
            }}
          >
            <ListOrdered size={17} aria-hidden="true" />
            Repeat across pages
          </button>
          <button
            onClick={() => {
              editor.setDialog("batch");
              close();
            }}
          >
            <Files size={17} aria-hidden="true" />
            Process multiple PDFs
          </button>
        </>
      )}
    </ActionPopover>
  );
}
function MobileTools({ select }: { select: (tool: Tool) => void }) {
  const editor = useEditor();
  return (
    <div className="mobile-tools">
      {tools
        .filter((tool) => ["select", "text", "signature"].includes(tool.id))
        .map((tool) => (
          <IconButton
            key={tool.id}
            label={tool.label}
            icon={tool.icon}
            detail={tool.hint}
            aria-pressed={editor.tool === tool.id}
            className={editor.tool === tool.id ? "active" : ""}
            onClick={() => select(tool.id)}
          />
        ))}
      <ActionPopover label="Add" icon={Plus}>
        {(close) => (
          <ToolChoices
            select={(tool) => {
              select(tool);
              close();
            }}
          />
        )}
      </ActionPopover>
    </div>
  );
}

function HistoryButtons() {
  const editor = useEditor();
  return (
    <div className="history-buttons">
      <IconButton
        label="Undo"
        icon={Undo2}
        shortcut="Ctrl/⌘ Z"
        disabled={!editor.history.past.length}
        detail={editor.history.past.length ? "Undo the last edit." : "No edits to undo."}
        onClick={() => editor.dispatch({ type: "undo" })}
      />
      <IconButton
        label="Redo"
        icon={Redo2}
        shortcut="Ctrl/⌘ Shift Z"
        disabled={!editor.history.future.length}
        detail={
          editor.history.future.length ? "Restore the last undone edit." : "No edits to redo."
        }
        onClick={() => editor.dispatch({ type: "redo" })}
      />
    </div>
  );
}

function ToolChoices({ select }: { select: (tool: Tool) => void }) {
  const editor = useEditor();
  return (
    <div className="tool-choices">
      {tools
        .filter((tool) => !["select", "text", "signature"].includes(tool.id))
        .map((tool) => (
          <button
            type="button"
            key={tool.id}
            aria-pressed={editor.tool === tool.id}
            onClick={() => select(tool.id)}
          >
            <tool.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{tool.id === "highlight" ? "Area highlight" : tool.label}</span>
          </button>
        ))}
    </div>
  );
}
