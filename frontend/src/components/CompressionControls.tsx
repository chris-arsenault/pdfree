import { useState } from "react";
import { type CompressionOptions, type CompressionResult } from "../core/compressPdf";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { runProcessingWorker } from "../services/workerClient";
import { fontData } from "../services/resources";
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
            fonts: await fontData(),
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
      <summary>PDF size and quality</summary>
      <fieldset className="utility-fields" disabled={task.busy}>
        <CompressionFields options={options} change={change} />
      </fieldset>
      <p className="field-note">
        Only supported image resources are changed. Text, vectors and interactive fields stay
        intact. Unsupported encodings and masks retain their original quality.
      </p>
      <button className="button secondary" disabled={task.busy} onClick={generate}>
        Preview size and quality
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
          <p className="field-note">Before · first page</p>
          <PdfPreview bytes={before} />
        </div>
        <div>
          <p className="field-note">After · first page</p>
          <PdfPreview bytes={result.bytes} />
        </div>
      </div>
    </>
  );
}
function CompressionSummary({ result }: { result: CompressionResult }) {
  return (
    <p role="status">
      {(result.originalSize / 1_000_000).toFixed(2)} →{" "}
      {(result.bytes.length / 1_000_000).toFixed(2)} MB · {result.processed} image(s) reduced ·{" "}
      {result.skipped} unsupported image(s) retained
      {!result.targetReached && " · Target size could not be reached safely"}
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
        Image quality
        <select
          value={options.preset}
          onChange={(event) =>
            change({ ...options, preset: event.target.value as CompressionOptions["preset"] })
          }
        >
          <option value="original">Original</option>
          <option value="screen">Screen · smallest</option>
          <option value="balanced">Balanced</option>
          <option value="print">Print · higher quality</option>
        </select>
      </label>
      <label>
        Target size (MB, optional)
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
