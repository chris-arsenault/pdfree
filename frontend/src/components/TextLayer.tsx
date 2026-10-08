import { useEffect, useRef } from "react";
import { TextLayer as PdfTextLayer } from "pdfjs-dist";
import { type Page, type Source } from "../core/model";
import { sourcePdf } from "../services/viewer";
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
  useEffect(() => {
    let cancelled = false,
      layer: PdfTextLayer | null = null;
    const render = async () => {
      const container = ref.current;
      if (!source || !container) return;
      const original = await (await sourcePdf(source)).getPage(page.sourceIndex + 1);
      const content = await original.getTextContent();
      if (cancelled) return;
      container.replaceChildren();
      layer = new PdfTextLayer({
        textContentSource: content,
        container,
        viewport: original.getViewport({ scale, rotation: page.rotation }),
      });
      await layer.render();
    };
    render().catch((error: Error) => {
      if (!cancelled) console.error(error.message);
    });
    return () => {
      cancelled = true;
      layer?.cancel();
    };
  }, [page.sourceIndex, page.rotation, source, scale]);
  return <div ref={ref} className="textLayer" style={{ "--total-scale-factor": scale }} />;
}
