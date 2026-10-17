import { useMessageState } from "../i18n/react";
import { useState } from "react";
import { useEditor } from "./editorContext";
import { useProcessing } from "./useProcessing";
import { usePageScope, selectionOrAll } from "./usePageScope";
import { useSampleAnalysis, useScanSupport } from "./useScanCleanup";
import {
  analyzedOptions,
  cleanupSummary,
  enabledOptions,
  noCleanup,
  recommendedOptions,
  supportedOptions,
  type CleanupOptions,
  type Corrections,
  type ScanAnalysis,
} from "../core/scanAnalysis";
import { type EditorDocument } from "../core/model";
import { type PageCleanup, type ScanSupport } from "../core/scanCleanup";
import { analyzePages } from "../services/scanSample";
import { runProcessingWorker } from "../services/workerClient";
import { message, type UiMessage } from "../i18n/messages";

const allCorrections: Corrections = {
  straighten: true,
  contrast: true,
  background: true,
  trim: true,
};
const supported = { image: null, straighten: null };

/** Settings for one page: its own analysis, or the shared settings when the user chose them. */
function pageOptions(
  analysis: ScanAnalysis | undefined,
  shared: CleanupOptions | null,
  enabled: Corrections,
  support: Pick<ScanSupport, "image" | "straighten"> = supported
) {
  let options = noCleanup;
  if (shared) options = enabledOptions(shared, enabled);
  else if (analysis) options = analyzedOptions(analysis, enabled);
  return supportedOptions(options, { image: !!support.image, straighten: !!support.straighten });
}

/**
 * Cleanup dialog state. Every page is analyzed and gets its own settings
 * unless the user adjusts a value, which switches to one shared setting
 * seeded from the sample page.
 */
export function useCleanupState() {
  const editor = useEditor(),
    task = useProcessing();
  const scope = usePageScope(selectionOrAll(editor));
  const numbers = new Map(editor.document.pages.map((page, index) => [page.id, index + 1]));
  // Inserted blank pages have no source image and nothing to clean.
  const ids = editor.document.pages
    .filter((page) => page.sourceId && scope.pageIds.includes(page.id))
    .map((page) => page.id);
  const [chosen, setChosen] = useState("");
  const sampleId = ids.includes(chosen) ? chosen : (ids[0] ?? "");
  const [cache] = useState(() => new Map<string, ScanAnalysis>());
  const sample = useSampleAnalysis(sampleId, cache);
  const { support, ready } = useScanSupport(ids);
  const [enabled, updateEnabled] = useState(allCorrections);
  const [shared, setShared] = useState<CleanupOptions | null>(null);
  const [done, setDone] = useMessageState();
  const analysis = sample.result?.analysis;
  const edit = (patch: Partial<CleanupOptions>) => {
    if (!analysis) return;
    setShared({ ...(shared ?? recommendedOptions(analysis)), ...patch });
    setDone(null);
  };
  const apply = (requests: () => PageCleanup[], analyze: boolean) =>
    task.run(
      (signal, progress) =>
        runCleanup(editor.document, analyze ? ids : [], cache, requests, signal, progress),
      ({ document, pages }) => {
        editor.commit(document);
        setDone(summaryText(pages));
      }
    );
  const cleaned = ids.filter((id) => support.get(id)?.cleaned);
  return {
    task,
    scope,
    ids,
    numbers,
    sampleId,
    choose: setChosen,
    sample,
    analysis,
    support,
    ready,
    enabled,
    setEnabled: (next: Corrections) => {
      updateEnabled(next);
      setDone(null);
    },
    shared,
    shareSettings: (on: boolean) => setShared(on && analysis ? recommendedOptions(analysis) : null),
    edit,
    preview: pageOptions(analysis, shared, enabled, support.get(sampleId)),
    done,
    cleaned,
    applyAll: () =>
      apply(
        () =>
          ids.map((id) => ({
            pageId: id,
            options: pageOptions(cache.get(id), shared, enabled, support.get(id)),
          })),
        !shared
      ),
    restore: () => apply(() => cleaned.map((id) => ({ pageId: id, options: noCleanup })), false),
  };
}
export type CleanupState = ReturnType<typeof useCleanupState>;

/** Analyzes pages not seen yet, then cleans them in a disposable worker. */
async function runCleanup(
  document: EditorDocument,
  analyze: string[],
  cache: Map<string, ScanAnalysis>,
  requests: () => PageCleanup[],
  signal: AbortSignal,
  progress: (ui: UiMessage) => void
) {
  const missing = analyze.filter((id) => !cache.has(id));
  const found = await analyzePages(document, missing, signal, progress);
  found.forEach((value, id) => cache.set(id, value));
  const pages = requests();
  const cleaned = await runProcessingWorker<EditorDocument>(
    { kind: "cleanup", document, pages },
    signal,
    progress
  );
  return { document: cleaned, pages };
}

function summaryText(pages: PageCleanup[]) {
  if (pages.every((page) => page.options === noCleanup))
    return message("cleanup.restored", { count: pages.length });
  const summary = cleanupSummary(pages.map((page) => page.options));
  const parts = (
    [
      [summary.straightened, "cleanup.summaryStraightened"],
      [summary.whitened, "cleanup.summaryWhitened"],
      [summary.darkened, "cleanup.summaryDarkened"],
      [summary.trimmed, "cleanup.summaryTrimmed"],
    ] as const
  )
    .filter(([count]) => count)
    .map(([count, label]) => message(label, { count }));
  return parts.length
    ? message("cleanup.cleaned", { count: pages.length, parts })
    : message("cleanup.noneNeeded");
}
