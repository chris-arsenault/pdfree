import { useLayoutEffect, type RefObject } from "react";
import { useElementSize } from "./useElementSize";
import { type ReadingPosition } from "./usePinnedPage";

/** Retain a point on the page as zoom, container size or presentation changes. */
export function useReadingPosition(
  ref: RefObject<HTMLDivElement | null>,
  positionRef: RefObject<ReadingPosition>,
  scale: number,
  pageId: string
) {
  const size = useElementSize(ref);
  useLayoutEffect(() => {
    const area = ref.current,
      surface = area?.querySelector<HTMLElement>(".page-surface");
    if (!area || !surface) return;
    const bounds = area.getBoundingClientRect(),
      page = surface.getBoundingClientRect();
    area.scrollTo({
      left:
        area.scrollLeft +
        page.left -
        bounds.left +
        positionRef.current.x * page.width -
        area.clientWidth / 2,
      top:
        area.scrollTop +
        page.top -
        bounds.top +
        positionRef.current.y * page.height -
        area.clientHeight / 2,
    });
  }, [ref, positionRef, scale, pageId, size.width, size.height]);
  const remember = () => {
    const area = ref.current,
      surface = area?.querySelector<HTMLElement>(".page-surface");
    if (!area || !surface) return;
    const bounds = area.getBoundingClientRect(),
      page = surface.getBoundingClientRect();
    positionRef.current = {
      x: (bounds.left + area.clientWidth / 2 - page.left) / page.width,
      y: (bounds.top + area.clientHeight / 2 - page.top) / page.height,
    };
  };
  return { size, remember };
}
