import { useState } from "react";
import { type NupOptions } from "../core/nupPdf";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { runProcessingWorker } from "../services/workerClient";
import { fontData } from "../services/resources";
import { PdfPreview } from "./PdfPreview";
import { ProcessingStatus } from "./ProcessingStatus";
/** Printable-sheets Export format options; `pageIds` empty means the whole document. */
export function NupSheets({
  options,
  onChange,
  pageIds,
}: {
  options: NupOptions;
  onChange: (options: NupOptions) => void;
  pageIds: string[];
}) {
  const editor = useEditor(),
    task = useProcessing(),
    [preview, setPreview] = useState<{ bytes: Uint8Array; key: string } | null>(null);
  const key = JSON.stringify([options, pageIds, editor.history.revision]);
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
          pageIds,
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
    <fieldset className="utility-fields" disabled={task.busy}>
      <legend>Pages per printed sheet</legend>
      <NupFields options={options} change={change} />
      <p className="field-note">
        Places several pages on each sheet with field and comment appearances baked in. Interactive
        fields, comment threads and navigation are left out; keep a PDF or editing project for
        those. Print at actual size.
      </p>
      <button className="button secondary" disabled={task.busy} onClick={generate}>
        Preview first sheet
      </button>
      <ProcessingStatus task={task} />
      {preview?.key === key && <PdfPreview bytes={preview.bytes} />}
    </fieldset>
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
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="6">6</option>
        </select>
      </label>
      <NupPaperFields options={options} change={change} />
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
