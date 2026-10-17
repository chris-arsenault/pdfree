import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { usePageContents } from "../hooks/usePageContents";
import { usePageScope, selectionOrAll } from "../hooks/usePageScope";
import { recognizePages, type RecognitionOutcome } from "../services/ocr";
import { recognizable } from "../services/pageContent";
import { Modal } from "./Modal";
import { ProcessingStatus } from "./ProcessingStatus";
import { PageScopeField } from "./PageScopeField";
import { OcrResults, ocrRows, type OcrRow } from "./OcrResults";

/**
 * Two views over the same page scope: Recognize chooses pages and runs OCR;
 * Results reports what each page holds. Pages that already carry recognition
 * open on Results, so reopening OCR shows earlier work instead of rerunning it.
 */
export function OcrDialog() {
  const editor = useEditor(),
    task = useProcessing();
  const scope = usePageScope(selectionOrAll(editor)),
    ids = scope.pageIds;
  const { contents, checked, ready } = usePageContents(ids);
  const [view, setView] = useState<"setup" | "results">(() =>
    editor.document.pages.some((page) => ids.includes(page.id) && page.recognition)
      ? "results"
      : "setup"
  );
  const [replace, setReplace] = useState(false);
  const [outcomes, setOutcomes] = useState<RecognitionOutcome[]>([]);
  const rows = ocrRows(editor.document, ids, contents, outcomes);
  const close = () => {
    task.cancel();
    editor.setDialog("");
  };
  const run = () =>
    task.run(
      (signal, progress) => recognizePages(editor.document, ids, signal, progress, { replace }),
      (result) => {
        editor.commit(result.document);
        setOutcomes(result.outcomes);
        setReplace(false);
        setView("results");
      }
    );
  return (
    <Modal title={tr("batch.recognize")} onClose={close} className="ocr-dialog">
      <div className="panel-tabs dialog-tabs" role="tablist" aria-label={tr("ocr.tabs")}>
        {(["setup", "results"] as const).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={view === name}
            disabled={task.busy}
            onClick={() => setView(name)}
          >
            {name === "setup" ? tr("common.recognize") : tr("common.results")}
          </button>
        ))}
      </div>
      {view === "setup" ? (
        <OcrSetup
          rows={rows}
          ready={ready}
          checked={checked}
          busy={task.busy}
          replace={replace}
          setReplace={setReplace}
          scope={scope}
          run={run}
        />
      ) : (
        <OcrResults
          rows={rows}
          recognizeMore={() => setView("setup")}
          close={() => editor.setDialog("")}
        />
      )}
      <ProcessingStatus task={task} />
    </Modal>
  );
}

function OcrSetup({
  rows,
  ready,
  checked,
  busy,
  replace,
  setReplace,
  scope,
  run,
}: {
  rows: OcrRow[];
  ready: boolean;
  checked: number;
  busy: boolean;
  replace: boolean;
  setReplace: (replace: boolean) => void;
  scope: ReturnType<typeof usePageScope>;
  run: () => void;
}) {
  const recognized = rows.filter((row) => row.recognition).length;
  const queued = rows.filter(
    (row) => row.content && recognizable(row.content) && (replace || !row.recognition)
  ).length;
  return (
    <>
      <p className="modal-description">{tr("ocr.description")}</p>
      <PageScopeField
        scope={scope.scope}
        onChange={scope.setScope}
        pageIds={scope.pageIds}
        error={scope.error}
        disabled={busy}
      />
      <OcrPlan rows={rows} ready={ready} checked={checked} replace={replace} />
      {recognized > 0 && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={replace}
            disabled={busy}
            onChange={(event) => setReplace(event.target.checked)}
          />
          {tr("ocr.replaceCount", { count: recognized })}
        </label>
      )}
      <div className="modal-actions">
        <button className="button primary" disabled={busy || !ready || !queued} onClick={run}>
          {setupLabel(ready, queued)}
        </button>
      </div>
    </>
  );
}

function setupLabel(ready: boolean, queued: number) {
  if (!ready) return tr("ocr.checking");
  return queued ? tr("ocr.recognizeCount", { count: queued }) : tr("ocr.nothing");
}

/** What a run would do with the chosen pages, before the user starts it. */
function OcrPlan({
  rows,
  ready,
  checked,
  replace,
}: {
  rows: OcrRow[];
  ready: boolean;
  checked: number;
  replace: boolean;
}) {
  if (!ready)
    return (
      <p className="ocr-plan" role="status">
        {tr("ocr.checkingCount", { count: checked, total: rows.length })}
      </p>
    );
  const count = (test: (row: OcrRow) => boolean) => rows.filter(test).length;
  const items = [
    {
      tone: "todo",
      count: count(
        (row) => !!row.content && recognizable(row.content) && (replace || !row.recognition)
      ),
      key: "ocr.planRecognize" as const,
    },
    {
      tone: "done",
      count: replace ? 0 : count((row) => !!row.recognition),
      key: "ocr.planKept" as const,
    },
    { tone: "skip", count: count((row) => row.content === "text"), key: "ocr.planText" as const },
    { tone: "skip", count: count((row) => row.content === "empty"), key: "ocr.planBlank" as const },
  ].filter((item) => item.count);
  return (
    <ul className="ocr-plan" aria-label={tr("ocr.plan")}>
      {items.map((item) => (
        <li key={item.key} className={`tone-${item.tone}`}>
          {tr(item.key, { count: item.count })}
        </li>
      ))}
      {!items.some((item) => item.tone === "todo") && (
        <li className="tone-skip">{tr("ocr.noRecognitionNeeded")}</li>
      )}
    </ul>
  );
}
