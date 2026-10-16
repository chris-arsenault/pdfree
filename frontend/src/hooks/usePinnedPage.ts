import { useCallback, useRef, useState } from "react";
import { type Page } from "../core/model";

export type ReferenceFrame = { x: number; y: number; width: number; height: number };
export type ReadingPosition = { x: number; y: number };
const initialView = () => ({
  pageId: "",
  floating: false,
  open: true,
  zoom: 1,
  fit: "page" as "page" | "width" | null,
  pan: false,
  split: 0.4,
  frame: { x: 24, y: 24, width: 480, height: 520 },
  focus: 0,
  removed: false,
});

/** Reference state belongs to the live session, never to document history or persistence. */
export function usePinnedPage(pages: Page[]) {
  const [view, setView] = useState(initialView);
  const position = useRef<ReadingPosition>({ x: 0.5, y: 0.5 });
  const page = pages.find((item) => item.id === view.pageId) ?? null;
  if (view.pageId && !page) setView({ ...view, pageId: "", removed: true });
  const pin = useCallback(
    (pageId: string) => {
      if (view.pageId !== pageId) position.current = { x: 0.5, y: 0.5 };
      setView((previous) => {
        if (previous.pageId === pageId)
          return { ...previous, open: true, focus: previous.focus + 1 };
        return {
          ...previous,
          pageId,
          open: true,
          fit: "page",
          removed: false,
          focus: previous.focus + 1,
        };
      });
    },
    [view.pageId]
  );
  const reset = useCallback(() => {
    position.current = { x: 0.5, y: 0.5 };
    setView(initialView());
  }, []);
  return { view, setView, position, page, pin, reset };
}
