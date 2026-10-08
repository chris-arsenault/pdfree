import { Maximize, Minus, Plus, MoveHorizontal } from "lucide-react";
import { displaySize } from "../core/coordinates";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function ZoomControls() {
  const editor = useEditor();
  const fit = (widthOnly: boolean) => {
    const area = document.querySelector<HTMLElement>(".page-scroll");
    if (!area || !editor.page) return;
    const bounds = area.getBoundingClientRect(),
      style = getComputedStyle(area);
    const width = bounds.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = bounds.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const size = displaySize(editor.page);
    editor.setZoom(
      Math.max(
        0.1,
        widthOnly ? width / size.width : Math.min(width / size.width, height / size.height)
      )
    );
  };
  return (
    <div className="zoom-controls" aria-label="Zoom controls">
      <IconButton
        label="Zoom out"
        icon={Minus}
        onClick={() => editor.setZoom(Math.max(0.25, editor.zoom - 0.1))}
      />
      <select
        aria-label="Zoom"
        value={String(Math.round(editor.zoom * 100))}
        onChange={(event) => editor.setZoom(Number(event.target.value) / 100)}
      >
        {[...new Set([25, 50, 75, 100, 125, 150, 200, 300, Math.round(editor.zoom * 100)])]
          .sort((a, b) => a - b)
          .map((value) => (
            <option key={value} value={value}>
              {value}%
            </option>
          ))}
      </select>
      <IconButton
        label="Zoom in"
        icon={Plus}
        onClick={() => editor.setZoom(Math.min(3, editor.zoom + 0.1))}
      />
      <IconButton label="Fit page" icon={Maximize} onClick={() => fit(false)} />
      <IconButton label="Fit width" icon={MoveHorizontal} onClick={() => fit(true)} />
    </div>
  );
}
