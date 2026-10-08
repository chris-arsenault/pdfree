import { useEffect, useMemo, useRef, useState } from "react";
import { sourcePdf } from "../services/viewer";
import { type Page, type Source } from "../core/model";
import { viewerRasterRatio } from "../services/rasterBudget";

export function PageCanvas({
  page,
  source,
  scale,
  thumbnail = false,
}: {
  page: Page;
  source: Source | null;
  scale: number;
  thumbnail: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const { sourceIndex, rotation, box } = page;
  const { x, y, width, height } = box;
  const geometry = useMemo(
    () => ({ sourceIndex, rotation, x, y, width, height }),
    [sourceIndex, rotation, x, y, width, height]
  );
  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    const render = async () => {
      const canvas = ref.current;
      if (!canvas) return;
      const dimensions =
        geometry.rotation % 180 === 0
          ? { width: geometry.width, height: geometry.height }
          : { width: geometry.height, height: geometry.width };
      const desired = thumbnail ? 1 : Math.min(window.devicePixelRatio, 2);
      const ratio = viewerRasterRatio(dimensions.width, dimensions.height, scale, desired);
      canvas.width = Math.ceil(dimensions.width * scale * ratio);
      canvas.height = Math.ceil(dimensions.height * scale * ratio);
      if (!source) {
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        setError("");
        return;
      }
      const pdf = await sourcePdf(source);
      const original = await pdf.getPage(geometry.sourceIndex + 1);
      if (cancelled) return;
      const viewport = original.getViewport({ scale: scale * ratio, rotation: geometry.rotation });
      const rendering = original.render({ canvas, viewport, annotationMode: thumbnail ? 1 : 2 });
      task = rendering;
      await rendering.promise;
      if (!cancelled) setError("");
    };
    render().catch((error: Error) => {
      if (!cancelled) setError(`Page rendering failed: ${error.message}`);
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [geometry, source, scale, thumbnail]);
  return (
    <>
      <canvas
        ref={ref}
        className="pdf-canvas"
        aria-label={thumbnail ? "Page thumbnail" : "PDF page"}
      />
      {error && (
        <span role="alert" className="page-render-error">
          {error}
        </span>
      )}
    </>
  );
}
