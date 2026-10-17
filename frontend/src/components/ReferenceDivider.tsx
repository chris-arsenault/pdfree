import { text as tr } from "../i18n/runtime";
import { type PointerEvent, type KeyboardEvent } from "react";
import { useEditor } from "../hooks/editorContext";
import { referenceWidth } from "./referenceGeometry";

export function ReferenceDivider({ width }: { width: number }) {
  const { pinned } = useEditor();
  const setWidth = (next: number) =>
    pinned.setView((previous) => ({
      ...previous,
      split: referenceWidth(width, next / width) / width,
    }));
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    setWidth(bounds.right - event.clientX);
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = referenceWidth(width, pinned.view.split);
    const choices: Record<string, number> = {
      ArrowLeft: current + (event.shiftKey ? 40 : 10),
      ArrowRight: current - (event.shiftKey ? 40 : 10),
      Home: 280,
      End: width - 328,
      Enter: width * 0.4,
    };
    if (!(event.key in choices)) return;
    event.preventDefault();
    setWidth(choices[event.key]);
  };
  return (
    // WAI-ARIA window splitters use a focusable separator with pointer and arrow-key input.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="reference-divider"
      role="separator"
      aria-label={tr("reference.width")}
      aria-orientation="vertical"
      aria-valuemin={280}
      aria-valuemax={Math.round(width - 328)}
      aria-valuenow={Math.round(referenceWidth(width, pinned.view.split))}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={keyboard}
      onDoubleClick={() => setWidth(width * 0.4)}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={move}
    />
  );
}
