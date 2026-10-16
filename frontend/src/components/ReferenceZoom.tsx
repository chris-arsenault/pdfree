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
    <div className="reference-zoom" aria-label="Pinned page zoom controls">
      <IconButton label="Zoom pinned page out" icon={Minus} onClick={() => zoom(scale - 0.1)} />
      <select
        aria-label="Pinned page zoom"
        value={percent}
        onChange={(event) => zoom(Number(event.target.value) / 100)}
      >
        {[...new Set([25, 50, 75, 100, 125, 150, 200, 300, percent])]
          .sort((a, b) => a - b)
          .map((value) => (
            <option key={value} value={value}>
              {value}%
            </option>
          ))}
      </select>
      <IconButton label="Zoom pinned page in" icon={Plus} onClick={() => zoom(scale + 0.1)} />
      <IconButton
        label="Fit pinned page"
        icon={Maximize}
        aria-pressed={pinned.view.fit === "page"}
        onClick={() => fit("page")}
      />
      <IconButton
        label="Fit pinned page width"
        icon={MoveHorizontal}
        aria-pressed={pinned.view.fit === "width"}
        onClick={() => fit("width")}
      />
      <IconButton
        label="Pan pinned page"
        icon={Hand}
        aria-pressed={pinned.view.pan}
        detail="Drag to pan. Turn off to select text, or hold Space for temporary panning."
        onClick={() => pinned.setView((previous) => ({ ...previous, pan: !previous.pan }))}
      />
    </div>
  );
}
