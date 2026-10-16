import { useRef, type PointerEvent, type KeyboardEvent } from "react";
import { useEditor } from "./editorContext";
import { boundedFrame } from "../components/referenceGeometry";

export function useReferenceFrame(size: { width: number; height: number }) {
  const { pinned } = useEditor();
  const frame = boundedFrame(pinned.view.frame, size);
  const drag = useRef<null | { x: number; y: number; frame: typeof frame; resize: boolean }>(null);
  const change = (dx: number, dy: number, resize: boolean, origin = frame) => {
    const next = resize
      ? { ...origin, width: origin.width + dx, height: origin.height + dy }
      : { ...origin, x: origin.x + dx, y: origin.y + dy };
    pinned.setView((previous) => ({ ...previous, frame: boundedFrame(next, size) }));
  };
  const start = (event: PointerEvent<HTMLButtonElement>, resize: boolean) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, frame, resize };
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (current)
      change(event.clientX - current.x, event.clientY - current.y, current.resize, current.frame);
  };
  const end = () => {
    drag.current = null;
  };
  const keyboard = (event: KeyboardEvent, resize: boolean) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 40 : 10;
    change(direction[0] * step, direction[1] * step, resize);
  };
  return { frame, start, move, end, keyboard };
}
