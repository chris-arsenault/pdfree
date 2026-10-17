import { message, errorMessage } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
import { useMessageState } from "../i18n/react";
import { useEffect, useRef } from "react";
import { localPdf } from "../services/viewer";
export function PdfPreview({ bytes, pageIndex = 0 }: { bytes: Uint8Array; pageIndex?: number }) {
  const ref = useRef<HTMLCanvasElement>(null),
    [error, setError] = useMessageState();
  useEffect(() => {
    let disposed = false,
      pdf: Awaited<ReturnType<typeof localPdf>> | null = null;
    let rendering: { cancel: () => void } | null = null;
    const render = async () => {
      pdf = await localPdf(bytes.slice());
      if (disposed) {
        await pdf.destroy();
        return;
      }
      const page = await pdf.getPage(pageIndex + 1),
        size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(1, 500 / size.width, 260 / size.height),
      });
      const canvas = ref.current!;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const task = page.render({ canvas, viewport });
      rendering = task;
      await task.promise;
    };
    render().catch((error) => {
      if (!disposed) setError(errorMessage(error, message("preview.failed")));
    });
    return () => {
      disposed = true;
      rendering?.cancel();
      pdf?.destroy().catch(() => {});
    };
  }, [bytes, pageIndex]);
  return (
    <div className="utility-preview">
      <canvas ref={ref} aria-label={tr("preview.outputPage", { number: pageIndex + 1 })} />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
