import { useState } from "react";
import { type NupOptions } from "../core/nupPdf";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { runProcessingWorker } from "../services/workerClient";
import { fontData } from "../services/resources";
import { PdfPreview } from "./PdfPreview";
import { ProcessingStatus } from "./ProcessingStatus";
export function NupControls({
  options,
  onChange,
  selected,
}: {
  options: NupOptions;
  onChange: (options: NupOptions) => void;
  selected: boolean;
}) {
  const editor = useEditor(),
    task = useProcessing(),
    [preview, setPreview] = useState<{ bytes: Uint8Array; key: string } | null>(null);
  const key = JSON.stringify([options, selected, editor.selectedPageIds, editor.history.revision]);
  const change = (options: NupOptions) => {
    setPreview(null);
    onChange(options);
  };
  const generate = () =>
    task.run(async (signal, progress) => {
      const bytes = await runProcessingWorker<Uint8Array>(
        {
          kind: "export",
          document: editor.document,
          flatten: true,
          pageIds: selected ? editor.selectedPageIds : [],
          fonts: await fontData(),
        },
        signal,
        progress
      );
      return {
        bytes: await runProcessingWorker<Uint8Array>(
          { kind: "nup", bytes, options },
          signal,
          progress
        ),
        key,
      };
    }, setPreview);
  return (
    <details className="utility-details">
      <summary>Pages per printed sheet</summary>
      <fieldset className="utility-fields" disabled={task.busy}>
        <NupFields options={options} change={change} />
      </fieldset>
      {options.count !== 1 && (
        <>
          <p className="field-note">
            Creates a separate printable PDF with baked field and annotation appearances.
            Interactive fields, comment threads and navigation stay in your ordinary PDF/project.
            Print this derivative at actual size.
          </p>
          <button className="button secondary" disabled={task.busy} onClick={generate}>
            Preview first sheet
          </button>
          <ProcessingStatus task={task} />
          {preview?.key === key && <PdfPreview bytes={preview.bytes} />}
        </>
      )}
    </details>
  );
}
function NupFields({
  options,
  change,
}: {
  options: NupOptions;
  change: (options: NupOptions) => void;
}) {
  return (
    <div className="utility-grid">
      <label>
        Pages per sheet
        <select
          value={options.count}
          onChange={(event) =>
            change({ ...options, count: Number(event.target.value) as NupOptions["count"] })
          }
        >
          <option value="1">1 · ordinary PDF</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="6">6</option>
        </select>
      </label>
      {options.count !== 1 && <NupPaperFields options={options} change={change} />}
    </div>
  );
}
function NupPaperFields({
  options,
  change,
}: {
  options: NupOptions;
  change: (options: NupOptions) => void;
}) {
  return (
    <>
      <label>
        Paper
        <select
          value={options.paper}
          onChange={(event) =>
            change({ ...options, paper: event.target.value as NupOptions["paper"] })
          }
        >
          <option value="letter">Letter</option>
          <option value="a4">A4</option>
          <option value="legal">Legal</option>
        </select>
      </label>
      <label>
        Orientation
        <select
          value={options.landscape ? "landscape" : "portrait"}
          onChange={(event) =>
            change({ ...options, landscape: event.target.value === "landscape" })
          }
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      <label>
        Ordering
        <select
          value={options.order}
          onChange={(event) =>
            change({ ...options, order: event.target.value as NupOptions["order"] })
          }
        >
          <option value="rows">Across, then down</option>
          <option value="columns">Down, then across</option>
        </select>
      </label>
      <label>
        Margin / gap (points)
        <input
          type="number"
          min="0"
          max="100"
          value={options.margin}
          onChange={(event) => change({ ...options, margin: Number(event.target.value) })}
        />
      </label>
    </>
  );
}
