import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { type NupOptions } from "../core/nupPdf";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { runProcessingWorker } from "../services/workerClient";
import { fontData, documentFontOptions } from "../services/resources";
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
          fonts: await fontData(documentFontOptions(editor.document, pageIds)),
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
      <legend>{tr("print.sheetsTitle")}</legend>
      <NupFields options={options} change={change} />
      <p className="field-note">{tr("print.sheetsDescription")}</p>
      <button className="button secondary" disabled={task.busy} onClick={generate}>
        {tr("print.preview")}
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
        {tr("print.perSheet")}
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
        {tr("print.paper")}
        <select
          value={options.paper}
          onChange={(event) =>
            change({ ...options, paper: event.target.value as NupOptions["paper"] })
          }
        >
          <option value="letter">{tr("paper.letter")}</option>
          <option value="a4">A4</option>
          <option value="legal">{tr("paper.legal")}</option>
        </select>
      </label>
      <label>
        {tr("print.orientation")}
        <select
          value={options.landscape ? "landscape" : "portrait"}
          onChange={(event) =>
            change({ ...options, landscape: event.target.value === "landscape" })
          }
        >
          <option value="portrait">{tr("print.portrait")}</option>
          <option value="landscape">{tr("print.landscape")}</option>
        </select>
      </label>
      <label>
        {tr("print.order")}
        <select
          value={options.order}
          onChange={(event) =>
            change({ ...options, order: event.target.value as NupOptions["order"] })
          }
        >
          <option value="rows">{tr("print.across")}</option>
          <option value="columns">{tr("print.down")}</option>
        </select>
      </label>
      <label>
        {tr("print.margins")}
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
