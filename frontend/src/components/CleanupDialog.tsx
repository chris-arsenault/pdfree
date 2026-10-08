import { useState } from "react";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { type CleanupOptions } from "../core/scanCleanup";
import { type EditorDocument } from "../core/model";
import { runProcessingWorker } from "../services/workerClient";
import { fontData } from "../services/resources";
import { Modal } from "./Modal";
import { ProcessingStatus } from "./ProcessingStatus";
import { PdfPreview } from "./PdfPreview";
const defaults: CleanupOptions = {
  angle: 0,
  contrast: 1,
  background: 0,
  crop: { left: 0, right: 0, top: 0, bottom: 0 },
};
async function cleanupPreview(
  document: EditorDocument,
  ids: string[],
  options: CleanupOptions,
  signal: AbortSignal,
  progress: (message: string) => void
) {
  const cleaned = await runProcessingWorker<EditorDocument>(
    { kind: "cleanup", document, pageIds: ids, options },
    signal,
    progress
  );
  const fonts = await fontData();
  const before = await runProcessingWorker<Uint8Array>(
    { kind: "export", document, pageIds: [], flatten: true, fonts },
    signal,
    progress
  );
  const after = await runProcessingWorker<Uint8Array>(
    { kind: "export", document: cleaned, pageIds: [], flatten: true, fonts },
    signal,
    progress
  );
  return { document: cleaned, before, after };
}
export function CleanupDialog() {
  const editor = useEditor(),
    task = useProcessing();
  const [options, setOptions] = useState(defaults),
    [all, setAll] = useState(false);
  const [preview, setPreview] = useState<{
    document: EditorDocument;
    before: Uint8Array;
    after: Uint8Array;
  } | null>(null);
  const ids = all ? editor.document.pages.map((page) => page.id) : editor.selectedPageIds;
  const change = (options: CleanupOptions) => {
    setPreview(null);
    setOptions(options);
  };
  const generate = () =>
    task.run(
      (signal, progress) => cleanupPreview(editor.document, ids, options, signal, progress),
      setPreview
    );
  return (
    <Modal
      title="Clean up scans"
      onClose={() => {
        task.cancel();
        editor.setDialog("");
      }}
    >
      <p className="field-note">
        Crop hides content; it does not redact it. Image cleanup supports a single upright
        RGB/grayscale scan with an optional OCR text layer. Mixed artwork and masked images are
        rejected.
      </p>
      <fieldset className="utility-fields" disabled={task.busy}>
        <CleanupFields options={options} change={change} />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={all}
            onChange={(event) => {
              setAll(event.target.checked);
              setPreview(null);
            }}
          />
          All pages
        </label>
      </fieldset>
      <ProcessingStatus task={task} />
      {preview && (
        <CleanupPreview
          {...preview}
          pageIndex={editor.document.pages.findIndex((page) => page.id === ids[0])}
        />
      )}
      <div className="modal-actions">
        <button className="button secondary" disabled={task.busy} onClick={() => change(defaults)}>
          Reset settings
        </button>
        <button className="button secondary" disabled={task.busy} onClick={generate}>
          Preview
        </button>
        <button
          className="button primary"
          disabled={task.busy || !preview}
          onClick={() => {
            if (preview) editor.commit(preview.document);
            editor.setDialog("");
          }}
        >
          Apply to {ids.length} page(s)
        </button>
      </div>
    </Modal>
  );
}
function CleanupFields({
  options,
  change,
}: {
  options: CleanupOptions;
  change: (options: CleanupOptions) => void;
}) {
  return (
    <div className="utility-grid">
      <label>
        Deskew angle (°)
        <input
          type="number"
          min="-10"
          max="10"
          step="0.1"
          value={options.angle}
          onChange={(event) => change({ ...options, angle: Number(event.target.value) })}
        />
      </label>
      <label>
        Contrast
        <input
          type="number"
          min="0.5"
          max="3"
          step="0.1"
          value={options.contrast}
          onChange={(event) => change({ ...options, contrast: Number(event.target.value) })}
        />
      </label>
      <label>
        Background cleanup
        <input
          type="range"
          min="0"
          max="100"
          value={options.background}
          onChange={(event) => change({ ...options, background: Number(event.target.value) })}
        />
      </label>
      {(["left", "right", "top", "bottom"] as const).map((side) => (
        <label key={side}>
          Crop {side} (points)
          <input
            type="number"
            min="0"
            step="1"
            value={options.crop[side]}
            onChange={(event) =>
              change({
                ...options,
                crop: { ...options.crop, [side]: Number(event.target.value) },
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
function CleanupPreview({
  before,
  after,
  pageIndex,
}: {
  before: Uint8Array;
  after: Uint8Array;
  pageIndex: number;
}) {
  return (
    <div className="utility-grid">
      <div>
        <p className="field-note">Before · page {pageIndex + 1}</p>
        <PdfPreview bytes={before} pageIndex={pageIndex} />
      </div>
      <div>
        <p className="field-note">After · page {pageIndex + 1}</p>
        <PdfPreview bytes={after} pageIndex={pageIndex} />
      </div>
    </div>
  );
}
