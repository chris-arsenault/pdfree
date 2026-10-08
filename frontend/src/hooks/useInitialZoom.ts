import { useEffect, useRef } from "react";
import { useEditor } from "./editorContext";
import { displaySize } from "../core/coordinates";
export function useInitialZoom() {
  const editor = useEditor(),
    area = useRef<HTMLDivElement>(null),
    fittedSource = useRef("");
  const { page, setZoom } = editor;
  useEffect(() => {
    if (!area.current || !page) return;
    const element = area.current,
      key = page.sourceId || page.id;
    const observer = new ResizeObserver(() => {
      if (fittedSource.current === key) return;
      fittedSource.current = key;
      setZoom(Math.min(1, Math.max(0.1, (element.clientWidth - 40) / displaySize(page).width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [page, setZoom]);
  return area;
}
