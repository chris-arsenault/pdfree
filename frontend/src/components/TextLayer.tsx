import { useEffect, useRef } from "react";
import { TextLayer as PdfTextLayer } from "pdfjs-dist";
import { type Page, type Source } from "../core/model";
import { sourcePage } from "../services/viewer";
import { usePageBackground } from "../hooks/usePageBackground";
import { toDisplay } from "../core/coordinates";
import { recognizedPosition } from "../core/recognition";
export function TextLayer({
  page,
  source,
  scale,
}: {
  page: Page;
  source: Source | null;
  scale: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { background, assets } = usePageBackground(page);
  useEffect(() => {
    let cancelled = false,
      layer: PdfTextLayer | null = null;
    let release = () => {};
    const render = async () => {
      const container = ref.current;
      if (!source || !container) return;
      const view = await sourcePage(source, background, assets),
        original = view.page;
      release = view.release;
      if (cancelled) {
        release();
        return;
      }
      const content = await original.getTextContent();
      if (cancelled) return;
      container.replaceChildren();
      layer = new PdfTextLayer({
        textContentSource: content,
        container,
        viewport: original.getViewport({ scale, rotation: background.rotation }),
      });
      await layer.render();
    };
    render().catch((error: Error) => {
      if (!cancelled) console.error(error.message);
    });
    return () => {
      cancelled = true;
      layer?.cancel();
      release();
    };
  }, [background, source, scale, assets]);
  return (
    <>
      <div ref={ref} className="textLayer" style={{ "--total-scale-factor": scale }} />
      {!!page.recognition && (
        <div className="recognized-layer">
          {page.recognition.words.map((word, index) => {
            const position = recognizedPosition(page, word);
            const box = toDisplay(position, page);
            return (
              <span
                key={index}
                style={{
                  "--word-left": `${box.x * scale}px`,
                  "--word-top": `${box.y * scale}px`,
                  "--word-width": `${word.width * scale}px`,
                  "--word-height": `${word.height * scale}px`,
                  "--word-size": `${word.height * scale}px`,
                  "--word-angle": `${page.rotation - position.angle}deg`,
                }}
              >
                {word.text}{" "}
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
