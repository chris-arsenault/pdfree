import { type PointerEvent } from "react";
import { Plus, Redo2, Undo2 } from "lucide-react";
import { highlightTextSelection } from "../hooks/usePlacement";
import { useEditor } from "../hooks/editorContext";
import { type Tool } from "../core/model";
import { scanTools, tools } from "./toolDefinitions";
import { IconButton } from "./ui/IconButton";
import { Tooltip } from "./ui/Tooltip";
import { ActionPopover } from "./ui/ActionPopover";
export function Toolbar() {
  const editor = useEditor();
  const select = (tool: Tool) => {
    // Text already selected on the page is highlighted immediately.
    const surface = document.querySelector<HTMLElement>(".page-surface");
    if (tool === "highlight" && surface && highlightTextSelection(editor, surface)) return;
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
                  onPointerDown={tool.id === "highlight" ? keepSelection : undefined}
                  onClick={() => select(tool.id)}
                />
              ))}
          </div>
        ))}
      </div>
      <MobileTools select={select} />
      <div className="tool-group scan-tools" role="group" aria-label="Scan tools">
        {scanTools.map((item) => (
          <Tooltip key={item.dialog} label={item.label} detail={item.hint}>
            <button
              type="button"
              className="scan-tool"
              disabled={!!editor.task.busy}
              onClick={() => editor.setDialog(item.dialog)}
            >
              <item.icon size={17} strokeWidth={1.75} aria-hidden="true" />
              {item.label}
            </button>
          </Tooltip>
        ))}
      </div>
      <span className="active-tool">{tools.find((tool) => tool.id === editor.tool)?.label}</span>
    </div>
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
            open={(dialog) => {
              editor.setDialog(dialog);
              close();
            }}
          />
        )}
      </ActionPopover>
    </div>
  );
}

// Pressing a tool must not clear a PDF text selection the Highlight tool can use.
const keepSelection = (event: PointerEvent) => event.preventDefault();

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

function ToolChoices({
  select,
  open,
}: {
  select: (tool: Tool) => void;
  open: (dialog: (typeof scanTools)[number]["dialog"]) => void;
}) {
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
      {scanTools.map((item) => (
        <button type="button" key={item.dialog} onClick={() => open(item.dialog)}>
          <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
