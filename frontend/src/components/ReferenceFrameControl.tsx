import { text as tr } from "../i18n/runtime";
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
      label={resize ? tr("reference.resize") : tr("reference.move")}
      icon={resize ? Grip : GripHorizontal}
      className={resize ? "reference-resize" : "reference-move"}
      detail={tr("reference.moveHint")}
      onPointerDown={(event) => geometry.start(event, resize)}
      onPointerMove={geometry.move}
      onPointerUp={geometry.end}
      onPointerCancel={geometry.end}
      onKeyDown={(event) => geometry.keyboard(event, resize)}
    />
  );
}
