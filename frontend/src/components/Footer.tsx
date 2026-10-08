import { LockKeyhole, Minus, Plus, Maximize } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { displaySize } from "../core/coordinates";

export function Footer() {
  const editor = useEditor();
  const saveStatus =
    editor.savedRevision === editor.history.revision ? "Exported" : "Editing locally";
  return (
    <footer className="app-footer">
      <span className="privacy-status">
        <LockKeyhole size={13} /> Processed on your device
      </span>
      <span className="save-status">
        {editor.document.pages.length ? saveStatus : "Ready when you are"}
      </span>
      {editor.page && (
        <div className="zoom-controls">
          <button
            title="Zoom out"
            onClick={() => editor.setZoom(Math.max(0.25, editor.zoom - 0.1))}
          >
            <Minus size={15} />
          </button>
          <select
            aria-label="Zoom"
            value={String(Math.round(editor.zoom * 100))}
            onChange={(e) => editor.setZoom(Number(e.target.value) / 100)}
          >
            {[...new Set([25, 50, 75, 100, 125, 150, 200, 300, Math.round(editor.zoom * 100)])]
              .sort((a, b) => a - b)
              .map((value) => (
                <option key={value} value={value}>
                  {value}%
                </option>
              ))}
          </select>
          <button title="Zoom in" onClick={() => editor.setZoom(Math.min(3, editor.zoom + 0.1))}>
            <Plus size={15} />
          </button>
          <button
            title="Fit page"
            onClick={() => {
              const area = document.querySelector(".page-scroll")?.getBoundingClientRect();
              if (area && editor.page) {
                const size = displaySize(editor.page);
                editor.setZoom(
                  Math.min((area.width - 60) / size.width, (area.height - 40) / size.height)
                );
              }
            }}
          >
            <Maximize size={15} />
          </button>
        </div>
      )}
      {editor.page && (
        <button
          className="text-button"
          onClick={() => {
            const area = document.querySelector(".page-scroll")?.getBoundingClientRect();
            if (area && editor.page)
              editor.setZoom(Math.max(0.1, (area.width - 60) / displaySize(editor.page).width));
          }}
        >
          Fit width
        </button>
      )}
    </footer>
  );
}
