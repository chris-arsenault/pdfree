import { formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
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
    <div className="zoom-controls" aria-label={tr("zoom.controls")}>
      <IconButton
        label={tr("zoom.out")}
        className="zoom-step"
        icon={Minus}
        onClick={() => editor.setZoom(Math.max(0.25, editor.zoom - 0.1))}
      />
      <select
        aria-label={tr("zoom.label")}
        value={String(Math.round(editor.zoom * 100))}
        onChange={(event) => editor.setZoom(Number(event.target.value) / 100)}
      >
        {[...new Set([25, 50, 75, 100, 125, 150, 200, 300, Math.round(editor.zoom * 100)])]
          .sort((a, b) => a - b)
          .map((value) => (
            <option key={value} value={value}>
              {formatNumber(value / 100, { style: "percent", maximumFractionDigits: 0 })}
            </option>
          ))}
      </select>
      <IconButton
        label={tr("zoom.in")}
        className="zoom-step"
        icon={Plus}
        onClick={() => editor.setZoom(Math.min(3, editor.zoom + 0.1))}
      />
      <IconButton label={tr("zoom.fit")} icon={Maximize} onClick={() => fit(false)} />
      <IconButton
        label={tr("zoom.fitWidth")}
        className="fit-width"
        icon={MoveHorizontal}
        onClick={() => fit(true)}
      />
    </div>
  );
}
