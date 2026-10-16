import { useLayoutEffect, useState, type RefObject } from "react";

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setSize((previous) => {
        const next = { width: element.clientWidth, height: element.clientHeight };
        return previous.width === next.width && previous.height === next.height ? previous : next;
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
