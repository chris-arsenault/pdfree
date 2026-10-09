import { useEffect, useState } from "react";
import { useEditor } from "./editorContext";
import { type ScanSupport } from "../core/scanCleanup";
import { type ScanAnalysis } from "../core/scanAnalysis";
import { analyzeSample, renderSample, type ScanSample } from "../services/scanSample";
import { runPdfWorker } from "../services/workerClient";

export type AnalyzedSample = { sample: ScanSample; analysis: ScanAnalysis };

/**
 * Renders and analyzes one sample page. Analyses are kept per page for the
 * dialog's lifetime so applying per-page settings reuses pages already seen.
 */
export function useSampleAnalysis(pageId: string, cache: Map<string, ScanAnalysis>) {
  const editor = useEditor(),
    document = editor.document;
  const [state, setState] = useState<{ id: string; result?: AnalyzedSample; error?: string }>({
    id: "",
  });
  useEffect(() => {
    if (!pageId) return;
    const controller = new AbortController();
    renderSample(document, pageId, controller.signal)
      .then((sample) => {
        const analysis = cache.get(pageId) ?? analyzeSample(sample);
        cache.set(pageId, analysis);
        if (!controller.signal.aborted) setState({ id: pageId, result: { sample, analysis } });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setState({ id: pageId, error: error.message });
      });
    return () => controller.abort();
  }, [document, pageId, cache]);
  const current = state.id === pageId ? state : { id: pageId };
  return {
    result: current.result,
    error: current.error ?? "",
    loading: !current.result && !current.error,
  };
}

/** Which corrections each page in scope can take, checked once per scope. */
export function useScanSupport(pageIds: string[]) {
  const editor = useEditor(),
    document = editor.document;
  const [support, setSupport] = useState<ReadonlyMap<string, ScanSupport>>(new Map());
  const key = pageIds.join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];
    runPdfWorker<ScanSupport[]>({ kind: "scan-support", document, pageIds: ids })
      .then((items) => {
        if (!cancelled) setSupport(new Map(items.map((item) => [item.pageId, item])));
      })
      .catch((error: Error) => {
        if (!cancelled) console.error(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [document, key]);
  return { support, ready: pageIds.every((id) => support.has(id)) };
}
