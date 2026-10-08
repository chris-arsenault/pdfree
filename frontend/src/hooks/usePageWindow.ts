import { useEffect, useRef, useState } from "react";
import { type Page } from "../core/model";
export const thumbnailHeight = 176;
export function usePageWindow(pages: Page[], activeId: string) {
  const ref = useRef<HTMLDivElement>(null),
    [viewport, setViewport] = useState({ top: 0, height: 600 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setViewport({ top: element.scrollTop, height: element.clientHeight });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update);
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    const element = ref.current,
      index = pages.findIndex((page) => page.id === activeId);
    if (!element || index < 0) return;
    const top = index * thumbnailHeight;
    if (top < element.scrollTop || top + thumbnailHeight > element.scrollTop + element.clientHeight)
      element.scrollTo({ top });
  }, [pages, activeId]);
  const start = Math.max(0, Math.floor(viewport.top / thumbnailHeight) - 2);
  const end = Math.min(
    pages.length,
    Math.ceil((viewport.top + viewport.height) / thumbnailHeight) + 2
  );
  return { ref, start, visible: pages.slice(start, end) };
}
