import { useEffect, useRef } from "react";
import { TextLayer as PdfTextLayer } from "pdfjs-dist";
import { type Page, type Source } from "../core/model";
import { sourcePage } from "../services/viewer";
import { usePageBackground } from "../hooks/usePageBackground";
import { toDisplay } from "../core/coordinates";
import { recognizedPosition, uncertainConfidence } from "../core/recognition";
export function TextLayer({
  page,
  source,
  scale,
  revealed,
}: {
  page: Page;
  source: Source | null;
  scale: number;
  /** Outline recognized words so OCR coverage and doubtful words can be reviewed. */
  revealed: boolean;
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
      {!!page.recognition && <RecognizedWords page={page} scale={scale} revealed={revealed} />}
    </>
  );
}
function RecognizedWords({
  page,
  scale,
  revealed,
}: {
  page: Page;
  scale: number;
  revealed: boolean;
}) {
  return (
    <div className={`recognized-layer ${revealed ? "revealed" : ""}`}>
      {page.recognition!.words.map((word, index) => {
        const position = recognizedPosition(page, word);
        const box = toDisplay(position, page);
        return (
          <span
            key={index}
            className={word.confidence < uncertainConfidence ? "uncertain" : undefined}
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
  );
}
