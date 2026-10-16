import { Grip, GripHorizontal } from "lucide-react";
import { useReferenceFrame } from "../hooks/useReferenceFrame";
import { IconButton } from "./ui/IconButton";

export function ReferenceFrameControl({
  size,
  resize,
}: {
  size: { width: number; height: number };
  resize: boolean;
}) {
  const geometry = useReferenceFrame(size);
  return (
    <IconButton
      label={resize ? "Resize pinned viewer" : "Move pinned viewer"}
      icon={resize ? Grip : GripHorizontal}
      className={resize ? "reference-resize" : "reference-move"}
      detail="Drag or use the arrow keys. Hold Shift for larger steps."
      onPointerDown={(event) => geometry.start(event, resize)}
      onPointerMove={geometry.move}
      onPointerUp={geometry.end}
      onPointerCancel={geometry.end}
      onKeyDown={(event) => geometry.keyboard(event, resize)}
    />
  );
}
