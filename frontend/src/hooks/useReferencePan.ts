import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";

export function useReferencePan(enabled: boolean) {
  const [space, setSpace] = useState(false);
  const drag = useRef<null | { x: number; y: number; left: number; top: number }>(null);
  // Releasing Space outside the pane must not leave the temporary hand tool active.
  useEffect(() => {
    const release = () => {
      setSpace(false);
      drag.current = null;
    };
    const keyup = (event: globalThis.KeyboardEvent) => {
      if (event.code === "Space") release();
    };
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", release);
    };
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.code !== "Space" ||
      (event.target as HTMLElement).closest("input,textarea,select,button")
    )
      return;
    event.preventDefault();
    setSpace(true);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest("input,textarea,select"))
      event.currentTarget.focus();
    if (!(enabled || space) || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      left: event.currentTarget.scrollLeft,
      top: event.currentTarget.scrollTop,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = drag.current;
    if (!origin) return;
    event.currentTarget.scrollTo(
      origin.left + origin.x - event.clientX,
      origin.top + origin.y - event.clientY
    );
  };
  const end = () => {
    drag.current = null;
  };
  return {
    active: enabled || space,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  };
}
