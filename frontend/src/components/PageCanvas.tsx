import { useEffect, useRef, useState } from "react";
import { sourcePage } from "../services/viewer";
import { usePageBackground } from "../hooks/usePageBackground";
import { type Page, type Source } from "../core/model";
import { viewerRasterRatio } from "../services/rasterBudget";
import { displaySize } from "../core/coordinates";

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
  const { background, assets } = usePageBackground(page);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    let release = () => {};
    const render = async () => {
      const canvas = ref.current;
      if (!canvas) return;
      const dimensions = displaySize(background);
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
      const view = await sourcePage(source, background, assets),
        original = view.page;
      release = view.release;
      if (cancelled) {
        release();
        return;
      }
      const viewport = original.getViewport({
        scale: scale * ratio,
        rotation: background.rotation,
      });
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
      release();
    };
  }, [source, scale, thumbnail, background, assets]);
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
