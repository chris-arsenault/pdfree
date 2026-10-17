import { formatNumber } from "../i18n/format";
import { message } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { type CompressionOptions, type CompressionResult } from "../core/compressPdf";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { runProcessingWorker } from "../services/workerClient";
import { fontData, documentFontOptions } from "../services/resources";
import { ProcessingStatus } from "./ProcessingStatus";
import { PdfPreview } from "./PdfPreview";

export function CompressionControls({
  options,
  onChange,
  pageIds,
  flatten,
}: {
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
  /** Export page ids; empty means the whole document. */
  pageIds: string[];
  flatten: boolean;
}) {
  const editor = useEditor(),
    task = useProcessing(),
    [preview, setPreview] = useState<{ result: CompressionResult; before: Uint8Array } | null>(
      null
    );
  const [previewKey, setPreviewKey] = useState("");
  const key = JSON.stringify([options, pageIds, flatten, editor.history.revision]);
  const change = (value: CompressionOptions) => {
    setPreview(null);
    onChange(value);
  };
  const generate = () =>
    task.run(
      async (signal, progress) => {
        const bytes = await runProcessingWorker<Uint8Array>(
          {
            kind: "export",
            document: editor.document,
            flatten,
            pageIds,
            fonts: await fontData(documentFontOptions(editor.document, pageIds)),
          },
          signal,
          progress
        );
        const result = await runProcessingWorker<CompressionResult>(
          { kind: "compress", bytes, options },
          signal,
          progress
        );
        return { result, before: bytes };
      },
      (result) => {
        setPreview(result);
        setPreviewKey(key);
      }
    );
  return (
    <details className="utility-details">
      <summary>{tr("compression.title")}</summary>
      <fieldset className="utility-fields" disabled={task.busy}>
        <CompressionFields options={options} change={change} />
      </fieldset>
      <p className="field-note">{tr("compression.description")}</p>
      <button className="button secondary" disabled={task.busy} onClick={generate}>
        {tr("compression.preview")}
      </button>
      <ProcessingStatus task={task} />
      {preview && previewKey === key && <CompressionPreview {...preview} />}
    </details>
  );
}
function CompressionPreview({ result, before }: { result: CompressionResult; before: Uint8Array }) {
  return (
    <>
      <CompressionSummary result={result} />
      <div className="utility-grid">
        <div>
          <p className="field-note">{tr("compression.before")}</p>
          <PdfPreview bytes={before} />
        </div>
        <div>
          <p className="field-note">{tr("compression.after")}</p>
          <PdfPreview bytes={result.bytes} />
        </div>
      </div>
    </>
  );
}
function CompressionSummary({ result }: { result: CompressionResult }) {
  return (
    <p role="status">
      {tr("compression.summary", {
        before: formatNumber(result.originalSize / 1_000_000, { maximumFractionDigits: 2 }),
        after: formatNumber(result.bytes.length / 1_000_000, { maximumFractionDigits: 2 }),
        reduced: [message("compression.reducedCount", { count: result.processed })],
        retained: [message("compression.retainedCount", { count: result.skipped })],
      })}
      {!result.targetReached && tr("compression.targetUnsafe")}
    </p>
  );
}
function CompressionFields({
  options,
  change,
}: {
  options: CompressionOptions;
  change: (options: CompressionOptions) => void;
}) {
  return (
    <div className="utility-grid">
      <label>
        {tr("common.imageQuality")}
        <select
          value={options.preset}
          onChange={(event) =>
            change({ ...options, preset: event.target.value as CompressionOptions["preset"] })
          }
        >
          <option value="original">{tr("common.original")}</option>
          <option value="screen">{tr("compression.screen")}</option>
          <option value="balanced">{tr("common.balanced")}</option>
          <option value="print">{tr("compression.print")}</option>
        </select>
      </label>
      <label>
        {tr("compression.target")}
        <input
          type="number"
          min="0"
          step="0.1"
          value={options.targetBytes ? options.targetBytes / 1_000_000 : ""}
          onChange={(event) =>
            change({ ...options, targetBytes: Number(event.target.value) * 1_000_000 })
          }
        />
      </label>
    </div>
  );
}
