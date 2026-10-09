import { useState } from "react";
import { ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { useCleanupState, type CleanupState } from "../hooks/useCleanupState";
import { Modal } from "./Modal";
import { ProcessingStatus } from "./ProcessingStatus";
import { PageScopeField } from "./PageScopeField";
import { ScanPreview } from "./ScanPreview";
import { CleanupCorrections } from "./CleanupCorrections";
import { IconButton } from "./ui/IconButton";

/**
 * Scan cleanup around a sample page: analysis proposes corrections, the
 * preview shows their result live, and Apply analyzes and cleans every page.
 */
export function CleanupDialog() {
  const editor = useEditor(),
    state = useCleanupState();
  const { task } = state;
  return (
    <Modal
      title="Clean up scans"
      className="cleanup-dialog"
      onClose={() => {
        task.cancel();
        editor.setDialog("");
      }}
    >
      <div className="cleanup-layout">
        <CleanupStage state={state} />
        <div className="cleanup-side">
          <PageScopeField
            scope={state.scope.scope}
            onChange={state.scope.setScope}
            pageIds={state.scope.pageIds}
            error={state.scope.error}
            disabled={task.busy}
          />
          {state.analysis && (
            <CleanupCorrections
              analysis={state.analysis}
              page={state.numbers.get(state.sampleId) ?? 0}
              enabled={state.enabled}
              setEnabled={state.setEnabled}
              values={state.preview}
              edit={state.edit}
              support={state.support.get(state.sampleId)}
            />
          )}
          <SettingsMode state={state} />
          <SupportNote state={state} />
        </div>
      </div>
      <ProcessingStatus task={task} />
      {state.done && (
        <p className="cleanup-done" role="status">
          {state.done}
        </p>
      )}
      <div className="modal-actions">
        {state.cleaned.length > 0 && (
          <button className="button secondary" disabled={task.busy} onClick={state.restore}>
            Restore {state.cleaned.length} original page(s)
          </button>
        )}
        <button
          className="button primary"
          disabled={task.busy || !state.ids.length || !state.ready || !state.analysis}
          onClick={state.applyAll}
        >
          Apply to {state.ids.length} page(s)
        </button>
      </div>
    </Modal>
  );
}

function CleanupStage({ state }: { state: CleanupState }) {
  const [view, setView] = useState({ original: false, grid: false });
  const result = state.sample.result;
  let placeholder = "No scanned pages selected.";
  if (state.sample.error) placeholder = state.sample.error;
  else if (state.ids.length) placeholder = "Analyzing page…";
  return (
    <section className="cleanup-stage" aria-label="Preview">
      <div className="stage-bar">
        <SamplePicker state={state} />
        <div className="panel-tabs" role="tablist" aria-label="Preview version">
          {[false, true].map((original) => (
            <button
              key={String(original)}
              role="tab"
              aria-selected={view.original === original}
              onClick={() => setView({ ...view, original })}
            >
              {original ? "Original" : "Cleaned"}
            </button>
          ))}
        </div>
        <IconButton
          label="Alignment grid"
          icon={Grid3x3}
          aria-pressed={view.grid}
          className={view.grid ? "active" : ""}
          detail="Show straight guide lines over the preview."
          onClick={() => setView({ ...view, grid: !view.grid })}
        />
      </div>
      {result ? (
        <ScanPreview
          sample={result.sample}
          options={state.preview}
          original={view.original}
          grid={view.grid}
          onCrop={
            state.task.busy
              ? undefined
              : (crop) => {
                  state.setEnabled({ ...state.enabled, trim: true });
                  state.edit({ crop });
                }
          }
        />
      ) : (
        <div className="scan-preview placeholder" role="status">
          {placeholder}
        </div>
      )}
    </section>
  );
}

function SamplePicker({ state }: { state: CleanupState }) {
  const { ids, sampleId, numbers, choose } = state;
  const index = ids.indexOf(sampleId);
  return (
    <div className="sample-picker">
      <IconButton
        label="Previous page"
        icon={ChevronLeft}
        disabled={index <= 0}
        onClick={() => choose(ids[index - 1])}
      />
      <label>
        <span className="sr-only">Preview page</span>
        <select value={sampleId} onChange={(event) => choose(event.target.value)}>
          {ids.map((id) => (
            <option key={id} value={id}>
              Page {numbers.get(id)}
            </option>
          ))}
        </select>
      </label>
      <IconButton
        label="Next page"
        icon={ChevronRight}
        disabled={index < 0 || index >= ids.length - 1}
        onClick={() => choose(ids[index + 1])}
      />
    </div>
  );
}

function SettingsMode({ state }: { state: CleanupState }) {
  const { ids, shared, shareSettings } = state;
  if (ids.length < 2)
    return shared ? (
      <button className="text-button" onClick={() => shareSettings(false)}>
        Reset to detected settings
      </button>
    ) : null;
  return (
    <fieldset className="export-formats settings-mode">
      <legend>Settings for {ids.length} pages</legend>
      <label className="export-format">
        <input
          type="radio"
          name="cleanup-settings"
          checked={!shared}
          onChange={() => shareSettings(false)}
        />
        <span>
          Detect for each page
          <small>Each page is analyzed on its own; best for most scans.</small>
        </span>
      </label>
      <label className="export-format">
        <input
          type="radio"
          name="cleanup-settings"
          checked={!!shared}
          onChange={() => shareSettings(true)}
        />
        <span>
          Same settings on every page
          <small>Adjusting a value switches to this, starting from the previewed page.</small>
        </span>
      </label>
    </fieldset>
  );
}

function SupportNote({ state }: { state: CleanupState }) {
  const limited = state.ids.filter((id) => state.support.get(id)?.image);
  if (!limited.length) return null;
  return (
    <p className="field-note">
      Page {limited.map((id) => state.numbers.get(id)).join(", ")}{" "}
      {limited.length === 1 ? "is not" : "are not"} a single plain scan image, so only trimming
      applies there.
    </p>
  );
}
