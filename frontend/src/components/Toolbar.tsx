import {
  MousePointer2,
  Type,
  Check,
  X,
  CalendarDays,
  PenLine,
  Image,
  Highlighter,
  Pencil,
  Square,
  Minus,
  MoveUpRight,
  Undo2,
  Redo2,
  Stamp,
  TextCursorInput,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type Tool } from "../core/model";
const tools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "check", label: "Check", icon: Check },
  { id: "cross", label: "Cross", icon: X },
  { id: "date", label: "Date", icon: CalendarDays },
  { id: "signature", label: "Sign", icon: PenLine },
  { id: "initials", label: "Initials", icon: Type },
  { id: "image", label: "Image", icon: Image },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "ink", label: "Draw", icon: Pencil },
  { id: "rectangle", label: "Box", icon: Square },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: MoveUpRight },
  { id: "stamp", label: "Stamp", icon: Stamp },
  { id: "field", label: "Form field", icon: TextCursorInput },
] as const;
export function Toolbar() {
  const editor = useEditor();
  const select = (tool: Tool) => {
    if (tool === "signature" || tool === "initials") editor.setDialog(tool);
    else {
      editor.setTool(tool);
      editor.setPendingObject({});
    }
  };
  return (
    <div className="toolbar" role="toolbar" aria-label="Editing tools">
      <div className="history-buttons">
        <button
          title="Undo (Ctrl/⌘ Z)"
          aria-label="Undo"
          disabled={!editor.history.past.length}
          onClick={() => editor.dispatch({ type: "undo" })}
        >
          <Undo2 size={17} />
        </button>
        <button
          title="Redo (Ctrl/⌘ Shift Z)"
          aria-label="Redo"
          disabled={!editor.history.future.length}
          onClick={() => editor.dispatch({ type: "redo" })}
        >
          <Redo2 size={17} />
        </button>
      </div>
      <div className="tool-buttons">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={editor.tool === tool.id ? "active" : ""}
            aria-pressed={editor.tool === tool.id}
            onClick={() => select(tool.id)}
            title={tool.label}
          >
            <tool.icon size={17} />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
