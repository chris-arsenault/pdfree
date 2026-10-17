import { formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
import { Hand, Maximize, Minus, MoveHorizontal, Plus } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function ReferenceZoom({ scale }: { scale: number }) {
  const { pinned } = useEditor();
  const zoom = (value: number) =>
    pinned.setView((previous) => ({
      ...previous,
      fit: null,
      zoom: Math.max(0.1, Math.min(3, value)),
    }));
  const fit = (value: "page" | "width") =>
    pinned.setView((previous) => ({ ...previous, fit: value }));
  const percent = Math.round(scale * 100);
  return (
    <div className="reference-zoom" aria-label={tr("reference.zoomControls")}>
      <IconButton label={tr("reference.zoomOut")} icon={Minus} onClick={() => zoom(scale - 0.1)} />
      <select
        aria-label={tr("reference.zoom")}
        value={percent}
        onChange={(event) => zoom(Number(event.target.value) / 100)}
      >
        {[...new Set([25, 50, 75, 100, 125, 150, 200, 300, percent])]
          .sort((a, b) => a - b)
          .map((value) => (
            <option key={value} value={value}>
              {formatNumber(value / 100, { style: "percent", maximumFractionDigits: 0 })}
            </option>
          ))}
      </select>
      <IconButton label={tr("reference.zoomIn")} icon={Plus} onClick={() => zoom(scale + 0.1)} />
      <IconButton
        label={tr("reference.fit")}
        icon={Maximize}
        aria-pressed={pinned.view.fit === "page"}
        onClick={() => fit("page")}
      />
      <IconButton
        label={tr("reference.fitWidth")}
        icon={MoveHorizontal}
        aria-pressed={pinned.view.fit === "width"}
        onClick={() => fit("width")}
      />
      <IconButton
        label={tr("reference.pan")}
        icon={Hand}
        aria-pressed={pinned.view.pan}
        detail={tr("reference.panHint")}
        onClick={() => pinned.setView((previous) => ({ ...previous, pan: !previous.pan }))}
      />
    </div>
  );
}
